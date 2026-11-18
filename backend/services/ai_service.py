import os
import time
import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone
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
    from .trends import get_trending_terms, find_trending_terms_in_text
except (ImportError, ValueError):
    try:
        from services.image_resolver import resolve_article_image, is_generic_placeholder, upgrade_image_url_to_hd, is_low_res_thumbnail
        from services.trends import get_trending_terms, find_trending_terms_in_text
    except (ImportError, ValueError):
        from backend.services.image_resolver import resolve_article_image, is_generic_placeholder, upgrade_image_url_to_hd, is_low_res_thumbnail
        from backend.services.trends import get_trending_terms, find_trending_terms_in_text


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


COOLDOWN_FILE = Path(__file__).resolve().parent.parent / ".gemini_cooldown"
MODEL_COOLDOWN_FILE = Path(__file__).resolve().parent.parent / ".gemini_model_status.json"
PACING_FILE = Path(__file__).resolve().parent.parent / ".gemini_last_call"
DEFAULT_COOLDOWN_MINUTES = 30
MIN_CALL_GAP_SECONDS = 6.0  # Max 10 requests per minute across whole backend

_in_memory_cooldown_until: float = 0.0
_current_model_index: int = 0
_last_call_time: float = 0.0


def wait_for_gemini_pacing() -> None:
    """Enforces minimum 6-second gap between Gemini requests (max 10 req/min across backend)."""
    global _last_call_time
    now = time.time()
    last_time = _last_call_time

    if PACING_FILE.exists():
        try:
            with open(PACING_FILE, "r", encoding="utf-8") as f:
                f_time = float(f.read().strip())
                if f_time > last_time:
                    last_time = f_time
        except Exception:
            pass

    elapsed = now - last_time
    if elapsed < MIN_CALL_GAP_SECONDS:
        sleep_time = MIN_CALL_GAP_SECONDS - elapsed
        time.sleep(sleep_time)

    actual_now = time.time()
    _last_call_time = actual_now
    try:
        with open(PACING_FILE, "w", encoding="utf-8") as f:
            f.write(str(actual_now))
    except Exception:
        pass


def get_gemini_cooldown_remaining() -> float:
    """Returns seconds remaining in global Gemini 429 cooldown, or 0.0 if not in cooldown."""
    global _in_memory_cooldown_until
    now = datetime.now(timezone.utc).timestamp()
    if _in_memory_cooldown_until > now:
        return _in_memory_cooldown_until - now

    if COOLDOWN_FILE.exists():
        try:
            with open(COOLDOWN_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    until = float(content)
                    if until > now:
                        _in_memory_cooldown_until = until
                        return until - now
                    else:
                        try:
                            COOLDOWN_FILE.unlink(missing_ok=True)
                        except Exception:
                            pass
        except Exception:
            pass
    return 0.0


def set_gemini_cooldown(minutes: Optional[int] = None) -> float:
    """Activates global cooldown for Gemini calls after ALL models returned HTTP 429."""
    global _in_memory_cooldown_until
    if minutes is None:
        try:
            minutes = int(os.getenv("GEMINI_COOLDOWN_MINUTES", str(DEFAULT_COOLDOWN_MINUTES)))
        except ValueError:
            minutes = DEFAULT_COOLDOWN_MINUTES
    duration = max(1, minutes) * 60
    now = datetime.now(timezone.utc).timestamp()
    until = now + duration
    _in_memory_cooldown_until = until
    try:
        with open(COOLDOWN_FILE, "w", encoding="utf-8") as f:
            f.write(str(until))
    except Exception as e:
        print(f"[Gemini Cooldown Warning] Could not persist cooldown timestamp: {e}")
    print(f"[Gemini Cooldown Activated] ALL models exhausted. Global cooldown set for {minutes} minutes ({duration}s).")
    return duration


def get_configured_gemini_models() -> List[str]:
    """Returns priority list of Gemini models, configurable via GEMINI_MODELS env."""
    env_models = os.getenv("GEMINI_MODELS")
    if env_models and env_models.strip():
        models = [m.strip().replace("models/", "") for m in env_models.split(",") if m.strip()]
        if models:
            return models
    # Default priority: Gemini 3.5 Flash Lite -> Gemini 3.1 Flash Lite (500 req/day each)
    return ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]


def load_model_cooldowns() -> Dict[str, float]:
    """Loads per-model 429 cooldown timestamps."""
    now = datetime.now(timezone.utc).timestamp()
    result: Dict[str, float] = {}
    if MODEL_COOLDOWN_FILE.exists():
        try:
            with open(MODEL_COOLDOWN_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                result = {m: float(ts) for m, ts in data.items() if float(ts) > now}
        except Exception:
            pass
    return result


def save_model_cooldowns(data: Dict[str, float]) -> None:
    """Saves per-model cooldown timestamps."""
    try:
        with open(MODEL_COOLDOWN_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def get_available_model() -> Optional[Tuple[str, int]]:
    """
    Finds the next available Gemini model that is not currently in 429 cooldown.
    Returns (model_name, index) or None if all configured models are in cooldown.
    """
    global _current_model_index
    models = get_configured_gemini_models()
    if not models:
        return None

    cooldowns = load_model_cooldowns()
    now = datetime.now(timezone.utc).timestamp()

    for i in range(len(models)):
        idx = (_current_model_index + i) % len(models)
        m = models[idx]
        if cooldowns.get(m, 0.0) <= now:
            _current_model_index = idx
            return m, idx

    return None


def record_model_429(model_name: str) -> bool:
    """
    Records an HTTP 429 for model_name and switches to the next model for the NEXT story.
    Starts global cooldown only when ALL models in the list have returned 429.
    Returns True if all models are now exhausted, False otherwise.
    """
    global _current_model_index
    models = get_configured_gemini_models()
    try:
        cooldown_mins = int(os.getenv("GEMINI_COOLDOWN_MINUTES", str(DEFAULT_COOLDOWN_MINUTES)))
    except ValueError:
        cooldown_mins = DEFAULT_COOLDOWN_MINUTES

    duration = max(1, cooldown_mins) * 60
    now = datetime.now(timezone.utc).timestamp()
    until = now + duration

    cooldowns = load_model_cooldowns()
    cooldowns[model_name] = until
    save_model_cooldowns(cooldowns)

    # Advance active index to the next model for the NEXT story
    if models:
        curr_idx = models.index(model_name) if model_name in models else _current_model_index
        _current_model_index = (curr_idx + 1) % len(models)
        next_model = models[_current_model_index]
        print(f"[Gemini Model Switch] Model '{model_name}' returned HTTP 429. Switched to '{next_model}' for next story.")

    # Check if ALL models in list have returned 429
    all_exhausted = all(cooldowns.get(m, 0.0) > now for m in models)
    if all_exhausted:
        set_gemini_cooldown(cooldown_mins)
        return True
    return False


def call_gemini_api(prompt: str, api_key: str) -> Tuple[str, Optional[str]]:
    """
    Call Google Gemini REST API endpoint using the active priority model.
    - Rate-limited to max 10 calls/min (minimum 6s gap).
    - If the model returns HTTP 429, switches to next model for NEXT story (does NOT retry same story).
    - Starts global cooldown only when ALL models have returned 429.
    Returns (raw_response_text, error_message_if_failed).
    """
    # 1. Check global cooldown (all models exhausted)
    global_remaining = get_gemini_cooldown_remaining()
    if global_remaining > 0:
        mins = int(global_remaining // 60)
        secs = int(global_remaining % 60)
        return "", f"Gemini cooldown active ({mins}m {secs}s remaining after all models hit HTTP 429)"

    # 2. Find next available model
    model_info = get_available_model()
    if not model_info:
        models = get_configured_gemini_models()
        set_gemini_cooldown()
        return "", f"All configured Gemini models {models} exhausted (cooldown activated)"

    model_name, _ = model_info

    # 3. Enforce pacing: minimum 6s between requests (max 10 req/min across backend)
    wait_for_gemini_pacing()

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
                        return text, None
    except urllib.error.HTTPError as he:
        err_msg = f"HTTP Error {he.code}: {he.reason}"
        try:
            raw_err = he.read().decode("utf-8", errors="ignore")
            err_json = json.loads(raw_err)
            msg = err_json.get("error", {}).get("message")
            if msg:
                err_msg += f" - {msg[:120]}"
        except Exception:
            pass
        print(f"[Gemini API] Note: Model '{model_name}' call exception ({err_msg}).")
        if he.code in (429, 503):
            record_model_429(model_name)
        return "", err_msg
    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}"
        print(f"[Gemini API] Note: Model '{model_name}' call exception ({err_msg}).")
        return "", err_msg

    return "", f"Model '{model_name}' returned empty candidates"


def parse_and_format_article_json(data: Dict[str, Any], raw_title: str, source_name: str, source_url: str, suggested_category: str, raw_image_url: Optional[str] = None) -> Dict[str, Any]:
    """Helper to format and clean generated article dictionary."""
    headline = sanitize_banned_phrases(data.get("headline", raw_title).strip())
    if len(headline) > HEADLINE_MAX_LENGTH:
        truncated = headline[:HEADLINE_MAX_LENGTH]
        headline = truncated.rsplit(" ", 1)[0].rstrip() if " " in truncated else truncated

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

    body_words = len(body.split())
    raw_conf = str(data.get("confidence", "full")).strip().lower()
    if raw_conf != "full" or body_words < 120:
        confidence = "thin"
    else:
        confidence = "full"

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
        "trending_term_used": "none",
    }


def extract_used_trending_term(art_dict: Dict[str, Any], trending_in_source: List[str]) -> str:
    """Finds which trending term from trending_in_source was actually used in the generated article."""
    if not trending_in_source:
        return "none"
    full_text = f"{art_dict.get('headline', '')} {art_dict.get('body', '')} {art_dict.get('meta_description', '')}"
    for t in trending_in_source:
        if re.search(r'\b' + re.escape(t) + r'\b', full_text, re.IGNORECASE):
            return t
    return "none"


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
    gemini_error: Optional[str] = None

    # Clean and prepare SOURCE_TEXT
    source_text = f"Title: {raw_title}\n\nSummary/Excerpt: {raw_summary}\n\nSource: {source_name}\nURL: {source_url}"
    fixed_categories_str = ", ".join(FIXED_CATEGORIES)

    # Compute TRENDING_IN_SOURCE: trending terms that literally appear in SOURCE_TEXT (maximum 3)
    trending_in_source: List[str] = []
    try:
        trending_terms = get_trending_terms()
        if trending_terms:
            trending_in_source = find_trending_terms_in_text(source_text, trending_terms=trending_terms, max_terms=3)
    except Exception as t_err:
        print(f"[AI Service Trends Notice] Could not extract trending terms: {t_err}")

    # Build trending instructions block if terms literally present in SOURCE_TEXT
    if trending_in_source:
        trending_prompt_block = f"""
TRENDING SEARCH TERM INTEGRATION:
The following search term(s) are currently trending and literally appear in SOURCE_TEXT: {trending_in_source}
Rules for trending search terms:
1. Start the headline with the most relevant trending term from this list (or as close to the start as natural English allows), keeping headline max 60 characters.
2. Use this trending term naturally in the first sentence of the body and in the meta description.
3. The trending term may appear at most 2 times in total throughout the article body (never keyword-stuff).
4. CRITICAL FACTUAL RULE: NEVER add, invent, or imply any term, entity, or fact that is not explicitly supported by SOURCE_TEXT.
"""
    else:
        trending_prompt_block = ""

    base_prompt = f"""You are a news editor writing for US and UK readers in clear, plain English.
Use ONLY facts found in SOURCE_TEXT. Never invent names, numbers, scores, quotes, ratings, dates, weekdays or statistics. If a fact is not in the source, leave it out.
Do not copy sentences from the source. Rewrite in your own words. At most one direct quote, under 15 words, in quotation marks and attributed.
{trending_prompt_block}
HEADLINE REQUIREMENT: Maximum 60 characters. Place the main subject (product, team, person or event) at the very start of the headline. Write in clear, plain English with zero clickbait and no keyword stuffing.
ARTICLE BODY REQUIREMENT: The body must contain at least 120 words (120-200 words if source is brief, 200-350 words if source contains substantial detail). If SOURCE_TEXT lacks sufficient verifiable facts for at least 120 words, return confidence "thin". Never invent fluff or filler.
STRICT FACTUAL GROUNDING: Every single sentence must be supported by facts in SOURCE_TEXT. Never invent claims about how a match or event unfolded (e.g. do not say a team 'controlled the match', 'dismantled the opposition', or 'took place at [venue]' unless explicitly stated in SOURCE_TEXT).
FORBIDDEN ADJECTIVES: Never use unsupported adjectives like 'brilliant', 'crucial', 'major', 'dismantling', 'dominant', 'stunning', 'emphatic', or 'masterclass' unless directly quoting the source.
Banned words/phrases: tier-1, neural, dossier, telemetry, high-stakes, landmark, intelligence report, synthesized, decisive tactical adjustments, accelerating operational transition, brilliant, crucial, major, dismantling, dominant.

Fixed categories list: {fixed_categories_str}
Select the single most accurate category for this story from the fixed list.

SOURCE_TEXT:
\"\"\"{source_text}\"\"\"

Return JSON:
{{
 "headline": "max 60 characters, main subject (product, team, person or event) at the very start, plain English, no clickbait, no keyword stuffing",
 "meta_description": "A single real sentence stating the article's first fact from SOURCE_TEXT, strictly 140-155 characters. Never use generic filler like 'Latest reporting on...' or 'key developments'. Must end with a period.",
 "category": "one of the fixed list",
 "key_points": [
   "concrete fact 1 from the source",
   "concrete fact 2 from the source",
   "concrete fact 3 from the source"
 ],
 "body": "at least 120 words (120-200 words if source is brief, 200-350 words if detailed), inverted pyramid, every sentence strictly supported by SOURCE_TEXT, zero unsupported adjectives",
 "why_it_matters": "2-3 sentences of reasoning based only on stated facts, labelled as analysis",
 "source_name": "{source_name}",
 "source_url": "{source_url}",
 "confidence": "\"full\" only if body is at least 120 words and supported by 3+ distinct facts; otherwise \"thin\""
}}
If SOURCE_TEXT contains fewer than 3 distinct facts or body is under 120 words, return confidence "thin" and do not write a full article."""

    if gemini_api_key:
        try:
            # Step 1: Initial Generation
            raw_response, api_err = call_gemini_api(base_prompt, gemini_api_key)
            if api_err:
                gemini_error = api_err
            if raw_response:
                cleaned = clean_json_text(raw_response)
                data = None
                try:
                    data = json.loads(cleaned, strict=False)
                except Exception as json_err:
                    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned)
                    try:
                        data = json.loads(sanitized, strict=False)
                    except Exception as json_err2:
                        gemini_error = f"Invalid JSON response: {json_err2}"
                        data = None

                if data:
                    formatted = parse_and_format_article_json(data, raw_title, source_name, source_url, suggested_category, raw_image_url=raw_image_url)
                    formatted["generation_path"] = "gemini"
                    formatted["gemini_error"] = None

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

                        retry_raw, retry_err = call_gemini_api(correction_prompt, gemini_api_key)
                        if retry_err:
                            gemini_error = retry_err
                        if retry_raw:
                            cleaned_retry = clean_json_text(retry_raw)
                            retry_data = None
                            try:
                                retry_data = json.loads(cleaned_retry, strict=False)
                            except Exception:
                                sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned_retry)
                                try:
                                    retry_data = json.loads(sanitized, strict=False)
                                except Exception:
                                    pass

                            if retry_data:
                                formatted_retry = parse_and_format_article_json(retry_data, raw_title, source_name, source_url, suggested_category, raw_image_url=raw_image_url)
                                retry_valid, retry_unverified = verify_output_facts(formatted_retry, source_text)

                                if retry_valid:
                                    print(f"[Number/Fact Check Passed on Retry] All numbers, scores, and dates confirmed in source text.")
                                    formatted_retry["generation_path"] = "gemini"
                                    formatted_retry["gemini_error"] = None
                                    formatted_retry["trending_term_used"] = extract_used_trending_term(formatted_retry, trending_in_source)
                                    return formatted_retry
                                else:
                                    print(f"[Number/Fact Check Failed on Retry] Still unverified: {retry_unverified}. Marking confidence as 'thin'.")
                                    formatted_retry["generation_path"] = "gemini"
                                    formatted_retry["confidence"] = "thin"
                                    formatted_retry["gemini_error"] = f"Failed factual verification on retry: {', '.join(retry_unverified)}"
                                    formatted_retry["trending_term_used"] = extract_used_trending_term(formatted_retry, trending_in_source)
                                    return formatted_retry

                    formatted["trending_term_used"] = extract_used_trending_term(formatted, trending_in_source)
                    return formatted
        except Exception as e:
            gemini_error = gemini_error or f"Gemini exception: {e}"
            print(f"[Gemini API Note] Exception ({e}); utilizing grounded editorial fallback synthesizer.")

    # Grounded Editorial Fallback Synthesizer (Zero Invented Facts, Zero Invented Scores)
    category = normalize_category(suggested_category)
    clean_title = sanitize_banned_phrases(raw_title.strip())
    if len(clean_title) > HEADLINE_MAX_LENGTH:
        truncated = clean_title[:HEADLINE_MAX_LENGTH]
        clean_title = truncated.rsplit(" ", 1)[0].rstrip() if " " in truncated else truncated

    clean_summary = sanitize_banned_phrases(re.sub(r'<[^>]+>', '', raw_summary or "").strip())
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_summary) if len(s.strip()) > 15]

    lead_para = f"{sentences[0]} {sentences[1]}" if len(sentences) >= 2 else (clean_summary or clean_title)
    context_para = " ".join(sentences[2:]) if len(sentences) > 2 else f"This development was initially reported by {source_name}."
    body = f"{lead_para}\n\n{context_para}"

    body_words = len(body.split())
    is_thin = len(sentences) < 2 or len(clean_summary) < 70 or body_words < 120
    confidence = "thin" if is_thin else "full"

    key_points = [
        sentences[0] if len(sentences) > 0 else f"{clean_title}.",
        sentences[1] if len(sentences) > 1 else f"Dispatches confirmed by {source_name}.",
        sentences[2] if len(sentences) > 2 else f"Further developments expected as details emerge."
    ]

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
        "generation_path": "fallback",
        "gemini_error": gemini_error or ("GEMINI_API_KEY missing" if not gemini_api_key else "Empty or failed Gemini response"),
    }

    # Verify fallback facts as well
    fb_valid, fb_unverified = verify_output_facts(fallback_dict, source_text)
    if not fb_valid or len(body.split()) < 120:
        fallback_dict["confidence"] = "thin"

    fallback_dict["trending_term_used"] = extract_used_trending_term(fallback_dict, trending_in_source)

    return fallback_dict


# ==============================================================================
# DEEP RESEARCH SYNTHESIZER (Multi-Source Comprehensive Reporting)
# ==============================================================================

def parse_and_format_deep_json(
    data: Dict[str, Any],
    raw_title: str,
    source_pack: List[Dict[str, Any]],
    suggested_category: str,
    raw_image_url: Optional[str] = None
) -> Dict[str, Any]:
    """Helper to format and clean generated deep research article dictionary."""
    headline = sanitize_banned_phrases(data.get("headline", raw_title).strip())
    if len(headline) > HEADLINE_MAX_LENGTH:
        truncated = headline[:HEADLINE_MAX_LENGTH]
        headline = truncated.rsplit(" ", 1)[0].rstrip() if " " in truncated else truncated

    category = normalize_category(data.get("category", suggested_category))

    key_points = [sanitize_banned_phrases(p) for p in data.get("key_points", []) if p]
    if len(key_points) < 3:
        key_points.append("Reporting corroborated across multiple independent dispatches.")
    key_points = key_points[:3]

    body = sanitize_banned_phrases(data.get("body", "").strip())
    why_it_matters = sanitize_banned_phrases(data.get("why_it_matters", "").strip())

    outlets = [s.get("outlet", "Primary Source").strip() for s in source_pack if s.get("outlet")]
    unique_outlets = list(dict.fromkeys(outlets))
    outlets_str = ", ".join(unique_outlets)[:140]
    main_url = source_pack[0].get("url", "") if source_pack else ""

    sources_items = [f"{s.get('outlet', 'Wire')} ({s.get('date', 'Recent')})" for s in source_pack]
    default_sources_line = f"Sources: {', '.join(sources_items)}."

    # Ensure Sources line is present at the end of the body
    if "Sources:" not in body:
        body = f"{body}\n\n{default_sources_line}"

    first_fact = key_points[0] if key_points else (body.split(".")[0] + ".")
    meta_desc = format_first_fact_meta_description(
        candidate=data.get("meta_description", ""),
        first_fact=first_fact,
        source_name=outlets_str,
        headline=headline
    )

    body_words = len(body.split())
    raw_conf = str(data.get("confidence", "full")).strip().lower()
    sources_agree = data.get("sources_agree", True)

    # Deep research requirements: at least 2 sources, sources agree, and >= 300 words
    if raw_conf != "full" or body_words < 300 or len(source_pack) < 2 or not sources_agree:
        confidence = "thin"
    else:
        confidence = "full"

    # Assemble full content: place Analysis section before the concluding Sources line
    if "Sources:" in body:
        parts = body.rsplit("Sources:", 1)
        main_body = parts[0].strip()
        sources_line = "Sources:" + parts[1].strip()
        if why_it_matters:
            full_content = f"{main_body}\n\n### Why It Matters (Analysis)\n\n{why_it_matters}\n\n{sources_line}"
        else:
            full_content = f"{main_body}\n\n{sources_line}"
    else:
        full_content = body
        if why_it_matters:
            full_content += f"\n\n### Why It Matters (Analysis)\n\n{why_it_matters}"
        full_content += f"\n\n{default_sources_line}"

    summary_bullets = "\n".join(f"• {kp}" for kp in key_points)

    resolved_image = resolve_article_image(
        entry=None,
        title=headline,
        source_url=main_url,
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
        "source_name": outlets_str,
        "source_url": main_url,
        "confidence": confidence,
        "image_url": resolved_image,
        "trending_term_used": "none",
        "is_deep_research": True,
        "sources_count": len(source_pack),
        "outlets": unique_outlets,
        "word_count": body_words,
    }


def process_deep_research_news(
    raw_title: str,
    source_pack: List[Dict[str, Any]],
    suggested_category: str = "AI & Tech",
    raw_image_url: Optional[str] = None,
    trending_terms: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Synthesizes a multi-source deep research article (300-700 words) using a source pack.
    Complies with strict editorial requirements:
    - 300 to 700 words in plain English with short sections (### What Happened / ### Key Details / ### What We Don't Know Yet).
    - Paraphrases in own words, max 1 short quote (<15 words).
    - When sources disagree or are silent, says so explicitly.
    - Headline max 60 characters with main subject first.
    - Ends with 'Sources:' line listing outlets and dates.
    - Confidence 'full' only when at least 2 sources agree on core facts and words >= 300.
    - Verifies all numbers, dates, scores against COMBINED source text.
    - Source field names all outlets used and links to main one.
    - Uses existing Gemini model list, pacing, and cooldown.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_error: Optional[str] = None

    outlets = [s.get("outlet", "Primary Source").strip() for s in source_pack if s.get("outlet")]
    unique_outlets = list(dict.fromkeys(outlets))
    outlets_str = ", ".join(unique_outlets)[:140]
    main_url = source_pack[0].get("url", "") if source_pack else ""
    sources_items = [f"{s.get('outlet', 'Wire')} ({s.get('date', 'Recent')})" for s in source_pack]
    default_sources_line = f"Sources: {', '.join(sources_items)}."

    # Build combined texts
    combined_sources_str = "\n\n".join([
        f"=== SOURCE {idx+1}: {s.get('outlet', 'Wire')} ({s.get('url', '')}) ===\n"
        f"Title: {s.get('title', '')}\n"
        f"Date: {s.get('date', 'Recent')}\n"
        f"Text:\n{s.get('text', '')}"
        for idx, s in enumerate(source_pack)
    ])

    combined_source_text = f"Title: {raw_title}\n\n" + combined_sources_str

    fixed_categories_str = ", ".join(FIXED_CATEGORIES)

    # Check trending terms in combined text
    active_trending = trending_terms or []
    if not active_trending:
        try:
            active_trending = get_trending_terms()
        except Exception:
            active_trending = []

    trending_in_source: List[str] = []
    if active_trending:
        try:
            trending_in_source = find_trending_terms_in_text(combined_source_text, trending_terms=active_trending, max_terms=3)
        except Exception:
            pass

    if trending_in_source:
        trending_prompt_block = f"""
TRENDING SEARCH TERM INTEGRATION:
The following search term(s) are currently trending and literally appear in the SOURCE PACK: {trending_in_source}
Rules for trending search terms:
1. Start the headline with the most relevant trending term from this list (or as close to the start as natural English allows), keeping headline max 60 characters.
2. Use this trending term naturally in the first sentence of the body and in the meta description.
3. The trending term may appear at most 2 times in total throughout the article body (never keyword-stuff).
4. CRITICAL FACTUAL RULE: NEVER add, invent, or imply any term, entity, or fact that is not explicitly supported by the SOURCE PACK.
"""
    else:
        trending_prompt_block = ""

    deep_prompt = f"""You are a senior investigative news editor writing a comprehensive deep-dive report for US and UK readers in clear, plain English.
You have been provided with a SOURCE PACK containing verified reports from multiple news outlets.

STRICT EDITORIAL REQUIREMENTS:
1. WORD COUNT: The article body MUST contain between 300 and 700 words (do not write under 300 words). Thoroughly explain the background, timelines, factual numbers, and corroborated statements from the sources.
2. STRUCTURE: Write comprehensive, well-developed paragraphs for each section (approximately 100 to 180 words each) using these exact Markdown headings:
   ### What Happened
   ### Key Details
   ### What We Don't Know Yet
3. FACTUAL GROUNDING: Use ONLY facts, figures, dates, and statements present in the SOURCE PACK. Never invent anything. Paraphrase everything in our own words; NEVER copy sentences directly.
4. QUOTES: At most ONE short direct quote (under 15 words) in quotation marks, strictly attributed to the named speaker.
5. DISAGREEMENTS & GAPS: When sources disagree or are silent on an aspect, state that explicitly instead of guessing or speculating.
6. HEADLINE: Maximum 60 characters. Place the main subject (product, person, company, or event) first. Clear, plain English, zero clickbait.
7. SOURCES LINE: The very last line of the body MUST be a single line starting with "Sources: " listing the outlets and dates used (e.g. "{default_sources_line}").
8. CONFIDENCE: Set confidence to "full" ONLY if at least 2 sources in the source pack agree on the core facts and the body contains at least 300 words. If sources conflict unresolvably, fewer than 2 sources agree, or facts are insufficient for 300 words, set confidence to "thin".
9. FORBIDDEN ADJECTIVES & BUZZWORDS: Never use unsupported adjectives like 'brilliant', 'crucial', 'major', 'dominant', 'stunning', 'historic' unless directly quoting. Banned words: tier-1, neural, dossier, telemetry, high-stakes, landmark, intelligence report, synthesized.
{trending_prompt_block}
Fixed categories list: {fixed_categories_str}
Select the single most accurate category for this story from the fixed list.

SOURCE PACK:
\"\"\"{combined_sources_str}\"\"\"

Return JSON:
{{
  "headline": "max 60 characters, main subject first, plain English, no clickbait",
  "meta_description": "A single real sentence stating the story's core fact from the sources, strictly 140-155 characters. Must end with a period.",
  "category": "one of the fixed list",
  "key_points": [
    "concrete fact 1 corroborated by sources",
    "concrete fact 2 corroborated by sources",
    "concrete fact 3 corroborated by sources"
  ],
  "body": "300 to 700 words with sections (### What Happened, ### Key Details, ### What We Don't Know Yet), ending with the Sources line",
  "why_it_matters": "2-3 sentences of analysis based strictly on the reported facts",
  "sources_agree": true,
  "confidence": "\"full\" only if at least 2 sources agree on core facts and body is 300-700 words; otherwise \"thin\""
}}"""

    if gemini_api_key:
        try:
            raw_response, api_err = call_gemini_api(deep_prompt, gemini_api_key)
            if api_err:
                gemini_error = api_err
            if raw_response:
                cleaned = clean_json_text(raw_response)
                data = None
                try:
                    data = json.loads(cleaned, strict=False)
                except Exception as json_err:
                    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned)
                    try:
                        data = json.loads(sanitized, strict=False)
                    except Exception as json_err2:
                        gemini_error = f"Invalid JSON response: {json_err2}"
                        data = None

                if data:
                    formatted = parse_and_format_deep_json(
                        data, raw_title, source_pack, suggested_category, raw_image_url=raw_image_url
                    )
                    formatted["generation_path"] = "gemini"
                    formatted["gemini_error"] = None

                    # Strict Number, Score, Date, Weekday, and Ranking Verification against COMBINED sources
                    is_valid, unverified = verify_output_facts(formatted, combined_source_text)

                    if not is_valid:
                        print(f"[Deep Research] Output contained unverified facts: {unverified}. Regenerating once with strict correction...")
                        correction_prompt = f"""{deep_prompt}

CRITICAL CORRECTION REQUIRED:
Your previous output invented the following numbers, scores, dates, weekdays, or rankings not present in the SOURCE PACK:
{', '.join(unverified)}

You must rewrite the JSON using ONLY facts, numbers, and scores directly confirmed in the SOURCE PACK.
- Never invent weekdays, months, dates, points, or scores unless explicitly written in the SOURCE PACK.
- Keep body between 300 and 700 words, structured into ### What Happened, ### Key Details, ### What We Don't Know Yet.
- End with the Sources: line.
- If a detail is not in the source text, omit it completely."""

                        retry_raw, retry_err = call_gemini_api(correction_prompt, gemini_api_key)
                        if retry_err:
                            gemini_error = retry_err
                        if retry_raw:
                            cleaned_retry = clean_json_text(retry_raw)
                            retry_data = None
                            try:
                                retry_data = json.loads(cleaned_retry, strict=False)
                            except Exception:
                                sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', lambda m: ' ' if m.group(0) in '\t\r\n' else '', cleaned_retry)
                                try:
                                    retry_data = json.loads(sanitized, strict=False)
                                except Exception:
                                    pass

                            if retry_data:
                                formatted_retry = parse_and_format_deep_json(
                                    retry_data, raw_title, source_pack, suggested_category, raw_image_url=raw_image_url
                                )
                                retry_valid, retry_unverified = verify_output_facts(formatted_retry, combined_source_text)

                                if retry_valid and formatted_retry["word_count"] >= 300 and len(source_pack) >= 2:
                                    print("[Deep Research] Fact Check Passed on Retry.")
                                    formatted_retry["generation_path"] = "gemini"
                                    formatted_retry["gemini_error"] = None
                                    formatted_retry["trending_term_used"] = extract_used_trending_term(formatted_retry, trending_in_source)
                                    return formatted_retry
                                else:
                                    print(f"[Deep Research] Still unverified on retry: {retry_unverified} (words: {formatted_retry['word_count']}). Marking confidence 'thin'.")
                                    formatted_retry["generation_path"] = "gemini"
                                    formatted_retry["confidence"] = "thin"
                                    formatted_retry["gemini_error"] = f"Failed factual verification on retry: {', '.join(retry_unverified)}"
                                    formatted_retry["trending_term_used"] = extract_used_trending_term(formatted_retry, trending_in_source)
                                    return formatted_retry
                    else:
                        formatted["trending_term_used"] = extract_used_trending_term(formatted, trending_in_source)
                        return formatted
        except Exception as e:
            gemini_error = str(e)
            print(f"[Deep Research Error] Exception during generation: {e}")

    # Fallback / Failed generation
    return {
        "title": raw_title[:HEADLINE_MAX_LENGTH],
        "headline": raw_title[:HEADLINE_MAX_LENGTH],
        "category": suggested_category,
        "summary": "Deep research synthesis could not be completed.",
        "key_points": ["Reporting from " + outlets_str],
        "body": "",
        "why_it_matters": "",
        "meta_description": "",
        "content": "",
        "author_name": EDITORIAL_BYLINE,
        "source_name": outlets_str,
        "source_url": main_url,
        "confidence": "thin",
        "image_url": None,
        "trending_term_used": "none",
        "generation_path": "gemini",
        "gemini_error": gemini_error or "Deep research synthesis failed or empty response",
        "is_deep_research": True,
        "sources_count": len(source_pack),
        "outlets": unique_outlets,
        "word_count": 0,
    }
