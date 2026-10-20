from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from .database import Base

class ArticleStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    VIDEO_READY = "VIDEO_READY"
    PUBLISHED = "PUBLISHED"

class ArticleCategory(str, enum.Enum):
    AI_TECH = "AI & Tech"
    GLOBAL_MARKETS = "Global Markets"
    GEOPOLITICS = "Geopolitics"
    FUTURE_SCIENCE = "Future Science"

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(320), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    
    # Editorial & AI Content
    summary = Column(Text, nullable=False)  # TL;DR bullet points / key takeaways
    content = Column(Text, nullable=False)  # Full markdown article
    source_url = Column(String(600), nullable=True)
    source_name = Column(String(150), nullable=True)
    author_name = Column(String(200), default="Muhammad Saeed (Chief Editor, GlobalPulse AI)", nullable=True)
    image_url = Column(String(800), nullable=True)
    
    # Automation & Video Workflow
    youtube_script = Column(Text, nullable=True)  # 60-sec engaging Shorts script
    video_path = Column(String(600), nullable=True)  # Local path or cloud URL to generated MP4
    youtube_video_id = Column(String(100), nullable=True)  # YouTube Shorts/Video ID
    
    status = Column(
        String(50), 
        default=ArticleStatus.DRAFT.value, 
        index=True, 
        nullable=False
    )
    views = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
