import re
import random
import urllib.parse
from typing import Optional, Dict, Any, List
import requests
from bs4 import BeautifulSoup

# Stop words to filter out when generating keyword prompt for Tier 3
STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "up", "about", "into", "over", "after", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "shall", "should", "may", "might", "must", "can",
    "could", "its", "it", "this", "that", "these", "those", "how", "why", "what",
    "who", "when", "where", "says", "said", "new", "more", "now", "just", "get",
    "way", "day", "week", "year", "people", "out"
}

GENERIC_PLACEHOLDERS = [
    "photo-1618005182384-a83a8bd57fbe",
    "photo-1611974789855-9c2a0a7236a3",
    "photo-1578575437130-527eed3abbec",
    "photo-1507413245164-6160d8298b31",
    "photo-1508098682722-e99c43a406b2"
]

def is_generic_placeholder(url: Optional[str]) -> bool:
    """Checks if an image URL is one of the generic static placeholders."""
    if not url:
        return True
    return any(p in url for p in GENERIC_PLACEHOLDERS)

def extract_rss_image(entry: Any) -> Optional[str]:
    """
    Tier 1: Extract image from RSS feed entry.
    Checks media_content, media_thumbnail, enclosures, and inline <img> tags.
    """
    if not entry:
        return None

    # 1. Check media_content
    media_content = getattr(entry, "media_content", None) or (entry.get("media_content") if isinstance(entry, dict) else None)
    if media_content and isinstance(media_content, list):
        for item in media_content:
            if isinstance(item, dict) and item.get("url"):
                url = item["url"]
                medium = item.get("medium", "")
                itype = item.get("type", "")
                if medium == "image" or "image" in itype or any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                    return url
                # Default accept if url has standard image traits
                if "http" in url and not any(skip in url.lower() for skip in ["pixel", "1x1", "avatar", "icon", "feedburner"]):
                    return url

    # 2. Check media_thumbnail
    media_thumbnail = getattr(entry, "media_thumbnail", None) or (entry.get("media_thumbnail") if isinstance(entry, dict) else None)
    if media_thumbnail and isinstance(media_thumbnail, list):
        for item in media_thumbnail:
            if isinstance(item, dict) and item.get("url"):
                return item["url"]

    # 3. Check enclosures
    enclosures = getattr(entry, "enclosures", None) or (entry.get("enclosures") if isinstance(entry, dict) else None)
    if enclosures and isinstance(enclosures, list):
        for enc in enclosures:
            if isinstance(enc, dict):
                url = enc.get("href") or enc.get("url")
                enc_type = enc.get("type", "")
                if url and ("image" in enc_type or any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])):
                    return url

    # 4. Check links
    links = getattr(entry, "links", None) or (entry.get("links") if isinstance(entry, dict) else None)
    if links and isinstance(links, list):
        for link in links:
            if isinstance(link, dict) and ("image" in link.get("type", "") or link.get("rel") == "enclosure"):
                if link.get("href"):
                    return link["href"]

    # 5. Check inline <img> in summary / description / content
    raw_texts = []
    for field in ["summary", "description", "content"]:
        val = getattr(entry, field, None) or (entry.get(field) if isinstance(entry, dict) else None)
        if isinstance(val, list):
            for v in val:
                if isinstance(v, dict) and "value" in v:
                    raw_texts.append(v["value"])
        elif isinstance(val, str):
            raw_texts.append(val)

    for text in raw_texts:
        img_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', text, re.IGNORECASE)
        if img_match:
            candidate = img_match.group(1)
            if not any(skip in candidate.lower() for skip in ["pixel", "1x1", "tracker", "badge", "avatar", "icon"]):
                return candidate

    return None

def scrape_opengraph_image(source_url: str, timeout: int = 4) -> Optional[str]:
    """
    Tier 2: Scrape OpenGraph (og:image) or Twitter Card (twitter:image) from source URL.
    Uses browser User-Agent and a strict timeout to prevent blocking.
    """
    if not source_url or not source_url.startswith("http"):
        return None

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        resp = requests.get(source_url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200 and resp.text:
            soup = BeautifulSoup(resp.text, "html.parser")

            # Check og:image
            og_meta = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
            if og_meta and og_meta.get("content"):
                url = og_meta["content"].strip()
                if url.startswith("http"):
                    return url

            # Check twitter:image
            tw_meta = soup.find("meta", property="twitter:image") or soup.find("meta", attrs={"name": "twitter:image"})
            if tw_meta and tw_meta.get("content"):
                url = tw_meta["content"].strip()
                if url.startswith("http"):
                    return url

            # Check image_src link
            link_img = soup.find("link", rel="image_src")
            if link_img and link_img.get("href"):
                url = link_img["href"].strip()
                if url.startswith("http"):
                    return url
    except Exception:
        pass

    return None

def generate_pollinations_image_url(title: str, category: str = "", seed: Optional[Any] = None) -> str:
    """
    Tier 3: Dynamic AI News Thumbnail Fallback using Pollinations AI.
    Generates a unique, photorealistic editorial news photography URL
    based on headline keywords and category.
    """
    # Clean headline into key topical keywords
    clean_title = re.sub(r"[^a-zA-Z0-9\s]", " ", title)
    words = [w.lower() for w in clean_title.split() if len(w) > 2 and w.lower() not in STOP_WORDS]
    
    # Pick top 4-6 descriptive words
    selected_words = words[:6] if words else ["global", "news"]
    keyword_str = " ".join(selected_words)

    if category == "Global Sports":
        prompt_text = f"{keyword_str} stadium pitch match action sports championship dynamic lighting 8k editorial photography"
    elif category and category.lower() not in keyword_str.lower():
        prompt_text = f"{keyword_str} {category} editorial news photography realistic 8k"
    else:
        prompt_text = f"{keyword_str} editorial news photography realistic 8k"

    url_encoded = urllib.parse.quote(prompt_text.strip())
    resolved_seed = seed if seed is not None else random.randint(10000, 999999)

    return f"https://image.pollinations.ai/prompt/{url_encoded}?width=800&height=450&nologo=true&seed={resolved_seed}"

def resolve_article_image(
    entry: Any = None,
    title: str = "",
    source_url: str = "",
    category: str = "",
    seed: Optional[Any] = None,
    current_image_url: Optional[str] = None
) -> str:
    """
    Full 3-Tier Image Resolution Pipeline:
    - If current_image_url is valid and NOT a generic placeholder, keep it.
    - Tier 1: Extract from RSS entry.
    - Tier 2: Scrape OpenGraph from source_url.
    - Tier 3: Generate dynamic Pollinations AI editorial news visual.
    """
    # 0. Check existing
    if current_image_url and not is_generic_placeholder(current_image_url) and current_image_url.startswith("http"):
        return current_image_url

    # 1. Tier 1: RSS Media
    tier1_url = extract_rss_image(entry)
    if tier1_url:
        return tier1_url

    # 2. Tier 2: OpenGraph scraping
    if source_url:
        tier2_url = scrape_opengraph_image(source_url)
        if tier2_url:
            return tier2_url

    # 3. Tier 3: Pollinations AI dynamic fallback
    return generate_pollinations_image_url(title, category, seed)

def refresh_missing_images() -> int:
    """
    Backfill helper function:
    Loops through all articles in SQLite database. If an article has a missing
    or generic placeholder image (or waves graphic), resolves a real, unique image
    using the 3-tier pipeline and updates the database.
    """
    try:
        from backend.database import SessionLocal
        from backend.models import Article
    except ImportError:
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
        from backend.database import SessionLocal
        from backend.models import Article

    db = SessionLocal()
    updated_count = 0
    try:
        articles = db.query(Article).all()
        print(f"[Image Engine] Checking {len(articles)} articles for image upgrade...")

        for article in articles:
            if is_generic_placeholder(article.image_url) or not article.image_url:
                new_url = resolve_article_image(
                    entry=None,
                    title=article.title,
                    source_url=article.source_url or "",
                    category=article.category or "",
                    seed=article.id
                )
                article.image_url = new_url
                updated_count += 1
                print(f"[Image Engine] Backfilled Article #{article.id} ('{article.title[:35]}...') -> {new_url[:70]}...")

        if updated_count > 0:
            db.commit()
            print(f"[Image Engine] Successfully backfilled {updated_count} articles with unique HD photos!")
        else:
            print("[Image Engine] All articles already have custom unique images.")
    except Exception as e:
        print(f"[Image Engine] Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

    return updated_count

if __name__ == "__main__":
    refresh_missing_images()
