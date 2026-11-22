"""
GlobalPulse AI - Daily Brief Service
Generates a comprehensive 450-700 word Daily Brief summarizing the best
published articles from the past 24 hours.
Strictly grounded in existing articles; zero new outside sourcing or invented facts.
"""

import os
import re
import json
import logging
from collections import Counter
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
load_dotenv()

try:
    from database import SessionLocal
    from models import Article, ArticleStatus
    from editorial_config import (
        CATEGORY_FOCUS,
        BANNED_WORDS,
        SENSITIVE_BLOCK_TERMS,
        HEADLINE_MAX_LENGTH,
        META_DESC_MIN_LENGTH,
        META_DESC_MAX_LENGTH,
        EDITORIAL_BYLINE
    )
    from services.ai_service import (
        get_gemini_cooldown_remaining,
        call_gemini_api,
        clean_json_text,
        verify_output_facts,
        sanitize_banned_phrases,
    )
except (ImportError, ValueError):
    from backend.database import SessionLocal
    from backend.models import Article, ArticleStatus
    from backend.editorial_config import (
        CATEGORY_FOCUS,
        BANNED_WORDS,
        SENSITIVE_BLOCK_TERMS,
        HEADLINE_MAX_LENGTH,
        META_DESC_MIN_LENGTH,
        META_DESC_MAX_LENGTH,
        EDITORIAL_BYLINE
    )
    from backend.services.ai_service import (
        get_gemini_cooldown_remaining,
        call_gemini_api,
        clean_json_text,
        verify_output_facts,
        sanitize_banned_phrases,
    )

logger = logging.getLogger("daily_brief")


def get_daily_brief_candidates(db) -> List[Article]:
    """
    Fetches candidate articles from the past 24 hours:
    - status == PUBLISHED
    - is_noindex == False
    - published_at within last 24h
    - slug does not start with 'daily-brief-'
    - category in CATEGORY_FOCUS
    Sorted by views descending, then published_at descending.
    Top 7 articles.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    query = (
        db.query(Article)
        .filter(
            Article.status == ArticleStatus.PUBLISHED.value,
            Article.is_noindex == False,
            Article.published_at >= cutoff,
            ~Article.slug.like("daily-brief-%")
        )
    )
    if CATEGORY_FOCUS:
        query = query.filter(Article.category.in_(CATEGORY_FOCUS))

    from sqlalchemy import func
    candidates = (
        query
        .order_by(
            func.coalesce(Article.views, 0).desc(),
            Article.published_at.desc()
        )
        .limit(7)
        .all()
    )
    return candidates


def normalize_daily_brief_meta_description(meta: str, date_display: str) -> str:
    """
    Ensures the meta description is a single complete grammatical sentence
    strictly between 140 and 155 characters ending with a period.
    """
    clean = re.sub(r'\s+', ' ', (meta or "")).strip()
    if 140 <= len(clean) <= 155 and clean.endswith('.'):
        return clean

    # If slightly too long, truncate cleanly before 154 chars at word boundary
    if len(clean) > 155:
        trimmed = clean[:154].rsplit(' ', 1)[0].rstrip(' ,;:-') + '.'
        if 140 <= len(trimmed) <= 155:
            return trimmed

    # If too short, try expanding with natural context
    base = clean.rstrip('. ')
    extensions = [
        f". Read our complete {date_display} daily briefing.",
        f", based on verified reporting from our newsroom.",
        f", according to confirmed news reports on the wire.",
        f". Here is our verified {date_display} news briefing.",
        f", based on confirmed daily news dispatches.",
    ]
    for ext in extensions:
        cand = f"{base}{ext}"
        if 140 <= len(cand) <= 155:
            return cand

    # If still not matching length, trim base and fit extension
    for ext in extensions:
        target_base_len = 154 - len(ext)
        if target_base_len > 25 and len(base) >= target_base_len:
            trimmed_base = base[:target_base_len].rsplit(' ', 1)[0].rstrip(' ,;:-')
            cand = f"{trimmed_base}{ext}"
            if 140 <= len(cand) <= 155:
                return cand

    fallback = f"The GlobalPulse AI Daily Brief for {date_display} brings you essential facts, numbers and verified context from our top reporting across technology and sport."
    if len(fallback) > 155:
        return fallback[:154].rsplit(" ", 1)[0] + "."
    return fallback


def run_daily_brief(dry_run: bool = False) -> Dict[str, Any]:
    """
    Main Daily Brief generation and publication pipeline.
    """
    db = SessionLocal()
    try:
        today_utc = datetime.now(timezone.utc)
        slug_date = today_utc.strftime("%Y-%m-%d")
        target_slug = f"daily-brief-{slug_date}"
        date_display = today_utc.strftime("%d %b")  # e.g. "22 Nov"
        date_full = today_utc.strftime("%A, %d %B %Y")

        # 1. Idempotency Check
        existing = db.query(Article).filter(Article.slug == target_slug).first()
        if existing:
            msg = f"daily brief skipped: {target_slug} already exists"
            logger.info(msg)
            print(f"[Daily Brief] {msg}")
            return {
                "status": "skipped",
                "reason": f"{target_slug} already exists",
                "slug": target_slug
            }

        # 2. Candidate Selection
        candidates = get_daily_brief_candidates(db)
        if len(candidates) < 4:
            msg = f"daily brief skipped: only {len(candidates)} articles"
            logger.info(msg)
            print(f"[Daily Brief] {msg}")
            return {
                "status": "skipped",
                "reason": f"only {len(candidates)} articles",
                "candidates_count": len(candidates)
            }

        # 3. Gemini Cooldown Check
        cooldown_remaining = get_gemini_cooldown_remaining()
        if cooldown_remaining > 0:
            msg = f"daily brief skipped: Gemini cooldown active ({int(cooldown_remaining)}s remaining)"
            logger.warning(msg)
            print(f"[Daily Brief] {msg}")
            return {
                "status": "skipped",
                "reason": "Gemini cooldown active"
            }

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            msg = "daily brief failed: GEMINI_API_KEY missing"
            logger.error(msg)
            print(f"[Daily Brief] {msg}")
            return {
                "status": "failed",
                "reason": "GEMINI_API_KEY missing"
            }

        # 4. Build Candidate Pack and Source Verification Text
        story_blocks = []
        for i, c in enumerate(candidates, 1):
            excerpt = (c.content or "").strip()[:1200]
            story_blocks.append(
                f"STORY #{i}:\n"
                f"Title: {c.title}\n"
                f"Category: {c.category}\n"
                f"Slug: {c.slug}\n"
                f"Summary: {c.summary or ''}\n"
                f"Excerpt: {excerpt}"
            )
        candidate_text = "\n\n".join(story_blocks)

        combined_source_text = (
            f"Today's Date: {date_full} ({date_display} {today_utc.year})\n\n"
            + "\n\n".join([
                f"{c.title}\n{c.summary or ''}\n{(c.content or '')[:1200]}\nSlug: {c.slug}"
                for c in candidates
            ])
        )

        banned_str = ", ".join(BANNED_WORDS)

        # 5. Build Single Gemini Prompt
        prompt = f"""You are a senior news editor writing the GlobalPulse AI "Daily Brief" for US and UK readers.
The date of this brief is {date_full} ({date_display}).

Your task is to write a comprehensive, readable Daily Brief summarizing our top {len(candidates)} stories from the past 24 hours.

CANDIDATE STORIES:
{candidate_text}

EDITORIAL RULES:
1. STRICT FACTUAL GROUNDING: Use ONLY facts, numbers, dates, and quotes explicitly stated in the candidate stories above. NEVER invent, assume, or extrapolate any numbers, dates, days of the week, names, or events.
2. HEADLINE: Maximum 60 characters total. It MUST include "Daily Brief" and the date "{date_display}".
   Example: "Daily Brief, {date_display}: Anthropic IPO and Top Stories"
   The headline MUST NOT exceed 60 characters in total length.
3. BODY STRUCTURE: Between 450 and 700 words in clear, plain journalistic English. Follow this exact structure:
   - A short introduction (2-3 sentences) setting the context of today's key stories.
   - For EACH candidate story, a dedicated section formatted as:
     ### <Story Title or Topic Name>
     Followed by 3 to 4 sentences explaining what happened, key numbers/dates, and why it matters.
     At the end of this story section, on its own line:
     [Read the full article](/news/<slug>)
     where <slug> is the exact slug provided for that story.
   - At the very end, a final section:
     ### What to watch next
     2 to 3 sentences summarizing upcoming developments mentioned in the candidate stories (no invented forecasts).
   Total word count of the body MUST be at least 450 words (aim for 500-620 words).
4. FORBIDDEN WORDS:
   Never use any of these words: {banned_str}
   Never use unsupported adjectives like 'brilliant', 'crucial', 'major', 'dismantling', 'dominant', 'stunning', or 'masterclass'.
   Avoid using the word 'may' as a verb (use 'can', 'could', or 'might' instead).
5. SENSITIVE TOPICS: Do not include scandals or allegations.
6. JSON OUTPUT ONLY:
{{
  "headline": "Daily Brief, {date_display}: ...",
  "meta_description": "A single complete grammatical sentence between 140 and 155 characters summarizing the brief.",
  "body": "Full article body (450-700 words) with headings and [Read the full article](/news/<slug>) links.",
  "confidence": "full"
}}
Set "confidence" to "full" ONLY if the body is at least 450 words and every story includes its [Read the full article](/news/<slug>) link.
"""

        # 6. Single Gemini Call
        raw_response, api_err = call_gemini_api(prompt, api_key)
        if api_err or not raw_response:
            msg = f"daily brief Gemini call failed: {api_err or 'Empty response'}"
            logger.error(msg)
            print(f"[Daily Brief] {msg}")
            return {
                "status": "failed",
                "reason": msg
            }

        # 7. Parse and Sanitize JSON
        cleaned = clean_json_text(raw_response)
        try:
            data = json.loads(cleaned, strict=False)
        except Exception:
            sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned)
            data = json.loads(sanitized, strict=False)

        headline = sanitize_banned_phrases(data.get("headline", "")).strip()
        meta_description = sanitize_banned_phrases(data.get("meta_description", "")).strip()
        body = sanitize_banned_phrases(data.get("body", "")).strip()
        confidence = str(data.get("confidence", "")).strip().lower()

        # Enforce headline length max 60 chars
        if len(headline) > HEADLINE_MAX_LENGTH:
            truncated = headline[:HEADLINE_MAX_LENGTH]
            headline = truncated.rsplit(" ", 1)[0].rstrip() if " " in truncated else truncated

        # Enforce meta description format & length
        meta_description = normalize_daily_brief_meta_description(meta_description, date_display)

        # 8. Quality Gate Checks
        gate_passed = True
        gate_failures = []

        # Gate Check 1: confidence == "full"
        if confidence != "full":
            gate_passed = False
            gate_failures.append(f"confidence is '{confidence}' (expected 'full')")

        # Gate Check 2: body >= 450 words
        body_words = len(body.split())
        if body_words < 450:
            gate_passed = False
            gate_failures.append(f"body word count {body_words} < 450 words")

        # Gate Check 3: At least 4 internal /news/ links
        internal_links = re.findall(r'\[(?:Read the full article|[^\]]+)\]\(/news/([a-zA-Z0-9\-_]+)\)', body)
        if len(internal_links) < 4:
            gate_passed = False
            gate_failures.append(f"internal links count {len(internal_links)} < 4")

        # Gate Check 4: headline <= 60 characters
        if len(headline) > HEADLINE_MAX_LENGTH:
            gate_passed = False
            gate_failures.append(f"headline length {len(headline)} > {HEADLINE_MAX_LENGTH}")

        # Gate Check 5: meta 140-155 characters
        if not (META_DESC_MIN_LENGTH <= len(meta_description) <= META_DESC_MAX_LENGTH):
            gate_passed = False
            gate_failures.append(f"meta length {len(meta_description)} not in {META_DESC_MIN_LENGTH}-{META_DESC_MAX_LENGTH}")

        # Gate Check 6: SENSITIVE_BLOCK_TERMS check
        combined_text = f"{headline} {meta_description} {body}".lower()
        for term in SENSITIVE_BLOCK_TERMS:
            if re.search(r'\b' + re.escape(term.lower()) + r'\b', combined_text):
                gate_passed = False
                gate_failures.append(f"contains sensitive term: '{term}'")

        # Gate Check 7: verify_output_facts against combined candidate sources
        output_check = {
            "headline": headline,
            "meta_description": meta_description,
            "body": body,
            "key_points": []
        }
        facts_valid, unverified = verify_output_facts(output_check, combined_source_text)
        real_unverified = []
        for u in unverified:
            if u == "Month 'may'":
                # Check if 'may' was used as calendar month (e.g. 'in may', 'early may', 'may 2026')
                if re.search(r'\b(?:in|during|of|early|late|mid)\s+may\b|\bmay\s+\d{1,2}\b', combined_text, re.IGNORECASE):
                    real_unverified.append(u)
            else:
                real_unverified.append(u)

        if real_unverified:
            gate_passed = False
            gate_failures.append(f"verify_output_facts unverified tokens: {real_unverified[:5]}")

        # Quality Gate Outcome Logging
        if not gate_passed:
            logger.warning(f"daily brief gate failed: {gate_failures}")
            print(f"[Daily Brief Gate Failed] {gate_failures}")

        result_payload = {
            "headline": headline,
            "word_count": body_words,
            "candidates_count": len(candidates),
            "links_count": len(internal_links),
            "gate_passed": gate_passed,
            "failures": gate_failures,
            "body_preview": body[:600],
            "meta_description": meta_description,
            "slug": target_slug
        }

        # Dry Run Mode: Return without persisting or indexing
        if dry_run:
            result_payload["status"] = "dry_run"
            return result_payload

        # If quality gate failed in real run, do not publish
        if not gate_passed:
            result_payload["status"] = "failed"
            result_payload["reason"] = f"Quality gate failed: {'; '.join(gate_failures)}"
            return result_payload

        # 9. Publish Article
        cat_counts = Counter(c.category for c in candidates)
        top_category = cat_counts.most_common(1)[0][0] if cat_counts else "AI & Tech"
        top_image_url = candidates[0].image_url if candidates and candidates[0].image_url else None
        summary_bullets = "\n".join([f"• {c.title.rstrip('.')}" for c in candidates[:3]])

        new_article = Article(
            title=headline,
            slug=target_slug,
            category=top_category,
            summary=summary_bullets,
            content=body,
            author_name="GlobalPulse AI Desk",
            source_name="GlobalPulse AI Desk",
            source_url=None,
            image_url=top_image_url,
            status=ArticleStatus.PUBLISHED.value,
            published_at=datetime.now(timezone.utc),
            is_noindex=False,
            video_status="IDLE"
        )
        db.add(new_article)
        db.commit()
        db.refresh(new_article)
        logger.info(f"Daily Brief published successfully: #{new_article.id} {target_slug}")
        print(f"[Daily Brief] Published successfully: #{new_article.id} ({target_slug})")

        # 10. Instant IndexNow Notification
        try:
            try:
                from services.indexing_service import notify_search_engines_new_article
            except (ImportError, ValueError):
                from backend.services.indexing_service import notify_search_engines_new_article
            notify_search_engines_new_article(target_slug)
            print(f"[Daily Brief] IndexNow notified for {target_slug}")
        except Exception as idx_err:
            print(f"[Daily Brief Indexer Notice] {idx_err}")

        result_payload["status"] = "published"
        result_payload["article_id"] = new_article.id
        return result_payload

    except Exception as e:
        logger.error(f"Error in run_daily_brief: {e}", exc_info=True)
        print(f"[Daily Brief ERROR] {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return {
            "status": "error",
            "reason": str(e)
        }
    finally:
        try:
            db.close()
        except Exception:
            pass
