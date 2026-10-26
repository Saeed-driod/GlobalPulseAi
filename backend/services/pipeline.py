import os
import re
import traceback
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

try:
    from ..database import get_db, SessionLocal
    from ..models import Article, ArticleStatus
    from .scraper import fetch_breaking_rss_news
    from .ai_service import process_raw_news
    from .video_generator import compose_short_video, compose_video
    from .youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube
    from .youtube_quota import can_post_now, record_youtube_upload
except (ImportError, ValueError):
    from database import get_db, SessionLocal
    from models import Article, ArticleStatus
    from services.scraper import fetch_breaking_rss_news
    from services.ai_service import process_raw_news
    from services.video_generator import compose_short_video, compose_video
    from services.youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube
    from services.youtube_quota import can_post_now, record_youtube_upload


def slugify(text: str) -> str:
    """Generate clean SEO-friendly slug from title."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return re.sub(r'[\s-]+', '-', text).strip('-')


def is_story_duplicate(db: Session, raw_title: str, source_url: Optional[str] = None) -> bool:
    """Checks if a story is a duplicate by URL, exact title, or semantic word overlap."""
    if source_url:
        clean_url = source_url.split("?")[0].rstrip("/")
        if db.query(Article).filter(Article.source_url.ilike(f"{clean_url}%")).first():
            return True

    clean_raw = re.sub(r'[^a-zA-Z0-9\s]', '', raw_title.lower()).split()
    words = set(w for w in clean_raw if len(w) > 3)
    if not words:
        return False

    recent_articles = db.query(Article).order_by(Article.id.desc()).limit(150).all()
    for art in recent_articles:
        if art.title.lower().strip() == raw_title.lower().strip():
            return True
        art_words = set(w for w in re.sub(r'[^a-zA-Z0-9\s]', '', art.title.lower()).split() if len(w) > 3)
        if not art_words:
            continue
        common = words.intersection(art_words)
        overlap = len(common) / max(len(words), len(art_words))
        if overlap >= 0.65:
            return True
    return False


def run_full_automation_pipeline(limit: int = 1, db: Optional[Session] = None, video_format: str = "long") -> Dict[str, Any]:
    """
    Unified Master Automation Pipeline:
    Executes sequentially:
    1. Fetch latest raw news from Tier-1 RSS feeds.
    2. Process and rewrite via Gemini AI (headline, TL;DR, markdown, 60s shorts script).
    3. Generate 16:9 Long-Form HD MP4 video (or 9:16 Shorts) with neural voiceover.
    4. Upload video to YouTube for channel ('GloblePulseAi') via OAuth2 credentials (client_secret.json / token.json).
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

        # Find fresh stories not yet published (Strict deduplication gate)
        candidate_items = []
        for item in raw_items:
            if not is_story_duplicate(db, item.get("raw_title", ""), item.get("source_url")):
                candidate_items.append(item)

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

        for item in candidate_items:
            if len(published_articles) >= limit:
                break

            try:
                print(f"\n[Step 2/5] Synthesizing with Gemini AI: '{item['raw_title'][:60]}...'")
                ai_data = process_raw_news(
                    raw_title=item["raw_title"],
                    raw_summary=item["raw_summary"],
                    source_name=item["source_name"],
                    suggested_category=item.get("suggested_category"),
                    source_url=item.get("source_url", ""),
                    raw_image_url=item.get("raw_image_url")
                )

                # Secondary check: verify synthesized title doesn't already exist
                existing_synth = db.query(Article).filter(Article.title == ai_data["title"]).first()
                if existing_synth:
                    print(f"[Master Pipeline] Synthesized story '{ai_data['title'][:50]}' already in DB. Skipping duplicate.")
                    continue

                # Generate unique SEO slug
                base_slug = slugify(ai_data["title"])
                slug = base_slug
                if db.query(Article).filter(Article.slug == slug).first():
                    print(f"[Master Pipeline] Slug '{slug}' already exists. Skipping duplicate story.")
                    continue

                # Save initial article as IMMEDIATELY PUBLISHED in DB so it goes live on website first!
                article = Article(
                    title=ai_data["title"],
                    slug=slug,
                    category=ai_data["category"],
                    summary=ai_data["summary"],
                    content=ai_data["content"],
                    source_url=item.get("source_url"),
                    source_name=item.get("source_name"),
                    image_url=ai_data.get("image_url"),
                    youtube_script=ai_data.get("youtube_script"),
                    author_name=ai_data.get("author_name", "Muhammad Saeed (Chief Editor, GlobalPulse AI)"),
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

                        # Step 4: Check Daily Limits & Upload to YouTube (GloblePulseAi channel)
                        can_upload, quota_reason = can_post_now(db, video_format=video_format, ignore_cooldown=False)
                        if not can_upload:
                            print(f"[Master Pipeline DAILY QUOTA LIMIT] Skipping YouTube upload: {quota_reason}")
                        else:
                            print(f"\n[Step 4/5] Uploading {fmt_str} video to YouTube Data API v3 (channel: GloblePulseAi)...")
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
                    "published_at": a.published_at.isoformat() if a.published_at else None
                }
                for a in published_articles
            ]
        }

    finally:
        if close_session:
            db.close()
