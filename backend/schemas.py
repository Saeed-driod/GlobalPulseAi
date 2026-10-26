from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ArticleBase(BaseModel):
    title: str
    category: str
    summary: str
    content: str
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    author_name: Optional[str] = "Muhammad Saeed (Chief Editor, GlobalPulse AI)"
    image_url: Optional[str] = None
    youtube_script: Optional[str] = None
    video_path: Optional[str] = None
    youtube_video_id: Optional[str] = None
    video_status: Optional[str] = "IDLE"
    video_progress: Optional[int] = 0
    video_stage_text: Optional[str] = ""
    video_error: Optional[str] = None
    video_eta: Optional[str] = None
    video_updated_at: Optional[datetime] = None
    status: Optional[str] = "DRAFT"

class ArticleCreate(ArticleBase):
    slug: Optional[str] = None

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    author_name: Optional[str] = None
    image_url: Optional[str] = None
    youtube_script: Optional[str] = None
    video_path: Optional[str] = None
    youtube_video_id: Optional[str] = None
    video_status: Optional[str] = None
    video_progress: Optional[int] = None
    video_stage_text: Optional[str] = None
    video_error: Optional[str] = None
    video_eta: Optional[str] = None
    status: Optional[str] = None

class ArticleResponse(ArticleBase):
    id: int
    slug: str
    views: int
    created_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ArticleListResponse(BaseModel):
    items: List[ArticleResponse]
    total: int
    page: int
    limit: int

class AdminStatsResponse(BaseModel):
    total_articles: int
    drafts_count: int
    video_ready_count: int
    published_count: int
    total_views: int

class ActionResponse(BaseModel):
    success: bool
    message: str
    article: Optional[ArticleResponse] = None
    articles: Optional[List[ArticleResponse]] = None

class VideoProgressResponse(BaseModel):
    article_id: int
    title: str
    category: str
    video_status: str
    video_progress: int
    video_stage_text: str
    video_error: Optional[str] = None
    video_eta: Optional[str] = None
    youtube_video_id: Optional[str] = None
    video_path: Optional[str] = None
    updated_at: Optional[datetime] = None

class WorkerStatusResponse(BaseModel):
    online: bool
    worker_name: str
    status: str
    last_seen: Optional[datetime] = None
    active_article_id: Optional[int] = None
    active_article_title: Optional[str] = None
    channel_name: str
    total_completed: int


class AnalyticsTrackRequest(BaseModel):
    path: str
    article_slug: Optional[str] = None
    referrer: Optional[str] = None
    device: Optional[str] = "Mobile"
    browser: Optional[str] = "Chrome"


class AnalyticsSourceStat(BaseModel):
    source: str
    count: int
    percent: float


class AnalyticsCountryStat(BaseModel):
    country_code: str
    country_name: str
    flag: str
    count: int
    percent: float


class AnalyticsTopArticle(BaseModel):
    id: int
    title: str
    slug: str
    category: str
    views: int


class AnalyticsLiveVisit(BaseModel):
    id: int
    path: str
    article_title: Optional[str] = None
    source: str
    country_code: str
    country_name: str
    flag: str
    device: str
    time_ago: str


class AnalyticsSummaryResponse(BaseModel):
    total_views: int
    views_today: int
    unique_visitors_today: int
    mobile_percent: float
    desktop_percent: float
    top_source: str
    top_country: str
    sources: List[AnalyticsSourceStat]
    countries: List[AnalyticsCountryStat]
    top_articles: List[AnalyticsTopArticle]
    recent_visits: List[AnalyticsLiveVisit]


