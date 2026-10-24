import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Global Scheduler Instance
scheduler: Optional[BackgroundScheduler] = None
last_run_info: Dict[str, Any] = {
    "last_run_time": None,
    "last_run_status": "Never executed",
    "last_run_summary": None,
}


def scheduled_pipeline_job():
    """
    Scheduled job callback invoked by APScheduler at regular intervals.
    """
    global last_run_info
    print(f"\n[Scheduler] Scheduled automation triggered at {datetime.now(timezone.utc).isoformat()}")
    
    try:
        from .pipeline import run_full_automation_pipeline

        batch_size = int(os.getenv("AUTO_PIPELINE_BATCH_SIZE", "1"))
        result = run_full_automation_pipeline(limit=batch_size)
        
        last_run_info["last_run_time"] = datetime.now(timezone.utc).isoformat()
        last_run_info["last_run_status"] = "Success" if result.get("success") else "Failed"
        last_run_info["last_run_summary"] = result.get("message")
        print(f"[Scheduler] Completed scheduled run: {result.get('message')}")
    except Exception as e:
        print(f"[Scheduler] Error during scheduled automation job: {e}")
        last_run_info["last_run_time"] = datetime.now(timezone.utc).isoformat()
        last_run_info["last_run_status"] = f"Error: {str(e)}"


def start_scheduler() -> BackgroundScheduler:
    """
    Initialize and start the 24/7 Background Automation Scheduler.
    Runs every N hours (default: 6 hours, configurable via AUTO_PIPELINE_INTERVAL_HOURS).
    """
    global scheduler

    enabled = os.getenv("AUTO_PIPELINE_ENABLED", "true").lower() in ("true", "1", "yes")
    if not enabled:
        print("[Scheduler] 24/7 Background Automation Scheduler is DISABLED via AUTO_PIPELINE_ENABLED=false.")
        return None

    if scheduler is not None and scheduler.running:
        print("[Scheduler] Scheduler is already active.")
        return scheduler

    # Configure interval (hours or minutes)
    interval_hours = float(os.getenv("AUTO_PIPELINE_INTERVAL_HOURS", "6"))
    interval_minutes = os.getenv("AUTO_PIPELINE_INTERVAL_MINUTES")

    scheduler = BackgroundScheduler(daemon=True)

    if interval_minutes:
        minutes = float(interval_minutes)
        trigger = IntervalTrigger(minutes=minutes)
        interval_desc = f"every {minutes} minutes"
    else:
        trigger = IntervalTrigger(hours=interval_hours)
        interval_desc = f"every {interval_hours} hours"

    scheduler.add_job(
        scheduled_pipeline_job,
        trigger=trigger,
        id="master_news_video_youtube_pipeline",
        name="GlobalPulse AI 24/7 Master News & YouTube Pipeline",
        replace_existing=True,
        max_instances=1,  # Prevent overlapping executions
    )

    scheduler.start()
    print(f"============================================================")
    print(f"[Scheduler] 24/7 BACKGROUND AUTOMATION ACTIVE ({interval_desc})")
    print(f"   Target YouTube Channel: 'GloblePulseAi'")
    print(f"   Next Scheduled Run: {trigger.get_next_fire_time(None, datetime.now(timezone.utc))}")
    print(f"============================================================")

    return scheduler


def stop_scheduler():
    """Cleanly stop the background scheduler."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] Background scheduler shut down.")
        scheduler = None


def get_scheduler_status() -> Dict[str, Any]:
    """Return status and telemetry for the background scheduler."""
    global scheduler, last_run_info

    is_running = scheduler is not None and scheduler.running
    next_run = None

    if is_running:
        job = scheduler.get_job("master_news_video_youtube_pipeline")
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()

    interval_hours = float(os.getenv("AUTO_PIPELINE_INTERVAL_HOURS", "6"))
    interval_minutes = os.getenv("AUTO_PIPELINE_INTERVAL_MINUTES")

    return {
        "is_running": is_running,
        "enabled": os.getenv("AUTO_PIPELINE_ENABLED", "true").lower() in ("true", "1", "yes"),
        "interval_hours": interval_hours,
        "interval_minutes": float(interval_minutes) if interval_minutes else None,
        "next_run_time": next_run,
        "last_run_time": last_run_info["last_run_time"],
        "last_run_status": last_run_info["last_run_status"],
        "last_run_summary": last_run_info["last_run_summary"],
        "channel": "GloblePulseAi"
    }
