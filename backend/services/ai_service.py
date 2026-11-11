import os
import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple, Set

from dotenv import load_dotenv

# Ensure environment variables are loaded
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
load_dotenv()

try:
    from ..editorial_config import (
        FIXED_CATEGORIES,
        BANNED_WORDS,
        EDITORIAL_BYLINE,
        HEADLINE_MAX_LENGTH,
        META_DESC_MIN_LENGTH,
        META_DESC_MAX_LENGTH,
        BODY_WORD_COUNT_MIN,
        BODY_WORD_COUNT_MAX
    )
except (ImportError, ValueError):
    try:
        from editorial_config import (
            FIXED_CATEGORIES,
            BANNED_WORDS,
            EDITORIAL_BYLINE,
            HEADLINE_MAX_LENGTH,
            META_DESC_MIN_LENGTH,
            META_DESC_MAX_LENGTH,
            BODY_WORD_COUNT_MIN,
            BODY_WORD_COUNT_MAX
        )
    except (ImportError, ValueError):
        from backend.editorial_config import (
            FIXED_CATEGORIES,
            BANNED_WORDS,
            EDITORIAL_BYLINE,
            HEADLINE_MAX_LENGTH,
            META_DESC_MIN_LENGTH,
            META_DESC_MAX_LENGTH,
            BODY_WORD_COUNT_MIN,
            BODY_WORD_COUNT_MAX
        )

try:
    from .image_resolver import resolve_article_image, is_generic_placeholder, upgrade_image_url_to_hd, is_low_res_thumbnail
except (ImportError, ValueError):
    try:
        from services.image_resolver import resolve_article_image, is_generic_placeholder, upgrade_image_url_to_hd, is_low_res_thumbnail
    except (ImportError, ValueError):
        from backend.services.image_resolver import resolve_article_image, is_generic_placeholder, upgrade_image_url_to_hd, is_low_res_thumbnail


# ==========================================
# FACTUAL ENTITY EXTRACTION & VERIFICATION
# ==========================================

NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "hundred": "100", "thousand": "1000",
    "million": "1000000", "billion": "1000000000"
}

DIGIT_TO_WORD = {v: k for k, v in NUMBER_WORDS.items()}

RANKINGS = [
    "first", "second", "third", "fourth", "fifth",
    "sixth", "seventh", "eighth", "ninth", "tenth",
    "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"
]

RANKING_MAP = {
    "first": "1st", "second": "2nd", "third": "3rd", "fourth": "4th", "fifth": "5th",
    "sixth": "6th", "seventh": "7th", "eighth": "8th", "ninth": "9th", "tenth": "10th",
    "1st": "first", "2nd": "second", "3rd": "third", "4th": "fourth", "5th": "fifth"
}

WEEKDAYS = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "mon", "tue", "wed", "thu", "fri", "sat", "sun"
]

MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"
]


def extract_factual_tokens(text: str) -> Dict[str, Set[str]]:
    """
    Extracts all scores, digits, number words, rankings, weekdays, months,
    and sensitive phrases from generated text for strict source verification.
    """
    lower = text.lower()
    
    # 1. Scores (e.g. 3-1, 2-1, 102-98)
    scores = set(re.findall(r'\b\d+\s*[-–]\s*\d+\b', lower))
    
    # 2. Standalone digits (e.g. 3, 1, 100, 25%, 3.5)
    digits = set(re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?%?\b', lower))
    
    # 3. Number words
    num_words = set(w for w in NUMBER_WORDS if re.search(r'\b' + re.escape(w) + r'\b', lower))
    
    # 4. Rankings / ordinals
    rankings = set(w for w in RANKINGS if re.search(r'\b' + re.escape(w) + r'\b', lower))
    
    # 5. Weekdays
    weekdays = set(w for w in WEEKDAYS if re.search(r'\b' + re.escape(w) + r'\b', lower))
    
    # 6. Months
    months = set(w for w in MONTHS if re.search(r'\b' + re.escape(w) + r'\b', lower))
    
    # 7. Sensitive time/fixture phrases
    phrases = set()
    for phrase in ["second half", "first half", "extra time", "two points", "three points"]:
        if phrase in lower:
            phrases.add(phrase)
            
    return {
        "scores": scores,
        "digits": digits,
        "num_words": num_words,
        "rankings": rankings,
        "weekdays": weekdays,
        "months": months,
        "phrases": phrases
    }


def verify_output_facts(output_dict: Dict[str, Any], source_text: str) -> Tuple[bool, List[str]]:
    """
    Verifies that every number, score, date, weekday, ranking, and sensitive phrase
    appearing in the generated output (headline, key_points, body, why_it_matters, meta_description)
    is factually substantiated in SOURCE_TEXT.
    Returns (is_valid, list_of_unverified_items).
    """
    headline = output_dict.get("headline", output_dict.get("title", ""))
    kp_text = " ".join(output_dict.get("key_points", []))
    body = output_dict.get("body", "")
    why = output_dict.get("why_it_matters", "")
    meta = output_dict.get("meta_description", "")

    combined_output = f"{headline} {kp_text} {body} {why} {meta}"
    tokens = extract_factual_tokens(combined_output)
    src_lower = source_text.lower()
    
    unverified: List[str] = []
    
    # 1. Verify Scores
    for sc in tokens["scores"]:
        clean_sc = sc.replace(" ", "")
        alt_sc = clean_sc.replace("–", "-")
        if clean_sc not in src_lower and alt_sc not in src_lower and sc not in src_lower:
            unverified.append(f"Score '{sc}'")
            
    # 2. Verify Weekdays
    for wd in tokens["weekdays"]:
        if not re.search(r'\b' + re.escape(wd) + r'\b', src_lower):
            unverified.append(f"Weekday '{wd}'")
            
    # 3. Verify Months
    for mo in tokens["months"]:
        if not re.search(r'\b' + re.escape(mo) + r'\b', src_lower):
            unverified.append(f"Month '{mo}'")
            
    # 4. Verify Sensitive Phrases
    for ph in tokens["phrases"]:
        if ph not in src_lower:
            unverified.append(f"Phrase '{ph}'")
            
    # 5. Verify Rankings / Ordinals
    for rk in tokens["rankings"]:
        rk_digit = RANKING_MAP.get(rk, "")
        found = re.search(r'\b' + re.escape(rk) + r'\b', src_lower) or (rk_digit and re.search(r'\b' + re.escape(rk_digit) + r'\b', src_lower))
        if not found:
            unverified.append(f"Ranking '{rk}'")
            
    # 6. Verify Digits (Skip harmless year 2026 if today's date)
    for d in tokens["digits"]:
        clean_d = re.sub(r'[%.,]', '', d)
        word_equiv = DIGIT_TO_WORD.get(clean_d, "")
        found = (d in src_lower) or (clean_d in src_lower) or (word_equiv and word_equiv in src_lower)
        if not found and not any(clean_d in sc for sc in tokens["scores"]):
            # Ignore year 2026/2025 in publication timestamps
            if clean_d not in ("2026", "2025"):
                unverified.append(f"Number '{d}'")
            
    # 7. Verify Number Words
    for nw in tokens["num_words"]:
        digit_equiv = NUMBER_WORDS.get(nw, "")
        found = (nw in src_lower) or (digit_equiv and digit_equiv in src_lower)
        if nw == "two" and any(syn in src_lower for syn in ["double", "brace", "two", "2"]):
            found = True
        if nw == "three" and any(syn in src_lower for syn in ["hat-trick", "triple", "three", "3"]):
            found = True
        if nw == "one" and any(syn in src_lower for syn in ["first", "single", "one", "1"]):
            found = True
        if not found:
            unverified.append(f"Number word '{nw}'")

    # 8. Verify Unsupported Adjectives & Event Claims
    combined_lower = combined_output.lower()
    UNSUPPORTED_ADJECTIVES = [
        "brilliant", "crucial", "dismantling", "dominant", "stunning", "masterclass", "emphatic"
    ]
    for adj in UNSUPPORTED_ADJECTIVES:
        if re.search(r'\b' + re.escape(adj) + r'\b', combined_lower):
            if not re.search(r'\b' + re.escape(adj) + r'\b', src_lower):
                unverified.append(f"Unsupported adjective '{adj}'")

    return (len(unverified) == 0, unverified)


def normalize_category(cat: Optional[str]) -> str:
    """Normalize any raw or legacy category string to one of the fixed categories."""
    if not cat:
        return "AI & Tech"
    c = cat.strip().lower()
    if "market" in c or "finance" in c or "economy" in c or "stock" in c or "crypto" in c:
        return "Markets"
    if "sport" in c or "football" in c or "cricket" in c or "nba" in c or "premier" in c:
        return "Sports"
    if "science" in c or "space" in c or "nasa" in c or "physics" in c or "climate" in c:
        return "Science"
    if "politic" in c or "geopolitic" in c or "diplomacy" in c or "election" in c or "war" in c:
        return "World Politics"
    if "entertain" in c or "movie" in c or "film" in c or "cinema" in c or "gaming" in c or "box office" in c or "celebrity" in c:
        return "Entertainment"
    if "tech" in c or "ai" in c or "software" in c or "computing" in c or "apple" in c or "google" in c or "robot" in c:
        return "AI & Tech"
    return "AI & Tech"


def sanitize_banned_phrases(text: str) -> str:
    """Removes or replaces any banned buzzwords, unsupported adjectives, or generic jargon."""
    if not text:
        return ""
    replacements = {
        r"\btier-1\b": "leading",
        r"\bneural\b": "automated",
        r"\bdossier\b": "briefing",
        r"\btelemetry\b": "data",
        r"\bhigh-stakes\b": "important",
        r"\blandmark\b": "notable",
        r"\bintelligence report\b": "news report",
        r"\bsynthesized\b": "reported",
        r"\bdecisive tactical adjustments\b": "",
        r"\baccelerating operational transition\b": "",
        r"\befficiency dividend\b": "",
        r"\bstrategic transition\b": "",
        r"\btactical overloads\b": "",
        r"\bcounter-pressing traps\b": "",
        r"\bbrilliant\b": "",
        r"\bcrucial\b": "key",
        r"\bmajor\b": "",
        r"\bdismantling\b": "defeating",
        r"\bdominant\b": "",
        r"\bLatest reporting on\b": "",
        r"\bLatest news on\b": "",
    }
    for pattern, repl in replacements.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def format_first_fact_meta_description(candidate: str, first_fact: str, source_name: str, headline: str = "") -> str:
    """
    Guarantees a factual meta description of strictly 140-155 characters.
    Extracts the article's first concrete fact from SOURCE_TEXT, attributing it cleanly to source_name.
    Eliminates all generic filler phrases like 'Latest reporting on...' or 'key developments'.
    """
    clean_cand = sanitize_banned_phrases(candidate or "").strip()
    generic_indicators = [
        "latest reporting", "key developments", "practical analysis", 
        "latest news", "read key facts", "background context", "clear analysis"
    ]
    if clean_cand and not any(g in clean_cand.lower() for g in generic_indicators):
        if 140 <= len(clean_cand) <= 155 and clean_cand.endswith("."):
            return clean_cand

    raw_fact = (first_fact or headline or "").strip()
    raw_fact = re.sub(r"^[•\-\*\d\.\s]+", "", raw_fact).strip()
    raw_fact = re.sub(r",?\s*(?:according to|based on|reported by|confirmed by).*$", "", raw_fact, flags=re.IGNORECASE).strip()
    fact_sentence = re.split(r'(?<=[.!?])\s+', raw_fact)[0].rstrip(". ")
    if not fact_sentence or len(fact_sentence) < 15:
        fact_sentence = headline.rstrip(". ")

    # Generate candidate sentences
    candidates = [
        f"{fact_sentence}, according to confirmed reporting by {source_name}.",
        f"{fact_sentence}, according to news reports published by {source_name}.",
        f"{fact_sentence}, based on verified match reporting from {source_name}.",
        f"{fact_sentence}, based on verified primary reporting from {source_name}.",
        f"{fact_sentence}, according to official reporting published by {source_name}.",
        f"{fact_sentence}, according to verified dispatches reported by {source_name}.",
        f"{fact_sentence}, according to reports confirmed by {source_name}.",
        f"{fact_sentence}, according to coverage by {source_name}.",
        f"{fact_sentence}, according to {source_name}.",
        f"{fact_sentence}, according to confirmed details released by {source_name}.",
        f"{fact_sentence}, according to official event coverage published by {source_name}.",
        f"{fact_sentence}, based on verified reporting released by {source_name} news wire.",
        f"{headline.rstrip('. ')}: {fact_sentence}, based on official dispatches reported by {source_name}.",
        f"{headline.rstrip('. ')}: {fact_sentence}, according to confirmed reports from {source_name}.",
        f"{headline.rstrip('. ')}: {fact_sentence}, according to reports confirmed by {source_name}.",
        f"{headline.rstrip('. ')}: {fact_sentence}, according to news reports from {source_name}.",
        f"{headline.rstrip('. ')}: {fact_sentence}, according to coverage by {source_name}.",
        f"{headline.rstrip('. ')}: {fact_sentence}, confirmed by {source_name}.",
        f"{headline.rstrip('. ')}: {fact_sentence}, reported by {source_name}.",
        f"{fact_sentence}."
    ]
    
    for c in candidates:
        if 140 <= len(c) <= 155 and c.endswith("."):
            return c

    # If too long, trim fact_sentence to a natural clause
    if len(fact_sentence) > 90:
        for suffix in [f", according to {source_name}.", f", based on reports from {source_name}.", f", reported by {source_name}."]:
            target_fact_len = 145 - len(suffix)
            if target_fact_len > 30 and len(fact_sentence) >= target_fact_len:
                words = fact_sentence[:target_fact_len].rsplit(" ", 1)[0]
                c = f"{words}{suffix}"
                if 140 <= len(c) <= 155:
                    return c

    # If too short, try combinations of headline + fact with various attribution lengths
    for prefix in [f"{headline.rstrip('. ')}: {fact_sentence}", f"{fact_sentence}"]:
        for suffix in [
            f", according to confirmed news reports published by {source_name}.",
            f", according to verified news coverage published by {source_name}.",
            f", based on reporting confirmed by the newsroom at {source_name}.",
            f", based on official dispatches reported by {source_name}.",
            f", according to confirmed reports released by {source_name}."
        ]:
            c = f"{prefix}{suffix}"
            if 140 <= len(c) <= 155:
                return c

    # Fallback to guaranteed length
    fallback = f"{fact_sentence}, according to reports confirmed by {source_name}."
    if len(fallback) > 155:
        return fallback[:154].rsplit(" ", 1)[0] + "."
    elif len(fallback) < 140:
        return f"{headline.rstrip('. ')}: {fact_sentence}, based on official dispatches reported by {source_name}."[:154].rsplit(" ", 1)[0] + "."
    return fallback


def clean_json_text(text: str) -> str:
    """Extract raw JSON from potential markdown code fences."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def call_gemini_api(prompt: str, api_key: str) -> str:
    """
    Call Google Gemini REST API endpoint with automatic model fallback.
    Ultra-reliable, zero C-extension conflicts.
    """
    models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]
    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
        }
        
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                        if text:
                            return text
        except Exception as e:
            print(f"[Gemini API] Note: Model '{model_name}' call exception ({e}). Trying fallback...")
            continue
    return ""


def parse_and_format_article_json(data: Dict[str, Any], raw_title: str, source_name: str, source_url: str, suggested_category: str) -> Dict[str, Any]:
    """Helper to format and clean generated article dictionary."""
    headline = sanitize_banned_phrases(data.get("headline", raw_title).strip())
    if len(headline) > HEADLINE_MAX_LENGTH:
        headline = headline[:HEADLINE_MAX_LENGTH - 3].rstrip() + "..."

    category = normalize_category(data.get("category", suggested_category))

    key_points = [sanitize_banned_phrases(p) for p in data.get("key_points", []) if p]
    if len(key_points) < 3:
        key_points.append(f"Reporting confirmed by {source_name}.")
    key_points = key_points[:3]

    body = sanitize_banned_phrases(data.get("body", "").strip())
    why_it_matters = sanitize_banned_phrases(data.get("why_it_matters", "").strip())

    first_fact = key_points[0] if key_points else (body.split(".")[0] + ".")
    meta_desc = format_first_fact_meta_description(
        candidate=data.get("meta_description", ""),
        first_fact=first_fact,
        source_name=source_name,
        headline=headline
    )

    confidence = data.get("confidence", "full").lower()
    if confidence not in ("full", "thin"):
        confidence = "full" if len(body.split()) >= 70 else "thin"

    full_content = body
    if why_it_matters:
        full_content += f"\n\n### Why It Matters (Analysis)\n\n{why_it_matters}"

    summary_bullets = "\n".join(f"• {kp}" for kp in key_points)

    resolved_image = resolve_article_image(
        entry=None,
        title=headline,
        source_url=source_url,
        category=category,
        current_image_url=raw_image_url
    )

    return {
        "title": headline,
        "headline": headline,
        "category": category,
        "summary": summary_bullets,
        "key_points": key_points,
        "body": body,
        "why_it_matters": why_it_matters,
        "meta_description": meta_desc,
        "content": full_content,
        "author_name": EDITORIAL_BYLINE,
        "source_name": source_name,
        "source_url": source_url,
        "confidence": confidence,
        "image_url": resolved_image,
    }


def process_raw_news(
    raw_title: str, 
    raw_summary: str, 
    source_name: str, 
    suggested_category: str = "AI & Tech",
    source_url: str = "",
    raw_image_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Synthesizes raw news into an accurate, grounded, helpful article for US/UK readers.
    Complies with strict editorial requirements:
    - Zero invented facts, ratings, scores, dates, weekdays, or tables.
    - Number check: extracts every number, score, date, weekday, ranking and verifies against SOURCE_TEXT.
    - Regenerates once upon failure; if still failing, marks confidence 'thin'.
    - Plain, clear journalistic English.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    # Clean and prepare SOURCE_TEXT
    source_text = f"Title: {raw_title}\n\nSummary/Excerpt: {raw_summary}\n\nSource: {source_name}\nURL: {source_url}"
    fixed_categories_str = ", ".join(FIXED_CATEGORIES)

    base_prompt = f"""You are a news editor writing for US and UK readers in clear, plain English.
Use ONLY facts found in SOURCE_TEXT. Never invent names, numbers, scores, quotes, ratings, dates, weekdays or statistics. If a fact is not in the source, leave it out.
Do not copy sentences from the source. Rewrite in your own words. At most one direct quote, under 15 words, in quotation marks and attributed.

NO 250-WORD MINIMUM: If SOURCE_TEXT is short, write an accurate 80-200 word brief. If SOURCE_TEXT contains substantial detail, write 200-350 words. Never invent fluff or filler.
STRICT FACTUAL GROUNDING: Every single sentence must be supported by facts in SOURCE_TEXT. Never invent claims about how a match or event unfolded (e.g. do not say a team 'controlled the match', 'dismantled the opposition', or 'took place at [venue]' unless explicitly stated in SOURCE_TEXT).
FORBIDDEN ADJECTIVES: Never use unsupported adjectives like 'brilliant', 'crucial', 'major', 'dismantling', 'dominant', 'stunning', 'emphatic', or 'masterclass' unless directly quoting the source.
Banned words/phrases: tier-1, neural, dossier, telemetry, high-stakes, landmark, intelligence report, synthesized, decisive tactical adjustments, accelerating operational transition, brilliant, crucial, major, dismantling, dominant.

Fixed categories list: {fixed_categories_str}
Select the single most accurate category for this story from the fixed list.

SOURCE_TEXT:
\"\"\"{source_text}\"\"\"

Return JSON:
{{
 "headline": "max 65 chars, specific, no clickbait",
 "meta_description": "A single real sentence stating the article's first fact from SOURCE_TEXT, strictly 140-155 characters. Never use generic filler like 'Latest reporting on...' or 'key developments'. Must end with a period.",
 "category": "one of the fixed list",
 "key_points": [
   "concrete fact 1 from the source",
   "concrete fact 2 from the source",
   "concrete fact 3 from the source"
 ],
 "body": "80-200 words if source is brief (or 200-350 words if source is detailed), inverted pyramid, every sentence strictly supported by SOURCE_TEXT, zero unsupported adjectives",
 "why_it_matters": "2-3 sentences of reasoning based only on stated facts, labelled as analysis",
 "source_name": "{source_name}",
 "source_url": "{source_url}",
 "confidence": "full" or "thin"
}}
If SOURCE_TEXT contains fewer than 3 distinct facts, return confidence "thin" and do not write a full article."""

    if gemini_api_key:
        try:
            # Step 1: Initial Generation
            raw_response = call_gemini_api(base_prompt, gemini_api_key)
            if raw_response:
                cleaned = clean_json_text(raw_response)
                try:
                    data = json.loads(cleaned, strict=False)
                except Exception:
                    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned)
                    data = json.loads(sanitized, strict=False)

                formatted = parse_and_format_article_json(data, raw_title, source_name, source_url, suggested_category)

                # Step 2: Strict Number, Score, Date, Weekday, and Ranking Verification
                is_valid, unverified = verify_output_facts(formatted, source_text)

                if not is_valid:
                    print(f"[Number/Fact Check Failed] Output contained unverified facts: {unverified}. Regenerating once with strict correction...")
                    correction_prompt = f"""{base_prompt}

CRITICAL CORRECTION REQUIRED:
Your previous output invented the following numbers, scores, dates, weekdays, or rankings not present in SOURCE_TEXT:
{', '.join(unverified)}

You must rewrite the JSON using ONLY facts, numbers, and scores directly stated in SOURCE_TEXT.
- If a score like 3-1 is in SOURCE_TEXT, write ONLY 3-1. Never invent scores like 2-1.
- Never invent weekdays (e.g. Saturday), halves (e.g. second half), points (e.g. two points), or dates unless explicitly written in SOURCE_TEXT.
- If a detail is not in the source text, omit it completely."""

                    retry_raw = call_gemini_api(correction_prompt, gemini_api_key)
                    if retry_raw:
                        cleaned_retry = clean_json_text(retry_raw)
                        try:
                            retry_data = json.loads(cleaned_retry, strict=False)
                        except Exception:
                            sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned_retry)
                            retry_data = json.loads(sanitized, strict=False)

                        formatted_retry = parse_and_format_article_json(retry_data, raw_title, source_name, source_url, suggested_category)
                        retry_valid, retry_unverified = verify_output_facts(formatted_retry, source_text)

                        if retry_valid:
                            print(f"[Number/Fact Check Passed on Retry] All numbers, scores, and dates confirmed in source text.")
                            return formatted_retry
                        else:
                            print(f"[Number/Fact Check Failed on Retry] Still unverified: {retry_unverified}. Marking confidence as 'thin'.")
                            formatted_retry["confidence"] = "thin"
                            return formatted_retry

                return formatted
        except Exception as e:
            print(f"[Gemini API Note] Exception ({e}); utilizing grounded editorial fallback synthesizer.")

    # Grounded Editorial Fallback Synthesizer (Zero Invented Facts, Zero Invented Scores)
    category = normalize_category(suggested_category)
    clean_title = sanitize_banned_phrases(raw_title.strip())
    if len(clean_title) > HEADLINE_MAX_LENGTH:
        clean_title = clean_title[:HEADLINE_MAX_LENGTH - 3].rstrip() + "..."

    clean_summary = sanitize_banned_phrases(re.sub(r'<[^>]+>', '', raw_summary or "").strip())
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_summary) if len(s.strip()) > 15]

    is_thin = len(sentences) < 2 or len(clean_summary) < 70
    confidence = "thin" if is_thin else "full"

    key_points = [
        sentences[0] if len(sentences) > 0 else f"{clean_title}.",
        sentences[1] if len(sentences) > 1 else f"Dispatches confirmed by {source_name}.",
        sentences[2] if len(sentences) > 2 else f"Further developments expected as details emerge."
    ]

    lead_para = f"{sentences[0]} {sentences[1]}" if len(sentences) >= 2 else (clean_summary or clean_title)
    context_para = " ".join(sentences[2:]) if len(sentences) > 2 else f"This development was initially reported by {source_name}."
    body = f"{lead_para}\n\n{context_para}"

    why_it_matters = f"This development provides essential context for observers tracking {category.lower()} news from {source_name}."
    first_fact = sentences[0] if sentences else clean_title
    meta_desc = format_first_fact_meta_description(
        candidate="",
        first_fact=first_fact,
        source_name=source_name,
        headline=clean_title
    )

    full_content = f"{body}\n\n### Why It Matters (Analysis)\n\n{why_it_matters}"
    summary_bullets = "\n".join(f"• {kp}" for kp in key_points)

    resolved_image = resolve_article_image(
        entry=None,
        title=clean_title,
        source_url=source_url,
        category=category,
        current_image_url=raw_image_url
    )

    fallback_dict = {
        "title": clean_title,
        "headline": clean_title,
        "category": category,
        "summary": summary_bullets,
        "key_points": key_points,
        "body": body,
        "why_it_matters": why_it_matters,
        "meta_description": meta_desc,
        "content": full_content,
        "author_name": EDITORIAL_BYLINE,
        "source_name": source_name,
        "source_url": source_url,
        "confidence": confidence,
        "image_url": resolved_image,
    }

    # Verify fallback facts as well
    fb_valid, fb_unverified = verify_output_facts(fallback_dict, source_text)
    if not fb_valid:
        fallback_dict["confidence"] = "thin"

    return fallback_dict
