"""
GlobalPulse AI - Deep Research Service
Builds comprehensive multi-source packs for top trending stories.
Fetches full article pages, respects robots.txt, strips boilerplate,
and finds corroborating reporting from other RSS items in the same run.
"""

import os
import re
import json
import socket
import urllib.request
import urllib.parse
import urllib.robotparser
import urllib.error
import html
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

# Honest bot identity referencing site /about page
USER_AGENT = "GlobalPulseBot/1.0 (+https://theglobalpulseai.com/about)"

# In-memory robots.txt cache: netloc -> Optional[RobotFileParser]
_ROBOTS_CACHE: Dict[str, Any] = {}

# In-memory extracted page text cache for current cycle: url -> Optional[str]
_PAGE_CACHE: Dict[str, Optional[str]] = {}

# Skipped due to robots.txt counter for current run
_SKIPPED_ROBOTS_COUNT = 0


def get_skipped_robots_count() -> int:
    return _SKIPPED_ROBOTS_COUNT


def reset_skipped_robots_count() -> None:
    global _SKIPPED_ROBOTS_COUNT
    _SKIPPED_ROBOTS_COUNT = 0

# Daily tracking file
_DAILY_TRACK_FILE = Path(__file__).resolve().parent.parent / ".deep_research_daily.json"

STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "after", "says",
    "report", "reports", "will", "what", "when", "where", "news", "first",
    "about", "more", "over", "into", "their", "have", "been", "could",
    "would", "were", "they", "them", "which", "than", "some", "other",
    "exclusive", "breaking", "update", "live", "watch", "here", "video"
}


# ==============================================================================
# 1. DAILY QUOTA TRACKING (DEEP_RESEARCH_PER_DAY, default 5)
# ==============================================================================

def get_deep_research_daily_max() -> int:
    env_val = os.getenv("DEEP_RESEARCH_PER_DAY", "5")
    try:
        return int(env_val)
    except ValueError:
        return 5


def get_deep_research_daily_count() -> int:
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not _DAILY_TRACK_FILE.exists():
        return 0
    try:
        with open(_DAILY_TRACK_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data.get("date") == today_str:
                return int(data.get("count", 0))
    except Exception:
        pass
    return 0


def can_do_deep_research_today() -> bool:
    count = get_deep_research_daily_count()
    max_allowed = get_deep_research_daily_max()
    return count < max_allowed


def record_deep_research_done():
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_count = get_deep_research_daily_count()
    try:
        with open(_DAILY_TRACK_FILE, "w", encoding="utf-8") as f:
            json.dump({"date": today_str, "count": current_count + 1}, f)
    except Exception as e:
        print(f"[Research Notice] Could not save daily count: {e}")


# ==============================================================================
# 2. ROBOTS.TXT CHECKER
# ==============================================================================

def is_allowed_by_robots(url: str) -> bool:
    """
    Checks if robots.txt allows fetching url:
    - If robots.txt returns 5xx or times out, treat as NOT allowed for this cycle (skip it).
    - Only 200 (parsed according to robots rules) or 404 (allowed) determine fetch permission.
    - Uses in-memory cache for the cycle.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return False
        netloc = parsed.netloc.lower()

        if netloc not in _ROBOTS_CACHE:
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            try:
                req = urllib.request.Request(
                    robots_url,
                    headers={"User-Agent": USER_AGENT, "Accept": "text/plain"}
                )
                with urllib.request.urlopen(req, timeout=4) as resp:
                    status_code = getattr(resp, "status", 200)
                    if status_code == 200:
                        content = resp.read().decode("utf-8", errors="ignore")
                        rp.parse(content.splitlines())
                        _ROBOTS_CACHE[netloc] = rp
                    elif status_code == 404:
                        # 404 means allowed
                        _ROBOTS_CACHE[netloc] = True
                    else:
                        # 5xx or other non-200/non-404 means NOT allowed for this cycle
                        _ROBOTS_CACHE[netloc] = False
            except urllib.error.HTTPError as he:
                if he.code == 404:
                    # 404 means allowed
                    _ROBOTS_CACHE[netloc] = True
                else:
                    # 5xx or other error -> treat as NOT allowed for this cycle
                    _ROBOTS_CACHE[netloc] = False
            except (urllib.error.URLError, socket.timeout, TimeoutError):
                # Timeout or connection failure -> treat as NOT allowed for this cycle
                _ROBOTS_CACHE[netloc] = False
            except Exception:
                # Any other unexpected error -> treat as NOT allowed
                _ROBOTS_CACHE[netloc] = False

        cached_entry = _ROBOTS_CACHE.get(netloc)
        if cached_entry is False:
            return False
        if cached_entry is True:
            return True
        if isinstance(cached_entry, urllib.robotparser.RobotFileParser):
            return cached_entry.can_fetch(USER_AGENT, url)
        return False
    except Exception:
        return False


# ==============================================================================
# 3. HTML TEXT EXTRACTION
# ==============================================================================

PAYWALL_MARKERS = [
    "subscribe to continue",
    "subscriber-only",
    "subscribers only",
    "sign in to continue reading",
    "create an account to continue",
    "already a subscriber? sign in",
    "reached your limit of free articles",
    "purchase a subscription",
    "this article is exclusive to",
    "to read the full article",
    "start your free trial to continue"
]


def extract_main_text_from_html(html_content: str) -> str:
    """
    Extracts the main readable article text from HTML:
    - Strips scripts, styles, nav, header, footer, ads
    - Extracts meaningful paragraphs (>25 chars)
    - Skips paywalled or empty pages
    """
    if not html_content or len(html_content.strip()) < 100:
        return ""

    text = ""

    if BeautifulSoup:
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            # Decompose boilerplate elements
            for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form", "noscript", "iframe", "svg", "button", "input"]):
                tag.decompose()

            # Target article container if available
            article_el = (
                soup.find("article")
                or soup.find("main")
                or soup.find(class_=re.compile(r"article[-_]body|post[-_]content|entry[-_]content|story[-_]content", re.I))
                or soup.find(id=re.compile(r"article[-_]body|story[-_]body", re.I))
            )
            p_tags = article_el.find_all("p") if article_el else soup.find_all("p")
            paras = [p.get_text().strip() for p in p_tags if len(p.get_text().strip()) >= 25]
            text = "\n\n".join(paras)
        except Exception:
            text = ""

    # Fallback to regex-based extraction if BeautifulSoup is missing or failed
    if not text:
        clean = re.sub(r'<(script|style|nav|header|footer|aside|form|noscript)[^>]*>.*?</\1>', ' ', html_content, flags=re.I | re.S)
        raw_paras = re.findall(r'<p[^>]*>(.*?)</p>', clean, flags=re.I | re.S)
        paras = []
        for p in raw_paras:
            p_clean = re.sub(r'<[^>]+>', ' ', p)
            p_clean = html.unescape(p_clean).strip()
            p_clean = re.sub(r'\s+', ' ', p_clean)
            if len(p_clean) >= 25:
                paras.append(p_clean)
        text = "\n\n".join(paras)

    text_lower = text.lower()

    # Paywall detection: if text is short and contains paywall keywords, skip
    if len(text) < 500:
        if any(marker in text_lower for marker in PAYWALL_MARKERS):
            return ""

    # Skip empty or thin text
    if len(text) < 150:
        return ""

    return text.strip()


def fetch_article_page(url: str, timeout: int = 8, max_bytes: int = 204800) -> Optional[str]:
    """
    Fetches full text of a webpage:
    - Polite User-Agent
    - 8 second timeout
    - Respects robots.txt
    - Max 200 KB
    - Strips boilerplate & paywalls
    - Returns up to ~2500 characters of readable text
    """
    if not url or not isinstance(url, str) or not url.startswith("http"):
        return None

    if url in _PAGE_CACHE:
        return _PAGE_CACHE[url]

    if not is_allowed_by_robots(url):
        global _SKIPPED_ROBOTS_COUNT
        _SKIPPED_ROBOTS_COUNT += 1
        _PAGE_CACHE[url] = None
        return None

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9"
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content_type = resp.headers.get("Content-Type", "").lower()
            if "html" not in content_type and "xml" not in content_type:
                _PAGE_CACHE[url] = None
                return None
            raw_bytes = resp.read(max_bytes)
            content = raw_bytes.decode("utf-8", errors="ignore")
            main_text = extract_main_text_from_html(content)
            if not main_text:
                _PAGE_CACHE[url] = None
                return None
            # Return first ~2500 characters
            if len(main_text) > 2500:
                cut = main_text[:2500].rsplit("\n\n", 1)[0]
                res = cut if len(cut) > 1500 else main_text[:2500]
            else:
                res = main_text
            _PAGE_CACHE[url] = res
            return res
    except Exception:
        _PAGE_CACHE[url] = None
        return None


# ==============================================================================
# 4. SOURCE PACK BUILDER
# ==============================================================================

def extract_proper_nouns(text: str) -> set:
    """Extracts capitalized entity words from title or text."""
    words = re.findall(r'\b[A-Z][a-zA-Z0-9_\'-]+\b', text)
    return {w for w in words if w.lower() not in STOPWORDS and len(w) > 2}


def score_story_similarity(candidate_title: str, other_title: str, candidate_trending: List[str]) -> int:
    """Scores how likely other_title is reporting on the same event as candidate_title."""
    cand_lower = candidate_title.lower()
    other_lower = other_title.lower()

    cand_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', cand_lower)) - STOPWORDS
    other_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', other_lower)) - STOPWORDS

    if not cand_words or not other_words:
        return 0

    shared_words = cand_words & other_words
    score = len(shared_words) * 3

    # Proper noun overlap bonus
    cand_nouns = extract_proper_nouns(candidate_title)
    other_nouns = extract_proper_nouns(other_title)
    shared_nouns = cand_nouns & other_nouns
    score += len(shared_nouns) * 5

    # Trending term match bonus
    for term in candidate_trending:
        if len(term) >= 3 and term.lower() in cand_lower and term.lower() in other_lower:
            score += 10

    # Jaccard word similarity
    jaccard = len(shared_words) / max(1, len(cand_words | other_words))
    if jaccard >= 0.25:
        score += int(jaccard * 10)

    return score


def build_source_pack(
    candidate: Dict[str, Any],
    all_raw_items: List[Dict[str, Any]],
    trending_terms: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Builds a multi-source pack for deep research:
    1. Fetches full text of the candidate's own page.
    2. Finds up to 2 other items in all_raw_items covering the same event.
    3. Fetches their full text.
    4. Returns list of {outlet, url, title, text, date}.
    """
    cand_url = candidate.get("source_url") or candidate.get("url") or ""
    cand_title = candidate.get("raw_title") or candidate.get("title") or ""
    cand_outlet = candidate.get("source_name") or "Primary Source"

    if not cand_url:
        return []

    # 1. Fetch candidate full text
    cand_text = fetch_article_page(cand_url)
    if not cand_text or len(cand_text) < 150:
        return []

    source_pack: List[Dict[str, Any]] = [
        {
            "outlet": cand_outlet,
            "url": cand_url,
            "title": cand_title,
            "text": cand_text[:2500],
            "date": datetime.now(timezone.utc).strftime("%d %b %Y")
        }
    ]

    # 2. Find up to 2 other items in all_raw_items about the same event
    matched_candidates: List[Tuple[int, Dict[str, Any]]] = []
    active_trending = trending_terms or []

    candidate_netloc = urllib.parse.urlparse(cand_url).netloc.lower()

    for item in all_raw_items:
        i_url = item.get("source_url") or item.get("url") or ""
        i_title = item.get("raw_title") or item.get("title") or ""
        if not i_url or i_url == cand_url:
            continue
        # Avoid same domain if possible to get diverse outlets
        i_netloc = urllib.parse.urlparse(i_url).netloc.lower()
        if i_netloc and i_netloc == candidate_netloc:
            continue

        score = score_story_similarity(cand_title, i_title, active_trending)
        if score >= 8:
            matched_candidates.append((score, item))

    # Sort best matches first
    matched_candidates.sort(key=lambda x: x[0], reverse=True)

    # 3. Fetch up to 2 other matched items
    for _, other_item in matched_candidates:
        if len(source_pack) >= 3:
            break
        other_url = other_item.get("source_url") or other_item.get("url") or ""
        if not other_url or any(s["url"] == other_url for s in source_pack):
            continue
        other_outlet = other_item.get("source_name") or "Corroborating Wire"
        other_title = other_item.get("raw_title") or other_item.get("title") or ""

        other_text = fetch_article_page(other_url)
        if other_text and len(other_text) >= 150:
            source_pack.append({
                "outlet": other_outlet,
                "url": other_url,
                "title": other_title,
                "text": other_text[:2500],
                "date": datetime.now(timezone.utc).strftime("%d %b %Y")
            })

    return source_pack
