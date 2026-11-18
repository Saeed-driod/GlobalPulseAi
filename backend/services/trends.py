"""
GlobalPulse AI - Trending Search Terms Service
===============================================================================
Fetches and caches real-time daily trending searches across target markets
(US, GB, PK) via Google Trends RSS, with resilient Google search autocomplete
fallback for focused category seed keywords.

Features:
- 3-hour in-memory cache to stay fast and avoid rate limits.
- 6-second HTTP request timeout.
- Never crashes the pipeline: returns last cached value or empty list on any error.
- Controlled via TRENDS_ENABLED env var (default: true).
===============================================================================
"""

import os
import re
import time
import json
import urllib.request
from typing import List, Optional, Dict, Any

try:
    import feedparser
except ImportError:
    feedparser = None

# In-memory cache configuration
_cached_trending_terms: List[str] = []
_last_fetch_timestamp: float = 0.0
_cache_ttl_seconds: float = 3.0 * 3600.0  # 3 hours = 10,800 seconds
_active_source_used: str = "none"

# Target geographies for Google Trends RSS
GOOGLE_TRENDS_GEOS: List[str] = ["US", "GB", "PK"]

# Category seed terms for Google search autocomplete fallback
AUTOCOMPLETE_SEEDS: List[str] = [
    "AI",
    "artificial intelligence",
    "cricket",
    "football",
    "premier league",
    "champions league",
    "GTA",
    "PS5",
    "gaming",
    "cinema",
    "box office",
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def is_trends_enabled() -> bool:
    """Returns True if trending term integration is enabled via environment."""
    val = os.getenv("TRENDS_ENABLED", "true").strip().lower()
    return val in ("true", "1", "yes")


def get_active_trends_source() -> str:
    """Returns description of the source last used to populate trending terms."""
    return _active_source_used


def _fetch_google_trends_rss() -> List[str]:
    """
    Fetches daily trending searches from Google Trends RSS feeds across US, GB, and PK.
    Parses term titles, lowercases them, and deduplicates in order.
    """
    collected_terms: List[str] = []

    for geo in GOOGLE_TRENDS_GEOS:
        url = f"https://trends.google.com/trending/rss?geo={geo}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=6) as response:
                content = response.read()

                if feedparser is not None:
                    feed = feedparser.parse(content)
                    entries = getattr(feed, "entries", [])
                else:
                    # Minimal regex fallback if feedparser is unavailable
                    titles = re.findall(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", content.decode("utf-8", "ignore"))
                    entries = [{"title": t} for t in titles[1:]]

                for entry in entries:
                    raw_title = getattr(entry, "title", "") or ""
                    if isinstance(raw_title, dict):
                        raw_title = raw_title.get("value", "")
                    term = raw_title.strip().lower()
                    # Filter out feed meta titles and too-short strings
                    if term and len(term) >= 2 and not term.startswith("daily search trends"):
                        if term not in collected_terms:
                            collected_terms.append(term)
        except Exception as geo_err:
            # Individual geo error does not stop other geos
            print(f"[Trends Service Notice] Failed to fetch Trends RSS for geo={geo}: {geo_err}")

    return collected_terms


def _fetch_autocomplete_fallback() -> List[str]:
    """
    Fallback method: Queries Google Search Autocomplete for category seed keywords.
    Returns cleaned, deduplicated search suggestion phrases.
    """
    collected_terms: List[str] = []

    for seed in AUTOCOMPLETE_SEEDS:
        encoded_seed = urllib.parse.quote_plus(seed)
        url = f"https://suggestqueries.google.com/complete/search?client=chrome&q={encoded_seed}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=6) as response:
                data = json.loads(response.read().decode("utf-8", "ignore"))
                # data format: [query, [suggestions...], ...]
                if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                    for item in data[1]:
                        term = str(item).strip().lower()
                        if term and len(term) >= 2 and term not in collected_terms:
                            collected_terms.append(term)
        except Exception as seed_err:
            print(f"[Trends Service Notice] Autocomplete fallback error for '{seed}': {seed_err}")

    return collected_terms


def get_trending_terms(force_refresh: bool = False) -> List[str]:
    """
    Retrieves the current list of daily trending search terms.
    Cached in-memory for 3 hours. Never raises exceptions or crashes caller.

    Returns:
        List of lowercased, deduplicated search query strings.
    """
    global _cached_trending_terms, _last_fetch_timestamp, _active_source_used

    if not is_trends_enabled():
        return []

    now = time.time()
    # Check cache validity
    if not force_refresh and _cached_trending_terms and (now - _last_fetch_timestamp) < _cache_ttl_seconds:
        return list(_cached_trending_terms)

    try:
        # Step 1: Attempt Google Trends RSS (primary)
        terms = _fetch_google_trends_rss()

        if terms:
            _cached_trending_terms = terms
            _last_fetch_timestamp = now
            _active_source_used = "google_trends_rss"
            return list(_cached_trending_terms)

        # Step 2: Fallback to Google Autocomplete suggestions if RSS yielded nothing
        print("[Trends Service] Google Trends RSS returned no items; attempting Google autocomplete fallback...")
        fallback_terms = _fetch_autocomplete_fallback()

        if fallback_terms:
            _cached_trending_terms = fallback_terms
            _last_fetch_timestamp = now
            _active_source_used = "google_autocomplete_fallback"
            return list(_cached_trending_terms)

        # If both fresh fetches produced no items, return last cached if present
        if _cached_trending_terms:
            return list(_cached_trending_terms)

        return []

    except Exception as e:
        print(f"[Trends Service Warning] Error in get_trending_terms(): {e}")
        # Always safe: return last cached value or empty list, never crash
        return list(_cached_trending_terms) if _cached_trending_terms else []


def find_trending_terms_in_text(text: str, trending_terms: Optional[List[str]] = None, max_terms: int = 3) -> List[str]:
    """
    Finds trending terms that literally appear in the given text (case-insensitive whole-word match).
    Returns up to max_terms unique matches.
    """
    if not text:
        return []

    if trending_terms is None:
        trending_terms = get_trending_terms()

    if not trending_terms:
        return []

    matched: List[str] = []
    for term in trending_terms:
        clean = term.strip().lower()
        if len(clean) < 2:
            continue
        pattern = r"\b" + re.escape(clean) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            if clean not in matched:
                matched.append(clean)
                if len(matched) >= max_terms:
                    break

    return matched
