"""
GlobalPulse AI - Video Retention & Disk Cleanup Service
Automatically purges old generated videos and temporary render artifacts
from the local filesystem to prevent disk exhaustion on the host (e.g. Oracle VM).
"""

import os
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("video_cleanup")

# Default retention window in days if not set in environment
DEFAULT_RETENTION_DAYS = 3

# File extensions allowed for cleanup (regular files only)
ALLOWED_EXTENSIONS = {
    ".mp4", ".mp3", ".wav", ".m4a",
    ".srt", ".vtt", ".ass", ".txt",
    ".jpg", ".png", ".webp"
}

# Protected files that must never be deleted
PROTECTED_FILENAMES = {".gitkeep", ".gitignore"}

# Article statuses indicating the video is still processing or awaiting YouTube upload
WAITING_VIDEO_STATUSES = {
    "QUEUED",
    "VOICEOVER",
    "COMPOSING_FRAMES",
    "RENDERING_FFMPEG",
    "UPLOADING_YOUTUBE",
    "PAUSED",
    "PROCESSING",
    "PENDING",
}

# Resolve imports with fallbacks for package and standalone executions
try:
    from .video_generator import STATIC_VIDEOS_DIR
except (ImportError, ValueError):
    try:
        from services.video_generator import STATIC_VIDEOS_DIR
    except (ImportError, ValueError):
        try:
            from backend.services.video_generator import STATIC_VIDEOS_DIR
        except (ImportError, ValueError):
            STATIC_VIDEOS_DIR = None

try:
    from ..database import SessionLocal
    from ..models import Article
except (ImportError, ValueError):
    try:
        from database import SessionLocal
        from models import Article
    except (ImportError, ValueError):
        try:
            from backend.database import SessionLocal
            from backend.models import Article
        except (ImportError, ValueError):
            SessionLocal = None
            Article = None


def get_retention_days() -> int:
    """
    Reads VIDEO_RETENTION_DAYS from the environment.
    Falls back to 3 on invalid, zero, or negative numbers.
    """
    raw_val = os.getenv("VIDEO_RETENTION_DAYS", str(DEFAULT_RETENTION_DAYS))
    try:
        val = int(raw_val)
        if val <= 0:
            return DEFAULT_RETENTION_DAYS
        return val
    except (ValueError, TypeError):
        return DEFAULT_RETENTION_DAYS


def get_target_directories() -> List[Path]:
    """
    Returns the two allowed target directories for generated video files:
    1. <repo>/videos (final MP4s, served at /videos-files and downloaded via batch script)
    2. backend/static/videos (working/temporary files written by video_generator.py)
    """
    targets: List[Path] = []
    services_dir = Path(__file__).resolve().parent
    backend_dir = services_dir.parent
    repo_root = backend_dir.parent

    # 1. <repo>/videos (with fallback to backend/videos if in a container where backend is root)
    repo_videos = (repo_root / "videos").resolve()
    if not repo_videos.exists():
        repo_videos = (backend_dir / "videos").resolve()
    if repo_videos.exists() and repo_videos.is_dir():
        targets.append(repo_videos)

    # 2. backend/static/videos
    if STATIC_VIDEOS_DIR and Path(STATIC_VIDEOS_DIR).exists() and Path(STATIC_VIDEOS_DIR).is_dir():
        static_videos = Path(STATIC_VIDEOS_DIR).resolve()
    else:
        static_videos = (backend_dir / "static" / "videos").resolve()

    if static_videos.exists() and static_videos.is_dir() and static_videos not in targets:
        targets.append(static_videos)

    return targets


def _check_article_references(db, filename: str) -> Tuple[bool, List[Any]]:
    """
    Queries the database to check if any Article references the file in video_path.
    Returns:
        (should_keep: bool, matching_articles: List[Article])
    If an article references this file, lacks youtube_video_id, and has a video_status
    indicating it is still in-progress or queued/paused for upload, should_keep is True.
    """
    if db is None or Article is None:
        return False, []

    try:
        candidates = db.query(Article).filter(Article.video_path.like(f"%{filename}%")).all()
        strictly_matching = [
            a for a in candidates
            if a.video_path and Path(a.video_path).name == filename
        ]
        if not strictly_matching:
            return False, []

        for art in strictly_matching:
            has_no_yt = (
                not art.youtube_video_id
                or not str(art.youtube_video_id).strip()
                or art.youtube_video_id == "dQw4w9WgXcQ"
            )
            status_str = (art.video_status or "").strip().upper()
            is_waiting = status_str in WAITING_VIDEO_STATUSES

            if has_no_yt and is_waiting:
                print(
                    f"[VideoCleanup] Kept '{filename}' - referenced by Article #{art.id} "
                    f"with video_status '{art.video_status}' (waiting to be uploaded or processed)"
                )
                return True, strictly_matching

        return False, strictly_matching
    except Exception as e:
        print(f"[VideoCleanup] Database check error for '{filename}': {e}")
        # If DB query fails, play safe and do not delete if it's a video file
        return (filename.lower().endswith((".mp4", ".m4a")), [])


def cleanup_old_videos(retention_days: Optional[int] = None) -> Dict[str, Any]:
    """
    Scans the designated video directories and deletes generated files older
    than the retention window. Preserves files referenced by in-flight/queued articles.
    """
    if retention_days is None or retention_days <= 0:
        retention_days = get_retention_days()

    cutoff_seconds = retention_days * 86400
    now_ts = time.time()
    cutoff_time = now_ts - cutoff_seconds

    files_deleted = 0
    bytes_freed = 0
    files_kept = 0
    errors = 0

    db = None
    if SessionLocal:
        try:
            db = SessionLocal()
        except Exception as db_init_err:
            print(f"[VideoCleanup] Database connection warning: {db_init_err}")
            errors += 1

    try:
        target_directories = get_target_directories()

        for target_dir in target_directories:
            try:
                resolved_dir = target_dir.resolve()
            except Exception as dir_err:
                errors += 1
                print(f"[VideoCleanup] Error resolving directory '{target_dir}': {dir_err}")
                continue

            try:
                entries = list(resolved_dir.iterdir())
            except Exception as list_err:
                errors += 1
                print(f"[VideoCleanup] Error listing directory '{resolved_dir}': {list_err}")
                continue

            for entry in entries:
                try:
                    # Skip symlinks and non-regular files (never delete directories)
                    if entry.is_symlink() or not entry.is_file():
                        continue

                    resolved_file = entry.resolve()

                    # Sandboxing check: ensure the resolved path stays inside the target directory
                    try:
                        resolved_file.relative_to(resolved_dir)
                    except ValueError:
                        # Path escape detected
                        continue

                    # Never delete protected repository files
                    if resolved_file.name in PROTECTED_FILENAMES:
                        continue

                    # Only clean designated media and subtitle extensions
                    if resolved_file.suffix.lower() not in ALLOWED_EXTENSIONS:
                        continue

                    # Check last-modified timestamp
                    file_stat = resolved_file.stat()
                    if file_stat.st_mtime >= cutoff_time:
                        # File is within the retention period; keep it
                        continue

                    # Check database references
                    should_keep, matching_articles = _check_article_references(db, resolved_file.name)
                    if should_keep:
                        files_kept += 1
                        continue

                    # Safe to delete
                    file_size = file_stat.st_size
                    resolved_file.unlink(missing_ok=True)
                    bytes_freed += file_size
                    files_deleted += 1

                    # If an article's video_path pointed to this file, set only video_path to NULL
                    if matching_articles and db is not None:
                        for art in matching_articles:
                            art.video_path = None
                        try:
                            db.commit()
                        except Exception as commit_err:
                            errors += 1
                            print(f"[VideoCleanup] DB commit error updating video_path for '{resolved_file.name}': {commit_err}")
                            try:
                                db.rollback()
                            except Exception:
                                pass

                except Exception as file_err:
                    errors += 1
                    print(f"[VideoCleanup] Error processing file '{entry}': {file_err}")
                    if db is not None:
                        try:
                            db.rollback()
                        except Exception:
                            pass

    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                pass

    megabytes_freed = round(bytes_freed / (1024 * 1024), 2)
    summary = {
        "files_deleted": files_deleted,
        "megabytes_freed": megabytes_freed,
        "files_kept": files_kept,
        "errors": errors,
    }

    # Log summary line as required
    print(
        f"[VideoCleanup] deleted {files_deleted} files, "
        f"freed {megabytes_freed} MB, "
        f"kept {files_kept}, "
        f"errors {errors}."
    )

    return summary
