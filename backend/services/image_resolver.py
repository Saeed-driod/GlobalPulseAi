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

def is_low_res_thumbnail(url: Optional[str]) -> bool:
    """Checks if an image URL points to a low-res thumbnail."""
    if not url:
        return True
    u = url.lower()
    low_indicators = [
        "/standard/240/", "/standard/320/", "/standard/480/",
        "/news/240/", "/news/320/", "/news/480/",
        "width=140", "width=150", "width=200", "width=240", "width=300",
        "w=140", "w=150", "w=200", "w=240", "w=300",
        "/tmb/", "_thumb", "-thumb", "thumbnail", "/small/",
        "/mini/", "_mini.", "-mini."
    ]
    return any(ind in u for ind in low_indicators)

def upgrade_image_url_to_hd(url: Optional[str]) -> Optional[str]:
    """
    Intelligently rewrites known CDN thumbnail patterns to crystal-clear 1024px+ HD.
    """
    if not url or not url.startswith("http"):
        return url

    # 1. BBC CDN (ichef.bbci.co.uk): Rewrite 240/320/480/640 to 1024 HD
    if "ichef.bbci.co.uk" in url:
        url = re.sub(r"/standard/\d+/", "/standard/1024/", url)
        url = re.sub(r"/news/\d+/", "/news/1024/", url)
        return url

    # 2. Sanity CDN (CoinDesk, etc.): Rewrite w=800&h=450 to w=1600&h=900
    if "cdn.sanity.io" in url:
        url = re.sub(r"w=\d+&h=\d+", "w=1600&h=900", url)
        url = re.sub(r"w=\d+", "w=1600", url)
        if "fit=" not in url:
            url += "&fit=crop"
        return url

    # 3. ScienceX CDN (scx1.b-cdn.net): Rewrite /tmb/ to /800/
    if "b-cdn.net" in url and "/tmb/" in url:
        return url.replace("/tmb/", "/800/")

    # 4. Yahoo CDN (s.yimg.com): Rewrite /resize/ to 1200x675
    if "s.yimg.com" in url:
        url = re.sub(r"/resize/\d+x\d+/", "/resize/1200x675/", url)
        return url

    # 5. Pollinations AI: Upgrade to Flux 1280x720 with enhancement
    if "image.pollinations.ai" in url:
        url = re.sub(r"width=\d+&height=\d+", "width=1280&height=720", url)
        if "model=" not in url:
            url += "&model=flux&enhance=true"
        return url

    # 6. Unsplash CDN: Ensure 1280px width
    if "images.unsplash.com" in url:
        url = re.sub(r"w=\d+", "w=1280", url)
        return url

    return url

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
    powered by Flux with enhancement (1280x720 8K) based on headline keywords and category.
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

    return f"https://image.pollinations.ai/prompt/{url_encoded}?width=1280&height=720&model=flux&enhance=true&nologo=true&seed={resolved_seed}"

def resolve_article_image(
    entry: Any = None,
    title: str = "",
    source_url: str = "",
    category: str = "",
    seed: Optional[Any] = None,
    current_image_url: Optional[str] = None
) -> str:
    """
    Full 3-Tier HD Image Resolution Pipeline:
    - 0. Check current_image_url: Upgrade CDN to HD. If still a signed low-res thumbnail (e.g. Guardian 140px),
      attempt Tier 2 (OpenGraph) before accepting.
    - Tier 1: Extract from RSS entry and upgrade CDN to 1024px+ HD.
      If Tier 1 yields a low-res thumbnail that cannot be CDN-upgraded, attempt Tier 2 before using it.
    - Tier 2: Scrape OpenGraph (og:image) or Twitter Card (twitter:image) from source_url.
    - Tier 3: Dynamic Pollinations AI fallback powered by Flux with enhancement (1280x720 8K).
    """
    # 0. Check existing
    if current_image_url and not is_generic_placeholder(current_image_url) and current_image_url.startswith("http"):
        upgraded = upgrade_image_url_to_hd(current_image_url)
        if not is_low_res_thumbnail(upgraded):
            return upgraded
        # If it's a signed low-res thumbnail (e.g. Guardian signed width=140), scrape source_url for full 1200px master
        if source_url:
            og_img = scrape_opengraph_image(source_url)
            if og_img and not is_low_res_thumbnail(og_img):
                return upgrade_image_url_to_hd(og_img)
        return upgraded

    # 1. Tier 1: RSS Media
    tier1_url = extract_rss_image(entry)
    if tier1_url:
        upgraded_t1 = upgrade_image_url_to_hd(tier1_url)
        # If high-res, return immediately
        if not is_low_res_thumbnail(upgraded_t1):
            return upgraded_t1
        # If still low-res, prioritize Tier 2 (OpenGraph) from source_url!
        if source_url:
            tier2_url = scrape_opengraph_image(source_url)
            if tier2_url and not is_low_res_thumbnail(tier2_url):
                return upgrade_image_url_to_hd(tier2_url)
        return upgraded_t1

    # 2. Tier 2: OpenGraph scraping
    if source_url:
        tier2_url = scrape_opengraph_image(source_url)
        if tier2_url:
            return upgrade_image_url_to_hd(tier2_url)

    # 3. Tier 3: Pollinations AI dynamic fallback (Flux 1280x720 HD)
    return generate_pollinations_image_url(title, category, seed)

def refresh_missing_images() -> int:
    """
    Backfill helper function:
    Loops through all articles in database. If an article has a missing,
    generic placeholder, or low-res thumbnail image, upgrades it to full HD (1024px+).
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
        print(f"[Image Engine] Checking {len(articles)} articles for HD image upgrade...")

        for article in articles:
            needs_upgrade = (
                not article.image_url
                or is_generic_placeholder(article.image_url)
                or is_low_res_thumbnail(article.image_url)
            )

            if needs_upgrade:
                new_url = resolve_article_image(
                    entry=None,
                    title=article.title,
                    source_url=getattr(article, "source_url", "") or "",
                    category=article.category or "",
                    seed=article.id,
                    current_image_url=article.image_url
                )
                if new_url and new_url != article.image_url:
                    article.image_url = new_url
                    updated_count += 1
                    print(f"[Image Engine] Upgraded Article #{article.id} ('{article.title[:35]}...') -> {new_url[:75]}...")

        if updated_count > 0:
            db.commit()
            print(f"[Image Engine] Successfully upgraded {updated_count} articles to full HD quality!")
        else:
            print("[Image Engine] All articles already have high-definition HD images.")
    except Exception as e:
        print(f"[Image Engine] Error during HD upgrade: {e}")
        db.rollback()
    finally:
        db.close()

    return updated_count

if __name__ == "__main__":
    refresh_missing_images()
