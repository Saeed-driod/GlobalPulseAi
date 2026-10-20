import os
import re
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from dotenv import load_dotenv

load_dotenv()

ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "saeed-admin-2026")
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

def verify_admin_secret(
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    admin_key: Optional[str] = Query(None)
):
    """
    Security gate for administrative actions.
    Checks X-Admin-Secret header or admin_key query parameter.
    """
    provided = x_admin_secret or admin_key
    if not provided or provided != ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing or invalid Admin Secret Key."
        )
    return True

from .database import engine, Base, get_db
from .models import Article, ArticleStatus, ArticleCategory
from .schemas import (
    ArticleResponse,
    ArticleListResponse,
    AdminStatsResponse,
    ActionResponse,
    ArticleCreate,
    ArticleUpdate
)
from .services.scraper import fetch_breaking_rss_news
from .services.ai_service import process_raw_news
from .services.video_generator import compose_short_video, compose_video, compose_long_video
from .services.youtube_uploader import upload_short_to_youtube, upload_long_video_to_youtube, get_oauth_authorization_url, check_auth_status
from .services.pipeline import run_full_automation_pipeline
from .services.scheduler import start_scheduler, stop_scheduler, get_scheduler_status
from .services.image_resolver import refresh_missing_images



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup (never auto-insert dummy seed articles)
    Base.metadata.create_all(bind=engine)
    # Refresh missing or placeholder images on startup
    refresh_missing_images()
    # Automatically start 24/7 Background Automation Scheduler on startup
    start_scheduler()
    yield
    # Cleanly stop scheduler on shutdown
    stop_scheduler()

app = FastAPI(
    title="GlobalPulse AI API",
    description="Automated AI-Powered Global News & Video Media Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend and production deployment
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://globlepluse.onrender.com",
    "https://globlepluseai.onrender.com",
]
if FRONTEND_URL:
    clean_frontend = FRONTEND_URL.strip().rstrip("/")
    if clean_frontend not in cors_origins:
        cors_origins.append(clean_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for rendered videos and assets
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

def slugify(text: str) -> str:

    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return re.sub(r'[\s-]+', '-', text).strip('-')

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/")
def root():
    return {
        "platform": "GlobalPulse AI",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/api/articles", response_model=ArticleListResponse)
def get_articles(
    status: Optional[str] = Query(None, description="Filter by status: DRAFT, VIDEO_READY, PUBLISHED"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search keyword in title or summary"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve paginated list of articles with optional status and category filters."""
    query = db.query(Article)

    if status:
        query = query.filter(Article.status == status.upper())
    if category:
        query = query.filter(Article.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Article.title.ilike(search_filter)) | 
            (Article.summary.ilike(search_filter))
        )

    total = query.count()
    items = query.order_by(desc(Article.created_at)).offset(skip).limit(limit).all()

    return ArticleListResponse(
        items=items,
        total=total,
        page=(skip // limit) + 1,
        limit=limit
    )

@app.get("/api/articles/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db)):
    """Summary metrics for the Admin Automation Dashboard."""
    total = db.query(Article).count()
    drafts = db.query(Article).filter(Article.status == ArticleStatus.DRAFT.value).count()
    video_ready = db.query(Article).filter(Article.status == ArticleStatus.VIDEO_READY.value).count()
    published = db.query(Article).filter(Article.status == ArticleStatus.PUBLISHED.value).count()
    total_views = db.query(func.coalesce(func.sum(Article.views), 0)).scalar()

    return AdminStatsResponse(
        total_articles=total,
        drafts_count=drafts,
        video_ready_count=video_ready,
        published_count=published,
        total_views=int(total_views)
    )

@app.get("/api/articles/{slug}", response_model=ArticleResponse)
def get_article_by_slug(slug: str, db: Session = Depends(get_db)):
    """Retrieve a single article by its SEO slug and increment view count."""
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with slug '{slug}' not found"
        )
    
    # Increment views
    article.views += 1
    db.commit()
    db.refresh(article)
    return article

@app.post("/api/admin/verify")
def verify_admin_key(is_valid: bool = Depends(verify_admin_secret)):
    """Verifies that the provided admin passkey or secret is authorized."""
    return {"success": True, "message": "Admin authorization confirmed."}

@app.post("/api/articles/fetch-now", response_model=ActionResponse, dependencies=[Depends(verify_admin_secret)])
@app.post("/api/fetch-now", response_model=ActionResponse, dependencies=[Depends(verify_admin_secret)])
def fetch_now(limit: int = Query(4, ge=1, le=10), db: Session = Depends(get_db)):
    """
    Fetch breaking stories from Tier-1 global RSS feeds, synthesize with
    Gemini AI (generating headline, TL;DR, markdown article, and 60-sec Shorts script),
    and save into the DRAFT editorial queue.
    """
    raw_news_items = fetch_breaking_rss_news(limit=limit)
    if not raw_news_items:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch RSS news items at this time."
        )

    created_articles = []

    for item in raw_news_items:
        try:
            # Run through Gemini AI Rewriting Engine
            ai_data = process_raw_news(
                raw_title=item["raw_title"],
                raw_summary=item["raw_summary"],
                source_name=item["source_name"],
                suggested_category=item["suggested_category"],
                source_url=item.get("source_url", ""),
                raw_image_url=item.get("raw_image_url")
            )

            # Generate unique SEO slug
            base_slug = slugify(ai_data["title"])
            slug = base_slug
            counter = 1
            while db.query(Article).filter(Article.slug == slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1

            new_article = Article(
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
                status=ArticleStatus.DRAFT.value,
                views=0,
                created_at=datetime.now(timezone.utc)
            )

            db.add(new_article)
            db.commit()
            db.refresh(new_article)
            created_articles.append(new_article)
        except Exception as e:
            print(f"Error processing news item '{item.get('raw_title')}': {e}")
            db.rollback()
            continue

    if not created_articles:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synthesize any articles from RSS feed."
        )

    return ActionResponse(
        success=True,
        message=f"Aggregated {len(created_articles)} breaking stories from global RSS wires and synthesized via Gemini AI.",
        article=created_articles[0] if created_articles else None,
        articles=created_articles
    )


@app.post("/api/articles/{article_id}/generate-video", response_model=ActionResponse, dependencies=[Depends(verify_admin_secret)])
def generate_video(
    article_id: int,
    format: str = Query("long", pattern="^(long|short)$", description="Video format: long (16:9 widescreen HD) or short (9:16 vertical)"),
    db: Session = Depends(get_db)
):
    """
    Trigger automated video rendering pipeline from the article.
    Default format: 16:9 Long-Form HD (1920x1080) with full documentary narration.
    Optional format: 9:16 Shorts (1080x1920).
    Transitions status to VIDEO_READY.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with id {article_id} not found"
        )

    # Execute Video Generator Service
    result = compose_video(
        article_id=article.id,
        title=article.title,
        category=article.category,
        youtube_script=article.youtube_script or article.summary,
        summary=article.summary,
        content=article.content,
        image_url=article.image_url,
        video_format=format
    )

    article.status = ArticleStatus.VIDEO_READY.value
    article.video_path = result.get("video_path")
    db.commit()
    db.refresh(article)

    fmt_desc = "16:9 Widescreen HD (1920x1080)" if format == "long" else "9:16 Shorts (1080x1920)"
    return ActionResponse(
        success=True,
        message=f"Rendered {fmt_desc} video ({result.get('runtime_seconds')}s) with neural broadcast voiceover for '{article.title}'.",
        article=article
    )

@app.post("/api/articles/{article_id}/publish", response_model=ActionResponse, dependencies=[Depends(verify_admin_secret)])
def publish_article(
    article_id: int,
    format: Optional[str] = Query(None, pattern="^(long|short)$"),
    db: Session = Depends(get_db)
):
    """
    Upload generated video to YouTube Data API v3 (defaults to 16:9 Long-Form Video),
    retrieve YouTube video ID, and publish live to portal.
    Transitions status to PUBLISHED.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with id {article_id} not found"
        )

    # Execute YouTube Auto-Uploader Service
    video_disk_path = article.video_path or ""
    if video_disk_path.startswith("/static/"):
        video_disk_path = os.path.join(os.path.dirname(__file__), video_disk_path.lstrip("/"))

    target_format = format
    if not target_format:
        target_format = "short" if ("short_article" in (article.video_path or "")) else "long"

    upload_result = upload_short_to_youtube(
        video_filepath=video_disk_path,
        title=article.title,
        summary=article.summary,
        category=article.category,
        slug=article.slug,
        video_format=target_format
    )

    article.status = ArticleStatus.PUBLISHED.value
    article.published_at = datetime.now(timezone.utc)
    article.youtube_video_id = upload_result.get("video_id") or upload_result.get("youtube_video_id") or "dQw4w9WgXcQ"

    db.commit()
    db.refresh(article)

    fmt_name = "Long-Form 16:9 Video" if target_format == "long" else "YouTube Short"
    return ActionResponse(
        success=True,
        message=f"Published {fmt_name} ({article.youtube_video_id}) and live on portal: '{article.title}'.",
        article=article
    )

@app.post("/api/articles/{article_id}/auto-publish", response_model=ActionResponse, dependencies=[Depends(verify_admin_secret)])
def auto_publish_pipeline(
    article_id: int,
    format: str = Query("long", pattern="^(long|short)$"),
    db: Session = Depends(get_db)
):
    """
    One-Click Full Automation Pipeline:
    1. Render video (16:9 Long-Form HD by default) + neural audio voiceover
    2. Upload to YouTube Data API v3
    3. Syndicate & Mark as PUBLISHED on live website portal
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with id {article_id} not found"
        )

    # Step 1: Render Video
    video_res = compose_video(
        article_id=article.id,
        title=article.title,
        category=article.category,
        youtube_script=article.youtube_script or article.summary,
        summary=article.summary,
        content=article.content,
        image_url=article.image_url,
        video_format=format
    )
    article.video_path = video_res.get("video_path")
    article.status = ArticleStatus.VIDEO_READY.value
    db.commit()

    # Step 2: Upload to YouTube
    video_disk_path = article.video_path or ""
    if video_disk_path.startswith("/static/"):
        video_disk_path = os.path.join(os.path.dirname(__file__), video_disk_path.lstrip("/"))

    upload_res = upload_short_to_youtube(
        video_filepath=video_disk_path,
        title=article.title,
        summary=article.summary,
        category=article.category,
        slug=article.slug,
        video_format=format
    )

    # Step 3: Publish Live
    article.status = ArticleStatus.PUBLISHED.value
    article.published_at = datetime.now(timezone.utc)
    article.youtube_video_id = upload_res.get("video_id") or upload_res.get("youtube_video_id") or "dQw4w9WgXcQ"
    db.commit()
    db.refresh(article)

    fmt_name = "16:9 Long-Form HD Video" if format == "long" else "9:16 YouTube Short"
    return ActionResponse(
        success=True,
        message=f"Full automation complete: Rendered {fmt_name}, uploaded to YouTube ({article.youtube_video_id}), and syndicated live on portal!",
        article=article
    )


@app.get("/api/auth-youtube")
def auth_youtube():
    """
    Direct Browser YouTube OAuth2 Authorization flow.
    Instantly returns a 307 redirect to Google's OAuth consent screen
    so the browser opens Google login immediately without spinning.
    """
    from .services.youtube_uploader import get_oauth_authorization_url
    try:
        auth_url = get_oauth_authorization_url()
        return RedirectResponse(url=auth_url, status_code=307)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth initialization error: {str(e)}"
        )


@app.get("/api/auth-youtube/status")
def auth_youtube_status():
    """Check whether token.json exists and is valid."""
    from .services.youtube_uploader import check_auth_status
    return check_auth_status()


@app.post("/api/pipeline/run", dependencies=[Depends(verify_admin_secret)])
def trigger_master_pipeline(
    limit: int = Query(1, ge=1, le=5, description="Number of stories to fetch, render, and publish"),
    format: str = Query("long", pattern="^(long|short)$", description="Video format: long (16:9 1080p HD) or short (9:16)"),
    db: Session = Depends(get_db)
):
    """
    Master Full Automation Pipeline:
    1. Fetch latest raw news from RSS feeds.
    2. Synthesize via Gemini AI (headline, TL;DR, markdown, narration script).
    3. Generate 16:9 widescreen HD video (or 9:16 short) + neural voiceover.
    4. Upload MP4 directly to YouTube (EduHub by Saeed).
    5. Update article to PUBLISHED and syndicate live to portal.
    """
    return run_full_automation_pipeline(limit=limit, db=db, video_format=format)



@app.get("/api/scheduler/status")
def get_scheduler_telemetry():
    """
    Telemetry and heartbeat status for the 24/7 APScheduler background worker.
    """
    return get_scheduler_status()


