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

# Ensure console output handles unicode cleanly on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure environment variables are loaded
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

try:
    from database import SessionLocal, engine, Base
    from models import Article, ArticleStatus, ArticleCategory, WorkerHeartbeat
    from services.video_generator import compose_video, compose_long_video, compose_short_video
    from services.scraper import fetch_breaking_rss_news
    from services.ai_service import process_raw_news
    from services.youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube, check_auth_status
except ImportError as e:
    print(f"[Worker Error] Failed importing backend services: {e}")
    sys.exit(1)


def send_worker_heartbeat(status: str = "IDLE", active_id: int = None, active_title: str = None, increment_completed: bool = False):
    """Updates the WorkerHeartbeat record in the shared database so the web UI knows worker is online."""
    db = SessionLocal()
    try:
        hb = db.query(WorkerHeartbeat).filter(WorkerHeartbeat.worker_name == "LOCAL_PC_WORKER").first()
        if not hb:
            hb = WorkerHeartbeat(
                worker_name="LOCAL_PC_WORKER",
                status=status,
                last_seen=datetime.now(timezone.utc),
                active_article_id=active_id,
                active_article_title=active_title[:290] if active_title else None,
                channel_name="@GloblePulseAi",
                total_completed=1 if increment_completed else 0
            )
            db.add(hb)
        else:
            hb.status = status
            hb.last_seen = datetime.now(timezone.utc)
            hb.active_article_id = active_id
            hb.active_article_title = active_title[:290] if active_title else None
            if increment_completed:
                hb.total_completed = (hb.total_completed or 0) + 1
        db.commit()
    except Exception as e:
        print(f"[Worker Heartbeat Warning] {e}")
    finally:
        db.close()


def update_article_progress(db, article: Article, percent: int, status: str, stage_text: str, eta: str = None, error: str = None):
    """Persists real-time video generation and upload progress to the database."""
    try:
        article.video_progress = max(0, min(100, percent))
        article.video_status = status
        article.video_stage_text = stage_text
        if eta is not None:
            article.video_eta = eta
        if error is not None:
            article.video_error = error
        article.video_updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(article)
    except Exception as e:
        print(f"[Worker Progress DB Error] {e}")
        try:
            db.rollback()
        except Exception:
            pass


def export_to_tiktok_package(article: Article, source_video_path: str):
    """
    Exports a clean copy of the vertical Shorts video along with a viral TikTok caption file
    to exports/tiktok/ so it can be uploaded directly to TikTok Studio or via mobile.
    """
    try:
        import shutil
        tiktok_dir = ROOT_DIR / "exports" / "tiktok"
        tiktok_dir.mkdir(parents=True, exist_ok=True)
        
        slug = article.slug or f"article_{article.id}"
        clean_name = f"TikTok_{article.id}_{slug[:25]}"
        dest_video = tiktok_dir / f"{clean_name}.mp4"
        dest_caption = tiktok_dir / f"{clean_name}_caption.txt"
        
        if os.path.exists(source_video_path):
            shutil.copy2(source_video_path, dest_video)
            
        title = article.title or "Breaking AI & Tech News"
        summary = (article.summary or "")[:140]
        hashtags = "#AI #ArtificialIntelligence #TechNews #Technology #FutureTech #GlobalPulseAI #fyp #foryou #viral #trending"
        
        caption_content = (
            f"⚡ {title}\n\n"
            f"{summary}...\n\n"
            f"👇 Follow @globalpulseai for daily global AI & Tech breakthroughs!\n"
            f"🌐 Full story & analysis: https://globalpulseai.vercel.app/article/{article.slug}\n\n"
            f"{hashtags}\n"
        )
        
        with open(dest_caption, "w", encoding="utf-8") as f:
            f.write(caption_content)
            
        print(f"[TikTok Export] Saved ready-to-post package: {dest_video.name}")
    except Exception as e:
        print(f"[TikTok Export Notice] {e}")


def print_banner():
    print("""
================================================================================
  GLOBALPULSE AI - HIGH PERFORMANCE LOCAL VIDEO GENERATION WORKER
  Target Categories: Global Sports | AI & Tech | Global Markets | Geopolitics | Science
================================================================================
    """)


def render_article_video(article_id: int, video_format: str = "short", do_upload: bool = True) -> bool:
    """
    Renders a photo-rich broadcast video for an article using local FFmpeg and PIL.
    Directly updates the article record in the database with live progress percentage.
    If the video already exists on disk, skips re-rendering and proceeds to upload.
    """
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            print(f"[Worker ERROR] Article #{article_id} not found in database.")
            return False

        fmt_label = "16:9 Long-Form HD (1280x720)" if video_format == "long" else "9:16 Shorts (1080x1920)"
        print(f"\n============================================================")
        print(f"[Worker] Processing Article #{article.id} on LOCAL PC:")
        print(f"  Title   : {article.title}")
        print(f"  Category: {article.category}")
        print(f"  Format  : {fmt_label}")

        # Update heartbeat and article initial progress
        send_worker_heartbeat(status="PROCESSING", active_id=article.id, active_title=article.title)
        update_article_progress(db, article, 10, "VOICEOVER", "Step 1/4: Synthesizing broadcast neural voiceover (Edge-TTS)...", eta="~50s remaining")

        def on_video_progress(pct: int, stage_code: str, stage_text: str, eta: str = ""):
            update_article_progress(db, article, pct, stage_code, stage_text, eta=eta)
            print(f"  [Progress {pct}%] {stage_text} ({eta})")

        # Check if valid video file already exists on disk
        video_disk_path = article.video_path or ""
        if video_disk_path.startswith("/static/"):
            video_disk_path = str(BACKEND_DIR / video_disk_path.lstrip("/"))

        video_exists = bool(video_disk_path and os.path.exists(video_disk_path) and os.path.getsize(video_disk_path) >= 100_000)

        if not video_exists:
            print(f"[Worker] Generating fresh video on Local PC (Render cloud RAM: 0 MB used)...")
            start_time = time.time()
            result = compose_video(
                article_id=article.id,
                title=article.title,
                category=article.category,
                youtube_script=article.youtube_script or article.summary,
                summary=article.summary,
                content=article.content,
                image_url=article.image_url,
                video_format=video_format,
                progress_callback=on_video_progress
            )
            elapsed = time.time() - start_time
            video_path = result.get("video_path")
            article.video_path = video_path
            update_article_progress(db, article, 80, "RENDERING_FFMPEG", f"Step 3/4: Rendered {result.get('runtime_seconds')}s video in {elapsed:.1f}s. Preparing upload...", eta="~10s remaining")
            print(f"[Worker SUCCESS] Rendered {result.get('runtime_seconds')}s video in {elapsed:.1f}s!")
            print(f"  Local file: {video_path} ({result.get('file_size_bytes', 0):,} bytes)")
        else:
            print(f"[Worker INFO] Video already exists on disk: {video_disk_path}")
            video_path = article.video_path
            update_article_progress(db, article, 80, "RENDERING_FFMPEG", "Existing video verified on disk. Ready for YouTube upload.", eta="~10s remaining")

        # Step 2: Auto-Export package for TikTok
        export_disk_path = video_path or ""
        if export_disk_path.startswith("/static/"):
            export_disk_path = str(BACKEND_DIR / export_disk_path.lstrip("/"))
        export_to_tiktok_package(article, export_disk_path)

        # Step 3: YouTube Auto-Upload
        if do_upload:
            if article.youtube_video_id and article.youtube_video_id != "dQw4w9WgXcQ":
                print(f"[Worker INFO] Article #{article.id} already uploaded to YouTube: https://youtu.be/{article.youtube_video_id}")
                update_article_progress(db, article, 100, "COMPLETED", "Video already published to YouTube.", eta="Done")
                send_worker_heartbeat(status="IDLE", active_id=None, active_title=None, increment_completed=True)
            else:
                # Deduplication Gate: Check if this same story/title was already uploaded on another article record
                existing_yt = db.query(Article).filter(
                    Article.title == article.title,
                    Article.youtube_video_id != None,
                    Article.youtube_video_id != "",
                    Article.youtube_video_id != "dQw4w9WgXcQ",
                    Article.id != article.id
                ).first()

                if not existing_yt:
                    import re
                    clean_target = set(w for w in re.sub(r'[^a-zA-Z0-9\s]', '', article.title.lower()).split() if len(w) > 3)
                    if len(clean_target) >= 3:
                        recent_yt_articles = db.query(Article).filter(
                            Article.youtube_video_id != None,
                            Article.youtube_video_id != "",
                            Article.youtube_video_id != "dQw4w9WgXcQ",
                            Article.id != article.id
                        ).order_by(Article.id.desc()).limit(100).all()
                        for prev_a in recent_yt_articles:
                            prev_words = set(w for w in re.sub(r'[^a-zA-Z0-9\s]', '', prev_a.title.lower()).split() if len(w) > 3)
                            if prev_words and (len(clean_target.intersection(prev_words)) / max(len(clean_target), len(prev_words))) >= 0.70:
                                existing_yt = prev_a
                                break

                if existing_yt:
                    print(f"[Worker DEDUPLICATION GATE] Story already uploaded to YouTube on Article #{existing_yt.id}: https://youtu.be/{existing_yt.youtube_video_id}")
                    article.youtube_video_id = existing_yt.youtube_video_id
                    update_article_progress(db, article, 100, "COMPLETED", f"Linked to existing YouTube upload ({existing_yt.youtube_video_id})", eta="Done")
                    send_worker_heartbeat(status="IDLE", active_id=None, active_title=None, increment_completed=True)
                    print(f"============================================================\n")
                    return True

                print(f"[Worker] Uploading video to YouTube channel @GloblePulseAi...")
                update_article_progress(db, article, 90, "UPLOADING_YOUTUBE", "Step 4/4: Uploading video directly to YouTube Shorts (@GloblePulseAi)...", eta="~5s remaining")

                upload_disk_path = video_path or ""
                if upload_disk_path.startswith("/static/"):
                    upload_disk_path = str(BACKEND_DIR / upload_disk_path.lstrip("/"))

                if os.path.exists(upload_disk_path):
                    upload_start = time.time()
                    try:
                        upload_res = upload_short_to_youtube(
                            video_filepath=upload_disk_path,
                            title=article.title,
                            summary=article.summary,
                            category=article.category,
                            slug=article.slug,
                            video_format=video_format
                        )
                        upload_elapsed = time.time() - upload_start
                        yt_id = upload_res.get("video_id") or upload_res.get("youtube_video_id")
                        if yt_id and yt_id != "dQw4w9WgXcQ":
                            article.youtube_video_id = yt_id
                            update_article_progress(db, article, 100, "COMPLETED", "Completed! Video successfully published to YouTube Shorts.", eta="Done")
                            send_worker_heartbeat(status="IDLE", active_id=None, active_title=None, increment_completed=True)
                            print(f"[Worker SUCCESS] Uploaded to YouTube in {upload_elapsed:.1f}s!")
                            print(f"  YouTube Link: https://youtu.be/{yt_id}")
                        else:
                            print(f"[Worker Warning] YouTube upload notice: {upload_res}")
                            update_article_progress(db, article, 85, "FAILED", f"YouTube upload notice: {str(upload_res)[:100]}", error=str(upload_res))
                            send_worker_heartbeat(status="IDLE", active_id=None, active_title=None)
                    except Exception as yt_err:
                        err_str = str(yt_err)
                        if "Quota exceeded" in err_str or "rateLimitExceeded" in err_str or "429" in err_str:
                            print(f"\n[Worker YOUTUBE NOTICE] Daily YouTube video upload quota reached. Video saved locally.")
                            update_article_progress(db, article, 80, "PAUSED", "Daily YouTube upload limit reached. Saved locally for next cycle.", error="YouTube daily quota reached")
                            send_worker_heartbeat(status="IDLE", active_id=None, active_title=None)
                            return False
                        else:
                            raise yt_err
                else:
                    print(f"[Worker Warning] Could not find video file on disk: {upload_disk_path}")
                    update_article_progress(db, article, 80, "FAILED", f"Video file missing on disk: {upload_disk_path}", error="File missing")
                    send_worker_heartbeat(status="IDLE", active_id=None, active_title=None)
        else:
            update_article_progress(db, article, 100, "COMPLETED", "Video generated locally (upload skipped).", eta="Done")
            send_worker_heartbeat(status="IDLE", active_id=None, active_title=None, increment_completed=True)

        print(f"============================================================\n")
        return True

    except Exception as e:
        print(f"[Worker ERROR] Failed processing video for #{article_id}: {e}")
        traceback.print_exc()
        try:
            update_article_progress(db, article, article.video_progress or 10, "FAILED", f"Rendering error: {str(e)[:120]}", error=str(e))
        except Exception:
            pass
        send_worker_heartbeat(status="IDLE", active_id=None, active_title=None)
        return False
    finally:
        db.close()



def fetch_and_publish_news(target_category: str = "Global Sports", video_format: str = "short", do_upload: bool = True):
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
            existing = db.query(Article).filter(
                (Article.slug == base_slug) | (Article.title == ai_data["title"])
            ).first()
            if existing:
                print(f"[Worker] Story '{ai_data['title'][:45]}' already indexed (#{existing.id}). Skipping duplicate.")
                continue

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


def process_pending_articles(category: str = None, video_format: str = "short", limit: int = 10, do_upload: bool = True):
    """
    Scans the database for articles queued by the user in Admin dashboard,
    or published articles that don't have a valid video file OR have not been uploaded to YouTube yet.
    """
    db = SessionLocal()
    try:
        query = db.query(Article)
        if category:
            query = query.filter(Article.category.ilike(f"%{category}%"))

        # Priority 1: Articles explicitly queued from Mission Control Web Admin
        queued_articles = (
            query
            .filter(Article.video_status == "QUEUED")
            .order_by(Article.video_updated_at.desc(), Article.id.desc())
            .limit(limit)
            .all()
        )
        target_ids = []
        if queued_articles:
            print(f"\n⚡ [Worker Priority Queue] Processing {len(queued_articles)} article(s) queued from Mission Control:")
            for a in queued_articles:
                print(f"  ▶ Article #{a.id} [{a.category}] {a.title[:50]}")
            target_ids = [a.id for a in queued_articles]
        else:
            # Priority 2: Scan for published articles needing video generation OR YouTube upload
            pending = (
                query
                .filter(
                    (Article.video_path == None) | 
                    (Article.video_path == "") | 
                    (Article.youtube_video_id == None) | 
                    (Article.youtube_video_id == "") |
                    (Article.youtube_video_id == "dQw4w9WgXcQ")
                )
                .order_by(Article.id.desc())
                .limit(limit)
                .all()
            )

            if pending:
                print(f"\n[Worker] Found {len(pending)} articles needing video processing / YouTube upload:")
                for a in pending:
                    vid_status = "READY" if a.video_path else "MISSING"
                    yt_status = f"https://youtu.be/{a.youtube_video_id}" if (a.youtube_video_id and a.youtube_video_id != "dQw4w9WgXcQ") else "PENDING UPLOAD"
                    print(f"  - Article #{a.id} [{a.category}] Video: {vid_status} | YT: {yt_status} | {a.title[:45]}")
                target_ids = [a.id for a in pending]

    except Exception as e:
        print(f"[Worker ERROR] Error scanning pending articles: {e}")
        traceback.print_exc()
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        try:
            db.close()
        except Exception:
            pass

    # Process rendering outside of the scanning database session to prevent idle timeouts
    for article_id in target_ids:
        try:
            render_article_video(article_id, video_format=video_format, do_upload=do_upload)
        except Exception as proc_err:
            print(f"[Worker ERROR] Failed processing #{article_id}: {proc_err}")


def list_recent_articles(limit: int = 15):
    """
    Prints a formatted table of the most recent articles and their video / upload status.
    """
    db = SessionLocal()
    try:
        articles = db.query(Article).order_by(Article.id.desc()).limit(limit).all()
        print(f"\n{'ID':<5} | {'Category':<16} | {'Video':<8} | {'YouTube Status / Link':<24} | {'Title'}")
        print("-" * 88)
        for a in articles:
            has_vid = "YES" if a.video_path else "NO"
            if a.youtube_video_id and a.youtube_video_id != "dQw4w9WgXcQ":
                has_yt = f"https://youtu.be/{a.youtube_video_id}"
            else:
                has_yt = "NOT UPLOADED"
            print(f"{a.id:<5} | {a.category:<16} | {has_vid:<8} | {has_yt:<24} | {a.title[:32]}")
        print("-" * 88)
    finally:
        db.close()


def run_daemon_worker(interval_seconds: int = 30, video_format: str = "short", do_upload: bool = True):
    """
    Continuously monitors the shared database and auto-renders & uploads videos
    using your local PC hardware. Zero memory usage on Render!
    """
    auth = check_auth_status()
    channel = auth.get("channel", "GloblePulseAi")
    print(f"\n🚀 [LOCAL WORKER DAEMON ACTIVE]")
    print(f"   Target YouTube Channel : @{channel}")
    print(f"   Target Video Format    : {'9:16 YouTube Shorts' if video_format == 'short' else '16:9 Long-Form HD'}")
    print(f"   YouTube Auto-Upload    : {'ENABLED' if do_upload else 'DISABLED'}")
    print(f"   Database Poll Interval : Every {interval_seconds} seconds")
    print(f"   Cloud RAM Impact       : 0 MB (100% offloaded to your Local PC!)")
    print(f"   Status                 : Watching for new articles... (Press Ctrl+C to stop)\n")
    try:
        while True:
            try:
                send_worker_heartbeat(status="IDLE")
                process_pending_articles(video_format=video_format, limit=2, do_upload=do_upload)
            except Exception as loop_err:
                print(f"[Worker Daemon Loop Warning] Transient error recovered: {loop_err}")
                time.sleep(3)
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        send_worker_heartbeat(status="OFFLINE")
        print("\n[Worker Daemon] Stopped cleanly by user.")



def interactive_menu():
    """CLI interactive menu for ease of use without memorizing flags."""
    print_banner()
    auth = check_auth_status()
    is_auth = bool(auth and auth.get("authenticated"))
    default_upload = "y" if is_auth else "n"

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
            fmt = input("Select format: 'long' (16:9 HD) or 'short' (9:16 Shorts) [default: short]: ").strip().lower() or "short"
            u_in = input(f"Auto-upload to YouTube ({auth.get('channel', 'GloblePulseAi')})? (y/n) [default: {default_upload}]: ").strip().lower()
            upload_choice = (u_in != "n") if is_auth else (u_in == "y")
            fetch_and_publish_news(target_category="Global Sports", video_format=fmt, do_upload=upload_choice)
        elif choice == "2":
            art_id_str = input("Enter Article ID: ").strip()
            if art_id_str.isdigit():
                fmt = input("Select format: 'long' or 'short' [default: short]: ").strip().lower() or "short"
                u_in = input(f"Auto-upload to YouTube? (y/n) [default: {default_upload}]: ").strip().lower()
                upload_choice = (u_in != "n") if is_auth else (u_in == "y")
                render_article_video(int(art_id_str), video_format=fmt, do_upload=upload_choice)
            else:
                print("Invalid article ID.")
        elif choice == "3":
            fmt = input("Select format: 'long' or 'short' [default: short]: ").strip().lower() or "short"
            cat = input("Filter category (e.g. 'Global Sports', or leave empty for all): ").strip() or None
            u_in = input(f"Auto-upload to YouTube? (y/n) [default: {default_upload}]: ").strip().lower()
            upload_choice = (u_in != "n") if is_auth else (u_in == "y")
            process_pending_articles(category=cat, video_format=fmt, do_upload=upload_choice)
        elif choice == "4":
            fmt = input("Select default format: 'long' or 'short' [default: short]: ").strip().lower() or "short"
            interval = input("Polling interval in seconds [default: 60]: ").strip()
            interval_sec = int(interval) if interval.isdigit() else 60
            run_daemon_worker(interval_seconds=interval_sec, video_format=fmt, do_upload=is_auth)
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
    parser.add_argument("--format", choices=["long", "short"], default="short", help="Video format (default: short)")
    parser.add_argument("--upload", action="store_true", help="Force auto-upload to YouTube upon completion")
    parser.add_argument("--no-upload", action="store_true", help="Disable YouTube upload even if authenticated")
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

    auth = check_auth_status()
    is_auth = bool(auth and auth.get("authenticated"))
    should_upload = False if args.no_upload else (True if (args.upload or is_auth) else False)

    if should_upload:
        print(f"[Worker] YouTube Auto-Upload is ACTIVE for channel '{auth.get('channel', 'GloblePulseAi')}'.")
    else:
        print("[Worker] YouTube Auto-Upload is DISABLED for this run.")

    if args.list:
        list_recent_articles()
    elif args.fetch:
        fetch_and_publish_news(target_category=args.fetch, video_format=args.format, do_upload=should_upload)
    elif args.article:
        render_article_video(article_id=args.article, video_format=args.format, do_upload=should_upload)
    elif args.pending:
        process_pending_articles(category=args.category, video_format=args.format, do_upload=should_upload)
    elif args.daemon:
        run_daemon_worker(interval_seconds=args.interval, video_format=args.format, do_upload=should_upload)


if __name__ == "__main__":
    main()
