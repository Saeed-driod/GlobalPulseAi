import os
import re
import json
import traceback
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

try:
    from ..database import get_db, SessionLocal
    from ..models import Article, ArticleStatus
    from .scraper import fetch_breaking_rss_news
    from .ai_service import process_raw_news, get_gemini_cooldown_remaining, process_deep_research_news
    from .research import build_source_pack, can_do_deep_research_today, record_deep_research_done
    from .video_generator import compose_short_video, compose_video
    from .youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube
    from .youtube_quota import can_post_now, record_youtube_upload
    from .trends import get_trending_terms
    from ..editorial_config import DAILY_PUBLISHING_CAP, CATEGORY_FOCUS, EDITORIAL_BYLINE
except (ImportError, ValueError):
    try:
        from database import get_db, SessionLocal
        from models import Article, ArticleStatus
        from services.scraper import fetch_breaking_rss_news
        from services.ai_service import process_raw_news, get_gemini_cooldown_remaining, process_deep_research_news
        from services.research import build_source_pack, can_do_deep_research_today, record_deep_research_done
        from services.video_generator import compose_short_video, compose_video
        from services.youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube
        from services.youtube_quota import can_post_now, record_youtube_upload
        from services.trends import get_trending_terms
        from editorial_config import DAILY_PUBLISHING_CAP, CATEGORY_FOCUS, EDITORIAL_BYLINE
    except (ImportError, ValueError):
        from backend.database import get_db, SessionLocal
        from backend.models import Article, ArticleStatus
        from backend.services.scraper import fetch_breaking_rss_news
        from backend.services.ai_service import process_raw_news, get_gemini_cooldown_remaining, process_deep_research_news
        from backend.services.research import build_source_pack, can_do_deep_research_today, record_deep_research_done
        from backend.services.video_generator import compose_short_video, compose_video
        from backend.services.youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube
        from backend.services.youtube_quota import can_post_now, record_youtube_upload
        from backend.services.trends import get_trending_terms
        from backend.editorial_config import DAILY_PUBLISHING_CAP, CATEGORY_FOCUS, EDITORIAL_BYLINE


def slugify(text: str) -> str:
    """Generate clean SEO-friendly slug from title, max 80 chars cut at word boundary."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    slug = re.sub(r'[\s-]+', '-', text).strip('-')
    if len(slug) > 80:
        if slug[80] == '-':
            slug = slug[:80].strip('-')
        else:
            truncated = slug[:80]
            if '-' in truncated:
                slug = truncated.rsplit('-', 1)[0].strip('-')
            else:
                slug = truncated
    return slug


def are_titles_duplicate(title1: str, title2: str) -> bool:
    """Checks semantic equivalence between two headlines to prevent duplicate publishing."""
    if not title1 or not title2:
        return False
    t1 = title1.strip().lower()
    t2 = title2.strip().lower()
    if t1 == t2:
        return True

    w1 = set(w for w in re.sub(r'[^a-zA-Z0-9\s]', '', t1).split() if len(w) > 3)
    w2 = set(w for w in re.sub(r'[^a-zA-Z0-9\s]', '', t2).split() if len(w) > 3)
    if not w1 or not w2:
        return False

    common = w1.intersection(w2)
    min_len = min(len(w1), len(w2))
    overlap = len(common) / min_len if min_len > 0 else 0
    if len(common) >= 3 and overlap >= 0.45:
        return True
    if len(common) >= 4:
        return True
    return False


def is_item_trending(c_item: Dict[str, Any], t_terms: List[str]) -> bool:
    """Checks if a raw story candidate matches any active trending search terms."""
    if not t_terms:
        return False
    text = f"{c_item.get('raw_title', '')} {c_item.get('raw_summary', '')}"
    for term in t_terms:
        if len(term) >= 2 and re.search(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE):
            return True
    return False


REJECTED_CACHE_FILE = Path(__file__).resolve().parent.parent / "rejected_stories.json"
REJECTED_CACHE_TTL_SECONDS = 24 * 3600  # 24 hours


def _clean_url_key(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    return url.split("?")[0].rstrip("/").strip().lower()


def _normalize_title_key(title: str) -> str:
    return re.sub(r'[^a-z0-9]', '', (title or "").lower())


def load_rejected_stories() -> Dict[str, float]:
    """Loads rejected stories cache and purges entries older than 24 hours."""
    if not REJECTED_CACHE_FILE.exists():
        return {}
    try:
        with open(REJECTED_CACHE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        now = datetime.now(timezone.utc).timestamp()
        valid = {k: float(ts) for k, ts in data.items() if (now - float(ts)) < REJECTED_CACHE_TTL_SECONDS}
        return valid
    except Exception as e:
        print(f"[Rejected Cache Notice] Could not read cache: {e}")
        return {}


def save_rejected_stories(cache: Dict[str, float]) -> None:
    """Saves rejected stories cache atomically."""
    try:
        tmp_file = REJECTED_CACHE_FILE.with_suffix(".tmp")
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
        tmp_file.replace(REJECTED_CACHE_FILE)
    except Exception as e:
        print(f"[Rejected Cache Notice] Could not save cache: {e}")


def is_story_rejected(source_url: Optional[str], raw_title: str) -> bool:
    """Checks whether a story was rejected by the quality gate within the last 24 hours."""
    cache = load_rejected_stories()
    if not cache:
        return False
    now = datetime.now(timezone.utc).timestamp()
    url_key = _clean_url_key(source_url)
    if url_key and url_key in cache:
        if (now - cache[url_key]) < REJECTED_CACHE_TTL_SECONDS:
            return True
    title_key = _normalize_title_key(raw_title)
    if title_key and title_key in cache:
        if (now - cache[title_key]) < REJECTED_CACHE_TTL_SECONDS:
            return True
    return False


def record_rejected_story(source_url: Optional[str], raw_title: str, reason: str = "") -> None:
    """Remembers a rejected candidate story for 24 hours so it is not sent to Gemini repeatedly."""
    try:
        cache = load_rejected_stories()
        now = datetime.now(timezone.utc).timestamp()
        url_key = _clean_url_key(source_url)
        if url_key:
            cache[url_key] = now
        title_key = _normalize_title_key(raw_title)
        if title_key:
            cache[title_key] = now
        save_rejected_stories(cache)
        print(f"[Rejected Cache] Cached story '{raw_title[:45]}' for 24h skip ({reason})")
    except Exception as e:
        print(f"[Rejected Cache Notice] Could not record story rejection: {e}")


def is_story_duplicate(db: Session, raw_title: str, source_url: Optional[str] = None) -> bool:
    """Checks if a story is a duplicate by URL, exact title, or semantic word overlap."""
    if source_url:
        clean_url = source_url.split("?")[0].rstrip("/")
        if db.query(Article).filter(Article.source_url.ilike(f"{clean_url}%")).first():
            return True

    recent_articles = db.query(Article).order_by(Article.id.desc()).limit(200).all()
    for art in recent_articles:
        if are_titles_duplicate(raw_title, art.title):
            return True
    return False


def run_full_automation_pipeline(limit: int = 1, db: Optional[Session] = None, video_format: str = "long") -> Dict[str, Any]:
    """
    Unified Master Automation Pipeline:
    Executes sequentially:
    1. Fetch latest raw news from Tier-1 RSS feeds.
    2. Process and rewrite via Gemini AI (headline, TL;DR, markdown, 60s shorts script).
    3. Generate 16:9 Long-Form HD MP4 video (or 9:16 Shorts) with neural voiceover.
    4. Upload video to YouTube for channel ('GlobalPulseAI') via OAuth2 credentials (client_secret.json / token.json).
    5. Update article status to PUBLISHED, linking YouTube video ID, and publish live on portal.
    """
    is_long = (str(video_format).lower() == "long")
    fmt_str = "16:9 Long-Form HD" if is_long else "9:16 Shorts"
    print("\n=======================================================")
    print(f"[Master Pipeline] STARTING 24/7 AUTOMATION PIPELINE ({fmt_str})")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=======================================================")

    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    # Check if Gemini 429 cooldown is active
    cooldown_secs = get_gemini_cooldown_remaining()
    if cooldown_secs > 0:
        mins = int(cooldown_secs // 60)
        secs = int(cooldown_secs % 60)
        print(f"[Master Pipeline] Gemini 429 cooldown active ({mins}m {secs}s remaining). Halting pipeline run early.")
        if close_session:
            db.close()
        return {
            "success": False,
            "message": f"Gemini cooldown active ({mins}m {secs}s remaining after HTTP 429).",
            "processed_count": 0,
            "articles": []
        }

    try:
        # Step 1: Fetch Breaking News from Global RSS Wires
        print("\n[Step 1/5] Fetching breaking stories from RSS feeds...")
        raw_items = fetch_breaking_rss_news(limit=max(limit * 5, 15))
        if not raw_items:
            print("[Master Pipeline] No raw items fetched from RSS feeds.")
            return {
                "success": False,
                "message": "No news items available from RSS sources.",
                "processed_count": 0,
                "articles": []
            }

        # Find fresh stories not yet published (Strict deduplication gate across DB and in-batch)
        candidate_items = []
        for item in raw_items:
            r_title = item.get("raw_title", "")
            r_url = item.get("source_url")
            # 0. Check against rejected stories cache (rejected in last 24h)
            if is_story_rejected(r_url, r_title):
                continue
            # 1. Check against DB
            if is_story_duplicate(db, r_title, r_url):
                continue
            # 2. Check against items already accepted into this candidate batch!
            if any(are_titles_duplicate(r_title, c.get("raw_title", "")) for c in candidate_items):
                continue
            candidate_items.append(item)

        # Priority boost for items containing trending search terms
        trending_terms: List[str] = []
        try:
            trending_terms = get_trending_terms() or []
            if trending_terms and candidate_items:
                def trending_priority_score(c_item: Dict[str, Any]) -> int:
                    text = f"{c_item.get('raw_title', '')} {c_item.get('raw_summary', '')}"
                    score = 0
                    for term in trending_terms:
                        if len(term) >= 2 and re.search(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE):
                            score += 1
                    return score

                candidate_items.sort(key=trending_priority_score, reverse=True)
                boosted_count = sum(1 for c_item in candidate_items if trending_priority_score(c_item) > 0)
                if boosted_count > 0:
                    print(f"[Master Pipeline] Priority boost applied: {boosted_count} story item(s) matched current Google Trending searches.")
        except Exception as trend_err:
            print(f"[Master Pipeline Trends Notice] {trend_err}")

        # If all stories from this fetch cycle already exist in DB, STOP. NEVER re-publish duplicate stories!
        if not candidate_items:
            print("[Master Pipeline] All active wires previously indexed. Zero duplicates generated.")
            return {
                "success": True,
                "message": "All current RSS news items are already published. No duplicates generated.",
                "processed_count": 0,
                "articles": []
            }

        published_articles: List[Article] = []

        # Check per-run Gemini attempt limit (GEMINI_MAX_STORIES_PER_RUN, default 5)
        max_stories_env = os.getenv("GEMINI_MAX_STORIES_PER_RUN", "5")
        try:
            max_gemini_stories_per_run = int(max_stories_env)
        except ValueError:
            max_gemini_stories_per_run = 5
        gemini_stories_attempted = 0
        deep_stories_run_count = 0

        # Check today's published count against DAILY_PUBLISHING_CAP
        now_utc = datetime.now(timezone.utc)
        start_of_day = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        published_today = db.query(Article).filter(
            Article.status == ArticleStatus.PUBLISHED.value,
            Article.published_at >= start_of_day
        ).count()

        if published_today >= DAILY_PUBLISHING_CAP:
            print(f"[Master Pipeline] Daily publishing cap of {DAILY_PUBLISHING_CAP} reached for today ({published_today} published). Halting further publishing.")
            return {
                "success": True,
                "message": f"Daily publishing cap of {DAILY_PUBLISHING_CAP} stories reached for today.",
                "processed_count": 0,
                "articles": []
            }

        for item in candidate_items:
            if len(published_articles) >= limit or (published_today + len(published_articles)) >= DAILY_PUBLISHING_CAP:
                print(f"[Master Pipeline] Reached target publication limit or daily cap.")
                break

            # Check if all models entered cooldown
            if get_gemini_cooldown_remaining() > 0:
                print("[Master Pipeline] All Gemini models in 429 cooldown. Halting candidate processing.")
                break

            # Limit candidate stories sent to Gemini per run to prevent burning daily quota
            if gemini_stories_attempted >= max_gemini_stories_per_run:
                print(f"[Master Pipeline] Reached per-run Gemini attempt cap ({gemini_stories_attempted}/{max_gemini_stories_per_run} via GEMINI_MAX_STORIES_PER_RUN). Halting further attempts this run.")
                break

            gemini_stories_attempted += 1

            try:
                # Check eligibility for Deep Research mode (trending items, max 3 per run, max 5/day)
                is_trending = is_item_trending(item, trending_terms)
                is_deep_eligible = (
                    is_trending
                    and deep_stories_run_count < 3
                    and can_do_deep_research_today()
                )

                source_pack = []
                if is_deep_eligible:
                    print(f"\n[Deep Research] Story matched trending term. Building multi-source pack: '{item['raw_title'][:60]}...'")
                    try:
                        source_pack = build_source_pack(candidate=item, all_raw_items=raw_items, trending_terms=trending_terms)
                    except Exception as sp_err:
                        print(f"[Deep Research Error] Failed building source pack: {sp_err}")
                        source_pack = []

                if is_deep_eligible and len(source_pack) >= 2:
                    deep_stories_run_count += 1
                    outlets_preview = [s.get("outlet") for s in source_pack]
                    print(f"[Deep Research] Sourced {len(source_pack)} outlets for deep dive: {outlets_preview}. Synthesizing with Gemini (400-700 words)...")
                    ai_data = process_deep_research_news(
                        raw_title=item["raw_title"],
                        source_pack=source_pack,
                        suggested_category=item.get("suggested_category", "AI & Tech"),
                        raw_image_url=item.get("raw_image_url"),
                        trending_terms=trending_terms
                    )
                else:
                    if is_deep_eligible:
                        print(f"[Deep Research] Insufficient corroborating sources ({len(source_pack)} found). Falling back to standard short flow.")
                    print(f"\n[Step 2/5] Synthesizing with Gemini AI: '{item['raw_title'][:60]}...'")
                    ai_data = process_raw_news(
                        raw_title=item["raw_title"],
                        raw_summary=item["raw_summary"],
                        source_name=item["source_name"],
                        suggested_category=item.get("suggested_category"),
                        source_url=item.get("source_url", ""),
                        raw_image_url=item.get("raw_image_url")
                    )

                is_deep = bool(ai_data.get("is_deep_research", False))
                sources_count = ai_data.get("sources_count", 1)
                outlets_str = ai_data.get("source_name") or item.get("source_name", "Unknown")
                body_text = ai_data.get("body") or ""
                body_words = ai_data.get("word_count") or len(body_text.split())
                title_for_log = ai_data.get("title") or item.get("raw_title", "")
                gen_path = ai_data.get("generation_path", "unknown")
                gem_err = ai_data.get("gemini_error")
                err_info = f" | gemini_error='{gem_err}'" if gem_err else ""

                # The fallback synthesizer must NEVER publish an article by itself
                if gen_path == "fallback":
                    print(f"[Master Pipeline] Story '{title_for_log[:50]}' was generated by fallback path{err_info}. Fallback articles cannot be published live. Skipping.")
                    continue

                is_genuine_gemini = (gen_path == "gemini" and not gem_err)

                # Quality Gate 1: Check confidence and body word count
                # Deep research requires confidence == "full" and body_words >= 400
                # Standard short flow requires confidence == "full" and body_words >= 120
                confidence = str(ai_data.get("confidence") or "").strip().lower()
                min_required_words = 400 if is_deep else 120
                if confidence != "full" or body_words < min_required_words:
                    reason = f"confidence='{confidence}', words={body_words} < {min_required_words}"
                    if is_deep:
                        print(f"[Deep Story Log] Headline: '{title_for_log}' | Sources: {sources_count} ({outlets_str}) | Words: {body_words} | Published: False | Result: REJECTED | Reason: {reason}{err_info}")
                    else:
                        print(f"[Master Pipeline] Quality Gate: Article '{title_for_log[:50]}' rejected | path='{gen_path}' | {reason}{err_info}. Skipping publication.")
                    if is_genuine_gemini:
                        record_rejected_story(item.get("source_url"), item.get("raw_title", ""), reason=f"{reason}, path={gen_path}")
                    else:
                        print(f"[Master Pipeline] Rejection not cached: generated by path='{gen_path}' or had error ('{gem_err}'). Will re-try when Gemini is available.")
                    continue

                # Quality Gate 2: Check CATEGORY_FOCUS
                if CATEGORY_FOCUS and ai_data["category"] not in CATEGORY_FOCUS:
                    reason = f"category '{ai_data['category']}' not in active CATEGORY_FOCUS {CATEGORY_FOCUS}"
                    if is_deep:
                        print(f"[Deep Story Log] Headline: '{title_for_log}' | Sources: {sources_count} ({outlets_str}) | Words: {body_words} | Published: False | Result: REJECTED | Reason: {reason}")
                    else:
                        print(f"[Master Pipeline] Quality Gate: {reason} | path='{gen_path}'{err_info}. Skipping.")
                    if is_genuine_gemini:
                        record_rejected_story(item.get("source_url"), item.get("raw_title", ""), reason=f"category={ai_data['category']}")
                    continue

                # Secondary check: verify synthesized title doesn't already exist
                existing_synth = db.query(Article).filter(Article.title == ai_data["title"]).first()
                if existing_synth:
                    if is_deep:
                        print(f"[Deep Story Log] Headline: '{title_for_log}' | Sources: {sources_count} ({outlets_str}) | Words: {body_words} | Published: False | Result: REJECTED | Reason: duplicate headline in DB")
                    else:
                        print(f"[Master Pipeline] Synthesized story '{ai_data['title'][:50]}' already in DB. Skipping duplicate.")
                    continue

                # Generate unique SEO slug
                base_slug = slugify(ai_data["title"])
                slug = base_slug
                if db.query(Article).filter(Article.slug == slug).first():
                    if is_deep:
                        print(f"[Deep Story Log] Headline: '{title_for_log}' | Sources: {sources_count} ({outlets_str}) | Words: {body_words} | Published: False | Result: REJECTED | Reason: slug '{slug}' already exists")
                    else:
                        print(f"[Master Pipeline] Slug '{slug}' already exists. Skipping duplicate story.")
                    continue

                # Save initial article as IMMEDIATELY PUBLISHED in DB so it goes live on website first!
                article = Article(
                    title=ai_data["title"],
                    slug=slug,
                    category=ai_data["category"],
                    summary=ai_data["summary"],
                    content=ai_data["content"],
                    source_url=ai_data.get("source_url") or item.get("source_url"),
                    source_name=ai_data.get("source_name") or item.get("source_name"),
                    image_url=ai_data.get("image_url"),
                    youtube_script=ai_data.get("youtube_script"),
                    author_name=ai_data.get("author_name") or EDITORIAL_BYLINE,
                    status=ArticleStatus.PUBLISHED.value,
                    published_at=datetime.now(timezone.utc),
                    views=0,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(article)
                db.commit()
                db.refresh(article)
                published_articles.append(article)
                print(f"[Master Pipeline] Article #{article.id} PUBLISHED live on portal (slug: {slug})")

                if is_deep:
                    record_deep_research_done()
                    print(f"[Deep Story Log] Headline: '{article.title}' | Sources: {sources_count} ({outlets_str}) | Words: {body_words} | Published: True | Result: PUBLISHED")

                # Log headline and trending search term used for owner review
                trending_term = ai_data.get("trending_term_used") or "none"
                print(f"[Trends Review] Headline: '{article.title}' | Trending Term: {trending_term}")
                try:
                    log_file = Path(__file__).resolve().parent.parent / "trends_published.log"
                    with open(log_file, "a", encoding="utf-8") as tf:
                        tf.write(f"{datetime.now(timezone.utc).isoformat()} | ID: {article.id} | Trending Term: {trending_term} | Headline: {article.title}\n")
                except Exception:
                    pass

                # Instant Search Engine Indexing (IndexNow + Bing/Google Ping)
                try:
                    from .indexing_service import notify_search_engines_new_article
                    notify_search_engines_new_article(slug)
                except Exception as idx_err:
                    print(f"[Search Indexer Notice] {idx_err}")

                # Paced Facebook Page Auto-Post (strictly paced every 20-30 mins to avoid spam)
                try:
                    from .facebook_poster import maybe_auto_post_next_article
                    maybe_auto_post_next_article(db, min_interval_seconds=1200)
                except Exception as fb_err:
                    print(f"[Master Pipeline Facebook Notice] {fb_err}")

                # Step 3 & 4: Render MP4 Video and Upload to YouTube
                # Safe Guard: Render has a 512MB RAM limit. Heavy FFmpeg video rendering is offloaded to Local PC Worker
                cloud_video_enabled = os.getenv("CLOUD_VIDEO_RENDER_ENABLED", "false").lower() in ("true", "1", "yes")

                if not cloud_video_enabled:
                    print(f"[Master Pipeline] ⚡ CLOUD VIDEO RENDERING IS OFFLOADED to Local PC Worker.")
                    print(f"[Master Pipeline] Article #{article.id} is live! Run 'python local_worker.py --daemon' on your PC to render & upload with zero cloud RAM usage.")
                else:
                    try:
                        print(f"\n[Step 3/5] Rendering {fmt_str} MP4 video with neural voiceover...")
                        video_res = compose_video(
                            article_id=article.id,
                            title=article.title,
                            category=article.category,
                            youtube_script=article.youtube_script or article.summary,
                            summary=article.summary,
                            content=article.content,
                            image_url=article.image_url,
                            video_format=video_format
                        )
                        article.video_path = video_res.get("video_path")
                        db.commit()
                        db.refresh(article)
                        print(f"[Master Pipeline] Video rendered successfully: {article.video_path} ({video_res.get('resolution')})")

                        # Step 4: Check Daily Limits & Upload to YouTube (GlobalPulseAI channel)
                        if article.youtube_video_id and article.youtube_video_id != "dQw4w9WgXcQ":
                            print(f"[Master Pipeline] Article #{article.id} already has YouTube video: {article.youtube_video_id}")
                            can_upload = False
                            quota_reason = "Already uploaded to YouTube"
                        else:
                            can_upload, quota_reason = can_post_now(db, video_format=video_format, ignore_cooldown=False)
                        if not can_upload:
                            print(f"[Master Pipeline DAILY QUOTA LIMIT] Skipping YouTube upload: {quota_reason}")
                        else:
                            print(f"\n[Step 4/5] Uploading {fmt_str} video to YouTube Data API v3 (channel: GlobalPulseAI)...")
                            video_disk_path = article.video_path or ""
                            if video_disk_path.startswith("/static/"):
                                backend_dir = Path(__file__).resolve().parent.parent
                                video_disk_path = str(backend_dir / video_disk_path.lstrip("/"))

                            upload_res = upload_short_to_youtube(
                                video_filepath=video_disk_path,
                                title=article.title,
                                summary=article.summary,
                                category=article.category,
                                slug=article.slug,
                                video_format=video_format
                            )

                            # Step 5: Attach YouTube video ID and record in daily quota ledger
                            video_id = upload_res.get("video_id") or upload_res.get("youtube_video_id") or "dQw4w9WgXcQ"
                            if video_id and video_id != "dQw4w9WgXcQ":
                                article.youtube_video_id = video_id
                                db.commit()
                                db.refresh(article)
                                record_youtube_upload(
                                    db=db,
                                    article_id=article.id,
                                    youtube_video_id=video_id,
                                    video_format=video_format,
                                    title=article.title,
                                    category=article.category
                                )
                                print(f"[Master Pipeline] Article #{article.id} successfully attached YouTube Video ID: {video_id}")
                    except Exception as vid_err:
                        print(f"[Master Pipeline WARNING] Video rendering/upload issue for article #{article.id}: {vid_err}")
                        traceback.print_exc()
                    try:
                        try:
                            from ..main import record_error
                        except (ImportError, ValueError):
                            from main import record_error
                        record_error("pipeline_video_upload", vid_err, article_id=article.id)
                    except Exception:
                        pass
                    # Article remains PUBLISHED live on the portal!

            except Exception as e:
                print(f"[Master Pipeline ERROR] Error synthesizing article item: {e}")
                traceback.print_exc()
                db.rollback()
                continue

        print("\n=======================================================")
        print(f"[Master Pipeline] COMPLETED. Published {len(published_articles)} article(s).")
        print("=======================================================\n")

        return {
            "success": True,
            "message": f"Master automation complete: Synthesized, rendered video, and published {len(published_articles)} article(s) to YouTube and live portal.",
            "processed_count": len(published_articles),
            "articles": [
                {
                    "id": a.id,
                    "title": a.title,
                    "slug": a.slug,
                    "category": a.category,
                    "video_path": a.video_path,
                    "youtube_video_id": a.youtube_video_id,
                    "youtube_url": f"https://www.youtube.com/shorts/{a.youtube_video_id}",
                    "status": a.status,
                    "published_at": (
                        (a.published_at.replace(tzinfo=timezone.utc).isoformat() if a.published_at.tzinfo is None else a.published_at.astimezone(timezone.utc).isoformat()).replace("+00:00", "Z")
                        if a.published_at else None
                    )
                }
                for a in published_articles
            ]
        }

    finally:
        if close_session:
            db.close()
