#!/usr/bin/env python
"""
========================================================================================
GlobalPulse AI - Local PC Video & Media Offloading Worker
========================================================================================
Runs high-performance video generation (FFmpeg 7.1, Pillow, edge-tts/gTTS, YouTube v3)
on your local machine, completely offloading heavy rendering from Render's 512MB RAM tier!

Synchronizes directly with Neon PostgreSQL (or SQLite fallback) so rendered videos,
metadata, and YouTube IDs go live on the production site immediately.

Supported operations:
  --watch, --daemon       : Continuous worker mode; checks DB for pending videos.
  --article <id>          : Render video for a specific article ID.
  --format <long|short>   : Target aspect ratio ('long' for 16:9 HD, 'short' for 9:16 Shorts).
  --upload                : Automatically upload rendered video to YouTube via OAuth2.
  --fetch <category>      : Fetch breaking news now (e.g. "Global Sports") and auto-render.
  --pending               : Batch render all published articles missing videos.
  --list                  : Display recent articles and their video generation status.
========================================================================================
"""

import os
import sys
import time
import argparse
import traceback
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path so modules import reliably
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure environment variables are loaded
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

try:
    from database import SessionLocal, engine, Base
    from models import Article, ArticleStatus, ArticleCategory
    from services.video_generator import compose_video, compose_long_video, compose_short_video
    from services.scraper import fetch_breaking_rss_news
    from services.ai_service import process_raw_news
    from services.youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube, check_auth_status
except ImportError as e:
    print(f"[Worker Error] Failed importing backend services: {e}")
    sys.exit(1)


def print_banner():
    print("""
================================================================================
  GLOBALPULSE AI - HIGH PERFORMANCE LOCAL VIDEO GENERATION WORKER
  Target Categories: Global Sports | AI & Tech | Global Markets | Geopolitics | Science
================================================================================
    """)


def render_article_video(article_id: int, video_format: str = "long", do_upload: bool = False) -> bool:
    """
    Renders a photo-rich broadcast video for an article using local FFmpeg and PIL.
    Directly updates the article record in the database.
    """
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            print(f"[Worker ERROR] Article #{article_id} not found in database.")
            return False

        fmt_label = "16:9 Long-Form HD (1280x720)" if video_format == "long" else "9:16 Shorts (1080x1920)"
        print(f"\n[Worker] Starting video render for Article #{article.id}:")
        print(f"  Title   : {article.title}")
        print(f"  Category: {article.category}")
        print(f"  Format  : {fmt_label}")

        start_time = time.time()
        result = compose_video(
            article_id=article.id,
            title=article.title,
            category=article.category,
            youtube_script=article.youtube_script or article.summary,
            summary=article.summary,
            content=article.content,
            image_url=article.image_url,
            video_format=video_format
        )

        elapsed = time.time() - start_time
        video_path = result.get("video_path")
        article.video_path = video_path
        db.commit()
        db.refresh(article)

        print(f"[Worker SUCCESS] Rendered {result.get('runtime_seconds')}s video in {elapsed:.1f}s.")
        print(f"  Saved to: {video_path} ({result.get('file_size_bytes', 0):,} bytes)")

        if do_upload:
            print(f"[Worker] Initiating YouTube upload for article #{article.id}...")
            video_disk_path = video_path or ""
            if video_disk_path.startswith("/static/"):
                video_disk_path = str(BACKEND_DIR / video_disk_path.lstrip("/"))

            if os.path.exists(video_disk_path):
                upload_res = upload_short_to_youtube(
                    video_filepath=video_disk_path,
                    title=article.title,
                    summary=article.summary,
                    category=article.category,
                    slug=article.slug,
                    video_format=video_format
                )
                yt_id = upload_res.get("video_id") or upload_res.get("youtube_video_id")
                if yt_id:
                    article.youtube_video_id = yt_id
                    db.commit()
                    print(f"[Worker SUCCESS] Uploaded to YouTube: https://youtu.be/{yt_id}")
            else:
                print(f"[Worker Warning] Could not find video on disk for upload: {video_disk_path}")

        return True

    except Exception as e:
        print(f"[Worker ERROR] Failed to render video for #{article_id}: {e}")
        traceback.print_exc()
        return False
    finally:
        db.close()


def fetch_and_publish_news(target_category: str = "Global Sports", video_format: str = "long", do_upload: bool = False):
    """
    Fetches the latest breaking RSS news for the target category,
    synthesizes it with Gemini AI, saves it as PUBLISHED, and renders video locally.
    """
    db = SessionLocal()
    try:
        print(f"\n[Worker] Fetching breaking RSS news for '{target_category}'...")
        articles_data = fetch_breaking_rss_news(limit=2, target_category=target_category)
        if not articles_data:
            print(f"[Worker] No new stories found for '{target_category}'.")
            return

        print(f"[Worker] Found {len(articles_data)} stories. Processing with Gemini AI...")
        for item in articles_data:
            ai_data = process_raw_news(
                raw_title=item.get("title", ""),
                raw_summary=item.get("summary", ""),
                source_name=item.get("source", "Global Wire"),
                suggested_category=item.get("suggested_category", target_category),
                source_url=item.get("source_url", ""),
                raw_image_url=item.get("image_url")
            )

            # Generate unique slug
            import re
            base_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', ai_data["title"]).strip().lower()
            base_slug = re.sub(r'[\s]+', '-', base_slug)[:80]
            existing = db.query(Article).filter(Article.slug == base_slug).first()
            if existing:
                base_slug = f"{base_slug}-{int(time.time()) % 10000}"

            new_article = Article(
                title=ai_data["title"],
                slug=base_slug,
                category=ai_data.get("category", target_category),
                summary=ai_data["summary"],
                content=ai_data["content"],
                youtube_script=ai_data.get("youtube_script", ai_data["summary"]),
                status=ArticleStatus.PUBLISHED.value,
                image_url=ai_data.get("image_url", item.get("image_url")),
                published_at=datetime.now(timezone.utc)
            )
            db.add(new_article)
            db.commit()
            db.refresh(new_article)

            print(f"\n[Worker] Published story #{new_article.id}: '{new_article.title}'")
            # Render video immediately on local machine
            render_article_video(new_article.id, video_format=video_format, do_upload=do_upload)
            break  # Process top 1 story per fetch run

    except Exception as e:
        print(f"[Worker ERROR] Error in fetch_and_publish: {e}")
        traceback.print_exc()
    finally:
        db.close()


def process_pending_articles(category: str = None, video_format: str = "long", limit: int = 10, do_upload: bool = False):
    """
    Scans the database for published articles that don't have a valid video file.
    Renders videos for each pending article.
    """
    db = SessionLocal()
    try:
        query = db.query(Article)
        if category:
            query = query.filter(Article.category.ilike(f"%{category}%"))

        query = query.filter((Article.video_path == None) | (Article.video_path == ""))
        pending = query.order_by(Article.id.desc()).limit(limit).all()

        if not pending:
            print("[Worker] No pending articles found needing video generation.")
            return

        print(f"\n[Worker] Found {len(pending)} pending articles lacking videos:")
        for a in pending:
            print(f"  - #{a.id} [{a.category}] {a.title[:60]}")

        for a in pending:
            render_article_video(a.id, video_format=video_format, do_upload=do_upload)

    except Exception as e:
        print(f"[Worker ERROR] Error processing pending articles: {e}")
        traceback.print_exc()
    finally:
        db.close()


def list_recent_articles(limit: int = 15):
    """
    Prints a formatted table of the most recent articles and their video / upload status.
    """
    db = SessionLocal()
    try:
        articles = db.query(Article).order_by(Article.id.desc()).limit(limit).all()
        print(f"\n{'ID':<5} | {'Category':<16} | {'Video':<6} | {'YouTube':<12} | {'Title'}")
        print("-" * 80)
        for a in articles:
            has_vid = "YES" if a.video_path else "NO"
            has_yt = a.youtube_video_id[:10] if (a.youtube_video_id and a.youtube_video_id != "dQw4w9WgXcQ") else "NO"
            print(f"{a.id:<5} | {a.category:<16} | {has_vid:<6} | {has_yt:<12} | {a.title[:45]}")
    finally:
        db.close()


def run_daemon_worker(interval_seconds: int = 60, video_format: str = "long", do_upload: bool = False):
    """
    Continuously monitors the database and processes newly added stories.
    """
    print(f"[Worker Daemon] Started! Checking database every {interval_seconds}s for pending videos...")
    print("Press Ctrl+C to terminate.")
    try:
        while True:
            process_pending_articles(video_format=video_format, limit=3, do_upload=do_upload)
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        print("\n[Worker Daemon] Stopped cleanly by user.")


def interactive_menu():
    """CLI interactive menu for ease of use without memorizing flags."""
    print_banner()
    while True:
        print("\nChoose an action:")
        print("  [1] Fetch Breaking 'Global Sports' News & Render Video")
        print("  [2] Render Video for a Specific Article ID")
        print("  [3] Process All Pending Articles (Missing Videos)")
        print("  [4] Start Background Daemon / Watchdog Mode")
        print("  [5] List Recent Articles & Media Status")
        print("  [6] Exit")

        choice = input("\nEnter choice [1-6]: ").strip()
        if choice == "1":
            fmt = input("Select format: 'long' (16:9 HD) or 'short' (9:16 Shorts) [default: long]: ").strip().lower() or "long"
            upload_choice = input("Auto-upload to YouTube if authenticated? (y/n) [default: n]: ").strip().lower() == "y"
            fetch_and_publish_news(target_category="Global Sports", video_format=fmt, do_upload=upload_choice)
        elif choice == "2":
            art_id_str = input("Enter Article ID: ").strip()
            if art_id_str.isdigit():
                fmt = input("Select format: 'long' or 'short' [default: long]: ").strip().lower() or "long"
                upload_choice = input("Auto-upload to YouTube? (y/n) [default: n]: ").strip().lower() == "y"
                render_article_video(int(art_id_str), video_format=fmt, do_upload=upload_choice)
            else:
                print("Invalid article ID.")
        elif choice == "3":
            fmt = input("Select format: 'long' or 'short' [default: long]: ").strip().lower() or "long"
            cat = input("Filter category (e.g. 'Global Sports', or leave empty for all): ").strip() or None
            process_pending_articles(category=cat, video_format=fmt)
        elif choice == "4":
            fmt = input("Select default format: 'long' or 'short' [default: long]: ").strip().lower() or "long"
            interval = input("Polling interval in seconds [default: 60]: ").strip()
            interval_sec = int(interval) if interval.isdigit() else 60
            run_daemon_worker(interval_seconds=interval_sec, video_format=fmt)
        elif choice == "5":
            list_recent_articles()
        elif choice == "6":
            print("Exiting worker. Goodbye!")
            break
        else:
            print("Invalid choice, please select 1-6.")


def main():
    parser = argparse.ArgumentParser(description="GlobalPulse AI Local Video Offloading Worker")
    parser.add_argument("--article", type=int, help="Render video for a specific article ID")
    parser.add_argument("--format", choices=["long", "short"], default="long", help="Video format (long = 16:9 HD, short = 9:16 Shorts)")
    parser.add_argument("--upload", action="store_true", help="Auto-upload to YouTube upon completion")
    parser.add_argument("--fetch", type=str, nargs="?", const="Global Sports", help="Fetch breaking news now for category (default: 'Global Sports')")
    parser.add_argument("--pending", action="store_true", help="Process all pending articles missing videos")
    parser.add_argument("--category", type=str, help="Filter category when processing pending articles")
    parser.add_argument("--list", action="store_true", help="List recent articles and their video generation status")
    parser.add_argument("--watch", "--daemon", action="store_true", dest="daemon", help="Run continuous worker loop")
    parser.add_argument("--interval", type=int, default=60, help="Daemon polling interval in seconds (default: 60)")

    args = parser.parse_args()

    # If no flags passed, launch interactive menu
    if len(sys.argv) == 1:
        interactive_menu()
        return

    print_banner()

    if args.list:
        list_recent_articles()
    elif args.fetch:
        fetch_and_publish_news(target_category=args.fetch, video_format=args.format, do_upload=args.upload)
    elif args.article:
        render_article_video(article_id=args.article, video_format=args.format, do_upload=args.upload)
    elif args.pending:
        process_pending_articles(category=args.category, video_format=args.format, do_upload=args.upload)
    elif args.daemon:
        run_daemon_worker(interval_seconds=args.interval, video_format=args.format, do_upload=args.upload)


if __name__ == "__main__":
    main()
