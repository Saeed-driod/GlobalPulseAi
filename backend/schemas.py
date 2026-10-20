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

