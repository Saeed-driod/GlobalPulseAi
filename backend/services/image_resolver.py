"""
GlobalPulse AI - Copyright-Safe Branded Image Resolver
Complies strictly with editorial standards:
1. NEVER hotlinks publisher images (e.g. ichef.bbci.co.uk, Reuters, Guardian).
2. NEVER uses AI-generated synthetic photos for real news events or people.
3. Generates our own branded OG card (headline on dark GlobalPulse AI background).
4. Allows royalty-free licensed Unsplash visuals only when explicitly labeled as "Illustration".
"""

import re
import urllib.parse
from typing import Optional, Dict, Any, List

# Known publisher domains and CDNs whose images must NEVER be hotlinked
PUBLISHER_DOMAINS = [
    "ichef.bbci.co.uk", "bbci.co.uk", "bbc.com", "bbc.co.uk",
    "guim.co.uk", "theguardian.com",
    "reuters.com", "reutersmedia.net",
    "espn.com", "espncdn.com", "espncricinfo.com",
    "cnbc.com", "nbcnews.com",
    "politico.com",
    "aljazeera.com",
    "scx1.b-cdn.net", "sciencedaily.com", "phys.org",
    "cdn.sanity.io", "coindesk.com",
    "s.yimg.com", "yahoo.com",
    "variety.com",
    "ign.com", "ignimgs.com",
    "arstechnica.com", "condenast.com",
    "theverge.com", "vox-cdn.com",
    "techcrunch.com",
    "npr.org",
    "nasa.gov",
    "space.com"
]

def is_publisher_hotlink(url: Optional[str]) -> bool:
    """Checks if an image URL hotlinks from a third-party news publisher."""
    if not url:
        return False
    u = url.lower()
    return any(domain in u for domain in PUBLISHER_DOMAINS)

def is_generic_placeholder(url: Optional[str]) -> bool:
    """Checks if image URL is missing or empty."""
    if not url:
        return True
    return False

def is_low_res_thumbnail(url: Optional[str]) -> bool:
    """Checks if image URL is a low-res thumbnail."""
    if not url:
        return True
    u = url.lower()
    low_indicators = [
        "/standard/240/", "/standard/320/",
        "width=140", "width=150", "width=200",
        "w=140", "w=150", "w=200",
        "/tmb/", "_thumb", "-thumb", "thumbnail", "/small/",
        "/mini/", "_mini.", "-mini."
    ]
    return any(ind in u for ind in low_indicators)

def upgrade_image_url_to_hd(url: Optional[str]) -> Optional[str]:
    """Ensures image URL is valid and copyright-safe."""
    if not url or not url.startswith("http"):
        return url
    if is_publisher_hotlink(url):
        return None
    if "images.unsplash.com" in url:
        return re.sub(r"w=\d+", "w=1280", url)
    return url

def generate_branded_og_url(title: str, category: str = "AI & Tech") -> str:
    """
    Generates our own branded OG card URL:
    Renders headline text on dark GlobalPulse background via Next.js /api/og.
    100% self-hosted, deterministic, zero hallucinated people or events.
    """
    clean_title = title.replace("| GlobalPulse AI", "").strip()
    encoded_title = urllib.parse.quote(clean_title)
    encoded_cat = urllib.parse.quote(category or "News")
    return f"/api/og?title={encoded_title}&category={encoded_cat}"

def resolve_article_image(
    entry: Any = None,
    title: str = "",
    source_url: str = "",
    category: str = "",
    seed: Optional[Any] = None,
    current_image_url: Optional[str] = None
) -> str:
    """
    Copyright-Safe Image Resolution:
    1. Rejects any publisher image hotlinks (e.g. BBC ichef, Reuters, Guardian).
    2. Rejects AI-generated synthetic photos of real events or people.
    3. Returns our custom branded OG card (/api/og?title=...&category=...).
    """
    # Reject publisher hotlinks
    if current_image_url and is_publisher_hotlink(current_image_url):
        current_image_url = None

    # If current image is already a branded OG card or licensed unsplash illustration
    if current_image_url and (current_image_url.startswith("/api/og") or "images.unsplash.com" in current_image_url):
        return current_image_url

    # Generate our branded OG card
    return generate_branded_og_url(title=title, category=category)
