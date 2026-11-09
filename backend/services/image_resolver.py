"""
GlobalPulse AI - Authentic News Source Image Resolver
Prioritizes the EXACT, genuine source photograph from the news article / RSS feed:
1. Extracts genuine editorial photos from RSS media tags (media:content, enclosure, media:thumbnail).
2. Extracts original <meta property="og:image"> directly from the publisher's source article URL.
3. Automatically upgrades low-res thumbnails (e.g. BBC 240p -> 976p HD).
4. Falls back to curated category imagery ONLY if the source article has no image.
"""

import re
import html
import urllib.request
import urllib.parse
from typing import Optional, Dict, Any, List

def clean_image_url(url: Optional[str]) -> str:
    """Cleans, unescapes, and normalizes image URL."""
    if not url or not isinstance(url, str):
        return ""
    u = html.unescape(url.strip())
    if u.startswith("//"):
        u = "https:" + u
    if u.startswith("http://p.imgci.com"):
        u = u.replace("http://", "https://")
    if "/standard/240/" in u:
        u = u.replace("/standard/240/", "/standard/976/")
    return u

def extract_source_image_from_entry_or_url(entry: Any = None, source_url: Optional[str] = None) -> Optional[str]:
    """
    Extracts the authentic source image directly from the RSS feed entry or the publisher's webpage.
    """
    # 1. Check entry media tags (fastest, zero network delay)
    if entry:
        media_content = getattr(entry, "media_content", None)
        if media_content and isinstance(media_content, list):
            for m in media_content:
                u = m.get("url")
                if u and isinstance(u, str) and (u.startswith("http") or u.startswith("//")):
                    return clean_image_url(u)

        enclosures = getattr(entry, "enclosures", None)
        if enclosures and isinstance(enclosures, list):
            for enc in enclosures:
                u = enc.get("href") or enc.get("url")
                if u and isinstance(u, str) and (u.startswith("http") or u.startswith("//")):
                    return clean_image_url(u)

        thumbs = getattr(entry, "media_thumbnail", None)
        if thumbs and isinstance(thumbs, list):
            for t in thumbs:
                u = t.get("url")
                if u and isinstance(u, str) and (u.startswith("http") or u.startswith("//")):
                    return clean_image_url(u)

        links = getattr(entry, "links", None)
        if links and isinstance(links, list):
            for l in links:
                if "image" in l.get("type", ""):
                    u = l.get("href")
                    if u and isinstance(u, str) and (u.startswith("http") or u.startswith("//")):
                        return clean_image_url(u)

    # 2. Extract og:image directly from publisher's source article webpage
    if source_url and isinstance(source_url, str) and source_url.startswith("http"):
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            req = urllib.request.Request(source_url, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                text = resp.read().decode("utf-8", errors="ignore")
                matches = re.findall(r'<meta[^>]+property=[\x22\x27]og:image[\x22\x27][^>]+content=[\x22\x27]([^\x22\x27]+)', text, re.I)
                if not matches:
                    matches = re.findall(r'<meta[^>]+content=[\x22\x27]([^\x22\x27]+)[\x22\x27][^>]+property=[\x22\x27]og:image', text, re.I)
                if matches:
                    return clean_image_url(matches[0])
        except Exception:
            pass

    return None

def get_curated_unsplash_photo(category: str = "AI & Tech", title: str = "", seed: Optional[Any] = None) -> str:
    """
    Returns a topic-matched, high-definition Unsplash photo as a fallback.
    """
    try:
        from services.video_generator import CATEGORY_CURATED_PHOTOS, normalize_category_key
    except ImportError:
        try:
            from .video_generator import CATEGORY_CURATED_PHOTOS, normalize_category_key
        except Exception:
            return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80"

    norm_cat = normalize_category_key(category)
    pool = CATEGORY_CURATED_PHOTOS.get(norm_cat, CATEGORY_CURATED_PHOTOS.get("AI & Tech", []))
    if not pool:
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80"

    if seed is not None and isinstance(seed, int):
        idx = abs(seed) % len(pool)
    elif title:
        idx = abs(hash(title)) % len(pool)
    else:
        idx = 0
    return pool[idx]

def resolve_article_image(
    entry: Any = None,
    title: str = "",
    source_url: str = "",
    category: str = "",
    seed: Optional[Any] = None,
    current_image_url: Optional[str] = None
) -> str:
    """
    Primary Image Resolver:
    1. First checks if existing image is already a valid HTTP source image (and not /api/og).
    2. Extracts authentic news photo from entry media tags or source article URL.
    3. Falls back to curated category visuals only if no source photo exists.
    """
    if current_image_url and current_image_url.startswith("http") and not current_image_url.startswith("/api/og"):
        # If it's a generic Unsplash fallback, try to upgrade it with the real source image
        if "images.unsplash.com" not in current_image_url:
            return clean_image_url(current_image_url)

    # Extract real source picture
    source_img = extract_source_image_from_entry_or_url(entry=entry, source_url=source_url)
    if source_img and source_img.startswith("http"):
        return source_img

    # If current image is an Unsplash image already, keep it
    if current_image_url and "images.unsplash.com" in current_image_url:
        return current_image_url

    # Final Fallback
    seed_val = seed if isinstance(seed, int) else None
    return get_curated_unsplash_photo(category=category, title=title, seed=seed_val)

def refresh_missing_images():
    """Scans recent articles and restores genuine source photos from source URLs."""
    try:
        from database import SessionLocal
        from models import Article
    except ImportError:
        try:
            from ..database import SessionLocal
            from ..models import Article
        except Exception:
            return

    try:
        with SessionLocal() as db:
            recent_articles = db.query(Article).order_by(Article.id.desc()).limit(100).all()
            updated = 0
            for art in recent_articles:
                if not art.image_url or art.image_url.startswith("/api/og") or "images.unsplash.com" in art.image_url:
                    if art.source_url:
                        real_img = extract_source_image_from_entry_or_url(source_url=art.source_url)
                        if real_img and real_img.startswith("http"):
                            art.image_url = real_img
                            updated += 1
            if updated > 0:
                db.commit()
                print(f"[Image Resolver] Restored {updated} authentic news source photos.")
    except Exception as e:
        print(f"[Image Resolver Notice] Startup refresh notice: {e}")

