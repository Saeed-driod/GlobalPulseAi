"""
========================================================================================
GlobalPulse AI - Facebook Page Automated Publisher
========================================================================================
Publishes articles, news summaries, and videos directly to your Facebook Page using
the official Meta Graph API (v21.0).

Capabilities:
1. post_article_to_facebook: Posts rich clickable link preview to the Page feed.
2. post_photo_to_facebook  : Posts high-res image with compelling description & link.
3. post_video_to_facebook  : Uploads native MP4 video/Reel directly to the Facebook Page.
4. check_facebook_auth     : Verifies Page ID and Access Token validity.
========================================================================================
"""

import os
import urllib.request
import urllib.parse
import json
from pathlib import Path
from typing import Dict, Any, Optional

from dotenv import load_dotenv

# Ensure backend/.env is loaded
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
load_dotenv()

GRAPH_API_VERSION = "v21.0"
BASE_GRAPH_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

# Resolve credentials from environment
def get_facebook_credentials() -> Dict[str, str]:
    # Re-check env if needed
    if not os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN") and _env_path.exists():
        load_dotenv(_env_path, override=True)
    page_id = (os.getenv("FACEBOOK_PAGE_ID") or "").strip()
    access_token = (os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN") or "").strip()
    return {
        "page_id": page_id,
        "access_token": access_token
    }

def check_facebook_auth() -> Dict[str, Any]:
    """
    Checks if Facebook Page credentials are configured and valid.
    Returns page name, ID, and connection status.
    """
    creds = get_facebook_credentials()
    page_id = creds["page_id"]
    token = creds["access_token"]

    if not page_id or not token:
        return {
            "authenticated": False,
            "message": "Facebook credentials not configured. Please add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN to backend/.env."
        }

    try:
        url = f"{BASE_GRAPH_URL}/{page_id}?fields=id,name,link,fan_count&access_token={urllib.parse.quote(token)}"
        req = urllib.request.Request(url, headers={"User-Agent": "GlobalPulseAI/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "authenticated": True,
                "page_id": data.get("id"),
                "page_name": data.get("name"),
                "page_link": data.get("link"),
                "fan_count": data.get("fan_count", 0),
                "message": f"Connected to Facebook Page: {data.get('name')}"
            }
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        return {
            "authenticated": False,
            "error_code": e.code,
            "message": f"Facebook API Error ({e.code}): {err_msg}"
        }
    except Exception as e:
        return {
            "authenticated": False,
            "message": f"Facebook Connection Exception: {e}"
        }

CATEGORY_HASHTAG_MAP = {
    "AI & Tech": [
        "#TechNews", "#AI", "#ArtificialIntelligence", "#Technology", "#SmartTech",
        "#TechTrends", "#Innovation", "#FutureTech", "#Gadgets", "#CyberSecurity",
        "#BigTech", "#MachineLearning", "#DigitalTransformation"
    ],
    "Global Sports": [
        "#SportsNews", "#Cricket", "#Football", "#Soccer", "#WorldCup",
        "#ChampionsTrophy", "#MatchDay", "#SportsHighlights", "#CricketFans",
        "#LiveSports", "#TrendingSports", "#Athletes"
    ],
    "Future Science": [
        "#ScienceNews", "#Discovery", "#SpaceExploration", "#Physics", "#Astronomy",
        "#Research", "#ScienceFacts", "#Innovation", "#DeepTech", "#FutureScience",
        "#ScientificBreakthrough"
    ],
    "Markets & Finance": [
        "#FinanceNews", "#StockMarket", "#Crypto", "#Bitcoin", "#Economy",
        "#Investing", "#GlobalEconomy", "#MarketWatch", "#Trading", "#WallStreet",
        "#FinancialFreedom", "#Wealth"
    ],
    "Geopolitics": [
        "#WorldNews", "#BreakingNews", "#Geopolitics", "#GlobalAffairs", "#InternationalNews",
        "#Headlines", "#CurrentEvents", "#ForeignPolicy", "#GlobalPulse", "#WorldPolitics"
    ],
    "Entertainment": [
        "#EntertainmentNews", "#Hollywood", "#Movies", "#Cinema", "#Streaming",
        "#CelebrityNews", "#PopCulture", "#TVSeries", "#TrendingNow"
    ]
}

VIRAL_CORE_TAGS = ["#Trending", "#Viral", "#Explore", "#TopStories", "#DailyNews", "#Breaking", "#GlobalPulseAI"]

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
    "which", "this", "that", "these", "those", "then", "just", "so", "than",
    "such", "both", "through", "about", "for", "is", "of", "while", "during",
    "to", "from", "in", "out", "on", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "can", "will",
    "just", "don", "should", "now", "does", "into", "with", "makes", "shed", "light"
}

def generate_facebook_hashtags(title: str, category: Optional[str] = None) -> str:
    """
    Generates 12-16 high-volume, high-traffic search hashtags for maximum viral reach on Facebook.
    Combines:
    1. Targeted niche tags based on category
    2. Dynamic keyword tags extracted directly from the article headline
    3. Evergreen high-engagement discovery tags
    """
    selected_tags = []

    # 1. Category specific niche tags
    matched_cat = None
    if category:
        for cat_key in CATEGORY_HASHTAG_MAP:
            if cat_key.lower() in category.lower() or category.lower() in cat_key.lower():
                matched_cat = cat_key
                break
    
    if matched_cat and matched_cat in CATEGORY_HASHTAG_MAP:
        selected_tags.extend(CATEGORY_HASHTAG_MAP[matched_cat][:6])
    else:
        selected_tags.extend(["#WorldNews", "#BreakingNews", "#GlobalNews", "#Headlines", "#NewsUpdate"])

    # 2. Extract 2-3 capitalized keyword hashtags from the headline
    import re
    words = re.findall(r"[A-Za-z0-9]+", title or "")
    keyword_tags = []
    for w in words:
        w_lower = w.lower()
        if len(w) >= 4 and w_lower not in STOP_WORDS:
            tag = f"#{w.capitalize()}"
            if tag not in selected_tags and tag not in keyword_tags:
                keyword_tags.append(tag)
        if len(keyword_tags) >= 4:
            break
    selected_tags.extend(keyword_tags)

    # 3. Add viral search tags
    for vt in VIRAL_CORE_TAGS:
        if vt not in selected_tags:
            selected_tags.append(vt)
        if len(selected_tags) >= 15:
            break

    return " ".join(selected_tags[:16])

def post_article_to_facebook(
    title: str,
    summary: str,
    article_url: str,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Publishes a rich clickable link post to the Facebook Page feed.
    Facebook automatically unfurls the Open Graph preview card with title and image!
    """
    creds = get_facebook_credentials()
    page_id = creds["page_id"]
    token = creds["access_token"]

    if not page_id or not token:
        return {"success": False, "message": "Facebook credentials missing in environment."}

    # Format engaging Facebook post caption with high-volume search hashtags
    clean_summary = (summary or "").replace("*", "").strip()[:260]
    hashtags = generate_facebook_hashtags(title, category)

    message = (
        f"⚡ {title}\n\n"
        f"📌 BRIEFING:\n{clean_summary}...\n\n"
        f"👉 Read verified analysis & full intelligence dossier on GlobalPulse AI:\n"
        f"🔗 {article_url}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🔍 SEARCH TAGS & TOPICS:\n"
        f"{hashtags}"
    )

    payload = urllib.parse.urlencode({
        "message": message,
        "link": article_url,
        "access_token": token
    }).encode("utf-8")

    endpoint = f"{BASE_GRAPH_URL}/{page_id}/feed"

    try:
        req = urllib.request.Request(endpoint, data=payload, headers={"User-Agent": "GlobalPulseAI/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            post_id = res_data.get("id")
            print(f"[Facebook Auto-Post] Successfully published article to Facebook Page: {post_id}")
            return {
                "success": True,
                "post_id": post_id,
                "post_url": f"https://www.facebook.com/{post_id}" if post_id else None
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"[Facebook Post Error] HTTP {e.code}: {err_body}")
        return {"success": False, "error": err_body}
    except Exception as e:
        print(f"[Facebook Post Exception] {e}")
        return {"success": False, "error": str(e)}

def post_to_facebook_group(
    group_id: str,
    title: str,
    summary: str,
    article_url: str,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Publishes a post directly to a Facebook Group feed.
    Requirements:
    1. The Facebook App or Page must have been added to the Group in Group Settings -> Apps.
    2. The Page or User must have posting privileges in the Group.
    """
    creds = get_facebook_credentials()
    token = creds["access_token"]
    if not token:
        return {"success": False, "message": "Facebook access token missing."}

    clean_summary = (summary or "").replace("*", "").strip()[:260]
    hashtags = generate_facebook_hashtags(title, category)

    message = (
        f"⚡ {title}\n\n"
        f"📌 BRIEFING:\n{clean_summary}...\n\n"
        f"👉 Read verified analysis & full intelligence dossier on GlobalPulse AI:\n"
        f"🔗 {article_url}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🔍 SEARCH TAGS:\n"
        f"{hashtags}"
    )

    payload = urllib.parse.urlencode({
        "message": message,
        "link": article_url,
        "access_token": token
    }).encode("utf-8")

    endpoint = f"{BASE_GRAPH_URL}/{group_id}/feed"
    try:
        req = urllib.request.Request(endpoint, data=payload, headers={"User-Agent": "GlobalPulseAI/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            post_id = res_data.get("id")
            print(f"[Facebook Group Auto-Post] Published to Group {group_id}: {post_id}")
            return {
                "success": True,
                "post_id": post_id,
                "post_url": f"https://www.facebook.com/{post_id}" if post_id else None
            }
    except Exception as e:
        print(f"[Facebook Group Post Error] {e}")
        return {"success": False, "error": str(e)}

def post_photo_to_facebook(
    image_url: str,
    caption: str,
    link_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Publishes a standalone photo post with rich caption to the Facebook Page.
    """
    creds = get_facebook_credentials()
    page_id = creds["page_id"]
    token = creds["access_token"]

    if not page_id or not token:
        return {"success": False, "message": "Facebook credentials missing."}

    full_caption = caption
    if link_url:
        full_caption += f"\n\n🔗 Read full report: {link_url}"

    payload = urllib.parse.urlencode({
        "url": image_url,
        "caption": full_caption,
        "access_token": token
    }).encode("utf-8")

    endpoint = f"{BASE_GRAPH_URL}/{page_id}/photos"

    try:
        req = urllib.request.Request(endpoint, data=payload, headers={"User-Agent": "GlobalPulseAI/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            return {"success": True, "photo_id": res_data.get("id"), "post_id": res_data.get("post_id")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def post_video_to_facebook(
    video_path: str,
    title: str,
    description: str
) -> Dict[str, Any]:
    """
    Uploads native MP4 video (or vertical Reel) directly to the Facebook Page.
    """
    creds = get_facebook_credentials()
    page_id = creds["page_id"]
    token = creds["access_token"]

    if not page_id or not token:
        return {"success": False, "message": "Facebook credentials missing."}

    video_file = Path(video_path)
    if not video_file.exists():
        return {"success": False, "message": f"Video file not found at {video_path}"}

    endpoint = f"https://graph-video.facebook.com/{GRAPH_API_VERSION}/{page_id}/videos"

    # Use multipart upload for local MP4 file
    try:
        import mimetypes
        boundary = "----WebKitFormBoundaryGlobalPulseFacebook"
        body = []

        # Description field
        body.extend([
            f"--{boundary}".encode("utf-8"),
            b'Content-Disposition: form-data; name="description"',
            b"",
            description.encode("utf-8"),
        ])

        # Title field
        body.extend([
            f"--{boundary}".encode("utf-8"),
            b'Content-Disposition: form-data; name="title"',
            b"",
            title.encode("utf-8"),
        ])

        # Access token field
        body.extend([
            f"--{boundary}".encode("utf-8"),
            b'Content-Disposition: form-data; name="access_token"',
            b"",
            token.encode("utf-8"),
        ])

        # Video source file
        mime_type = mimetypes.guess_type(str(video_file))[0] or "video/mp4"
        body.extend([
            f"--{boundary}".encode("utf-8"),
            f'Content-Disposition: form-data; name="source"; filename="{video_file.name}"'.encode("utf-8"),
            f"Content-Type: {mime_type}".encode("utf-8"),
            b"",
            video_file.read_bytes(),
            f"--{boundary}--".encode("utf-8"),
            b"",
        ])

        content_body = b"\r\n".join(body)

        req = urllib.request.Request(
            endpoint,
            data=content_body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(content_body)),
                "User-Agent": "GlobalPulseAI/1.0"
            }
        )

        with urllib.request.urlopen(req, timeout=120) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            vid_id = res_data.get("id")
            print(f"[Facebook Video Upload] Video published to Facebook Page: {vid_id}")
            return {"success": True, "video_id": vid_id}

    except Exception as e:
        print(f"[Facebook Video Upload Error] {e}")
        return {"success": False, "error": str(e)}

_last_fb_auto_post_timestamp = 0

def maybe_auto_post_next_article(db, min_interval_seconds: int = 1200) -> Optional[Dict[str, Any]]:
    """
    Auto-pilot helper: periodically posts the latest high-rank unposted article
    to the Facebook Page, strictly adhering to pacing (default: 20 mins) to prevent spam flags.
    """
    global _last_fb_auto_post_timestamp
    import time
    from models import Article

    now = time.time()
    if (now - _last_fb_auto_post_timestamp) < min_interval_seconds:
        return None

    auth = check_facebook_auth()
    if not auth.get("authenticated"):
        return None

    article = (
        db.query(Article)
        .filter((Article.facebook_post_id == None) | (Article.facebook_post_id == ""))
        .order_by(Article.views.desc(), Article.id.desc())
        .first()
    )
    if not article:
        return None

    art_url = f"https://globalpulseai.vercel.app/news/{article.slug}"
    res = post_article_to_facebook(
        title=article.title,
        summary=article.summary,
        article_url=art_url,
        category=article.category
    )
    if res.get("success"):
        article.facebook_post_id = res.get("post_id")
        db.commit()
        _last_fb_auto_post_timestamp = now
        print(f"[Facebook Auto-Pilot] Published article #{article.id} to Facebook: {res.get('post_url')}")
        return res
    return None


