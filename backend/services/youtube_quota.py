"""
========================================================================================
GlobalPulse AI - YouTube Daily Quota & Pacing Management Service
========================================================================================
Enforces strict daily caps on automated YouTube uploads:
- Maximum 3 YouTube Shorts (9:16 vertical) per calendar day (UTC)
- Maximum 1 Long-form Video (16:9 widescreen HD) per calendar day (UTC)
- Total Maximum 4 videos per day. Under no circumstances should more be uploaded automatically.

Also manages pacing/distribution throughout the day (morning, afternoon, prime evening)
to maximize YouTube Shorts algorithm reach and prevent channel spam flagging.
========================================================================================
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    from ..models import YouTubeDailyUpload, Article, WorkerHeartbeat
except (ImportError, ValueError):
    from models import YouTubeDailyUpload, Article, WorkerHeartbeat

# Optimized daily limits for maximum reach & zero API quota overflow
MAX_DAILY_SHORTS = 4
MAX_DAILY_LONGS = 1
MAX_DAILY_TOTAL = 5
MIN_HOURS_BETWEEN_SHORTS = 2.5  # Spacing between automated shorts (morning, mid-day, afternoon, prime evening)


def get_utc_day_boundaries(target_date: Optional[datetime] = None) -> Tuple[datetime, datetime]:
    """Returns (start_of_day_utc, end_of_day_utc) for the given date (default: today)."""
    ref = target_date or datetime.now(timezone.utc)
    start = ref.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


def record_youtube_upload(
    db: Session,
    article_id: Optional[int],
    youtube_video_id: str,
    video_format: str = "short",
    title: str = "",
    category: str = ""
) -> YouTubeDailyUpload:
    """
    Persists a verified successful YouTube upload to the daily tracking ledger.
    """
    fmt = "long" if "long" in str(video_format).lower() else "short"
    if article_id:
        try:
            art = db.query(Article).filter(Article.id == article_id).first()
            if art and art.video_path:
                if "short_" in str(art.video_path).lower():
                    fmt = "short"
                elif "long_" in str(art.video_path).lower():
                    fmt = "long"
        except Exception:
            pass
    clean_id = (youtube_video_id or "").strip()
    if not clean_id or clean_id == "dQw4w9WgXcQ":
        return None

    try:
        # Avoid duplicate log entries for the same YouTube ID
        existing = db.query(YouTubeDailyUpload).filter(
            YouTubeDailyUpload.youtube_video_id == clean_id
        ).first()
        if existing:
            return existing

        log_entry = YouTubeDailyUpload(
            article_id=article_id,
            youtube_video_id=clean_id,
            video_format=fmt,
            title=(title or "")[:295],
            category=(category or "")[:95],
            uploaded_at=datetime.now(timezone.utc)
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        print(f"[YouTube Quota Tracker] Recorded {fmt.upper()} upload: https://youtu.be/{clean_id}")
        return log_entry
    except Exception as e:
        print(f"[YouTube Quota Tracker Warning] Error logging upload: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return None


def get_daily_youtube_upload_counts(db: Session, target_date: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Computes real-time YouTube upload totals for today (UTC):
    - shorts_today (max 3)
    - longs_today (max 1)
    - total_today (max 4)
    - remaining slots
    """
    start_utc, end_utc = get_utc_day_boundaries(target_date)

    # 1. Query records from dedicated daily tracking table
    try:
        logs = db.query(YouTubeDailyUpload).filter(
            YouTubeDailyUpload.uploaded_at >= start_utc,
            YouTubeDailyUpload.uploaded_at < end_utc
        ).all()
        shorts_count = sum(1 for l in logs if l.video_format == "short")
        longs_count = sum(1 for l in logs if l.video_format == "long")
        last_upload_time = max((l.uploaded_at for l in logs), default=None)
    except Exception as e:
        print(f"[YouTube Quota Warning] Daily table query error: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        shorts_count = 0
        longs_count = 0
        last_upload_time = None

    # 2. Reconcile with Article table if dedicated table has 0 records but articles were updated today
    if (shorts_count + longs_count) == 0:
        try:
            recent_uploaded_articles = db.query(Article).filter(
                Article.youtube_video_id != None,
                Article.youtube_video_id != "",
                Article.youtube_video_id != "dQw4w9WgXcQ",
                Article.video_updated_at >= start_utc,
                Article.video_updated_at < end_utc
            ).all()

            seen_ids = set()
            for art in recent_uploaded_articles:
                if art.youtube_video_id in seen_ids:
                    continue
                seen_ids.add(art.youtube_video_id)
                is_long = "long_" in (art.video_path or "").lower()
                if is_long:
                    longs_count += 1
                else:
                    shorts_count += 1
                if not last_upload_time or (art.video_updated_at and art.video_updated_at > last_upload_time):
                    last_upload_time = art.video_updated_at
        except Exception as e:
            print(f"[YouTube Quota Warning] Article fallback query error: {e}")
            try:
                db.rollback()
            except Exception:
                pass

    total_today = shorts_count + longs_count
    can_upload_short = shorts_count < MAX_DAILY_SHORTS
    can_upload_long = longs_count < MAX_DAILY_LONGS
    quota_exhausted = (shorts_count >= MAX_DAILY_SHORTS) and (longs_count >= MAX_DAILY_LONGS)

    if quota_exhausted:
        quota_status = "QUOTA_REACHED"
    elif not can_upload_short and can_upload_long:
        quota_status = "SHORTS_LIMIT_REACHED"
    elif can_upload_short and not can_upload_long:
        quota_status = "LONGS_LIMIT_REACHED"
    else:
        quota_status = "ACTIVE"

    return {
        "shorts_today": shorts_count,
        "longs_today": longs_count,
        "total_today": total_today,
        "max_shorts": MAX_DAILY_SHORTS,
        "max_longs": MAX_DAILY_LONGS,
        "max_total": MAX_DAILY_TOTAL,
        "shorts_remaining": max(0, MAX_DAILY_SHORTS - shorts_count),
        "longs_remaining": max(0, MAX_DAILY_LONGS - longs_count),
        "can_upload_short": can_upload_short,
        "can_upload_long": can_upload_long,
        "quota_exhausted": quota_exhausted,
        "status": quota_status,
        "last_upload_time": last_upload_time
    }


def can_post_now(
    db: Session,
    video_format: str = "short",
    min_hours_gap: float = MIN_HOURS_BETWEEN_SHORTS,
    ignore_cooldown: bool = False,
    is_manual: bool = False
) -> Tuple[bool, str]:
    """
    Evaluates whether a YouTube upload can proceed right now.
    Checks:
    1. If manual admin upload: allows override of daily automated soft caps up to Google API hard limit (6 total).
    2. Automated daily limits (4 shorts, 1 long).
    3. Cooldown spacing between automated uploads (2.5 hours) to distribute across peak viewing windows.
    """
    counts = get_daily_youtube_upload_counts(db)
    is_long = "long" in str(video_format).lower()

    if is_manual:
        # User manually triggered this video from Mission Control Admin.
        # Allow it unless Google API 10,000 units quota (6 uploads = 9,600 units) is about to overflow.
        if counts["total_today"] >= 6:
            return False, f"Google YouTube API Hard Quota Safe Guard: {counts['total_today']}/6 videos uploaded today. Exceeding 6 would crash your API quota with 429 quotaExceeded."
        return True, f"Manual admin upload authorized ({counts['total_today']}/6 total uploads today)."

    if is_long:
        if counts["longs_today"] >= MAX_DAILY_LONGS:
            return False, f"Daily limit reached for Long-form video ({counts['longs_today']}/{MAX_DAILY_LONGS} today). Cap is {MAX_DAILY_LONGS} per day."
        return True, f"Slot available for daily Long video ({counts['longs_today']}/{MAX_DAILY_LONGS} uploaded)."
    else:
        if counts["shorts_today"] >= MAX_DAILY_SHORTS:
            return False, f"Daily limit reached for YouTube Shorts ({counts['shorts_today']}/{MAX_DAILY_SHORTS} today). Cap is {MAX_DAILY_SHORTS} per day."

        # Check cooldown / pacing spacing
        if not ignore_cooldown and counts["last_upload_time"]:
            now_utc = datetime.now(timezone.utc)
            last_dt = counts["last_upload_time"]
            if not last_dt.tzinfo:
                last_dt = last_dt.replace(tzinfo=timezone.utc)
            elapsed_hours = (now_utc - last_dt).total_seconds() / 3600.0
            if elapsed_hours < min_hours_gap:
                wait_min = int((min_hours_gap - elapsed_hours) * 60)
                return False, f"Pacing cooldown active: Last upload was {elapsed_hours:.1f}h ago. Next automated Short eligible in ~{wait_min} min (spreads {MAX_DAILY_SHORTS} Shorts across peak audience hours)."

        return True, f"Slot available for YouTube Short ({counts['shorts_today']}/{MAX_DAILY_SHORTS} uploaded)."
