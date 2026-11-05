"""
========================================================================================
GlobalPulse AI - Batch Search Engine Indexer & Sitemaps Pinger
========================================================================================
Collects all published articles from Neon PostgreSQL and submits them directly
to the IndexNow API (Bing, Yahoo, Yandex, Naver) and triggers Google/Bing sitemap pings.
========================================================================================
"""

import sys
import os
from pathlib import Path

# Safe Unicode output for Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import SessionLocal
from models import Article, ArticleStatus
from services.indexing_service import submit_urls_to_indexnow, ping_search_engines, BASE_SITE_URL

def batch_index_all_articles():
    db = SessionLocal()
    try:
        articles = (
            db.query(Article)
            .filter(Article.status == ArticleStatus.PUBLISHED.value)
            .order_by(Article.id.desc())
            .all()
        )
        print(f"[Batch Indexer] Found {len(articles)} published articles in database.")

        urls = [
            BASE_SITE_URL,
            f"{BASE_SITE_URL}/live",
            f"{BASE_SITE_URL}/movies",
            f"{BASE_SITE_URL}/about",
        ]

        for a in articles:
            if a.slug:
                urls.append(f"{BASE_SITE_URL}/news/{a.slug}")

        print(f"[Batch Indexer] Submitting {len(urls)} URLs to IndexNow...")
        result = submit_urls_to_indexnow(urls)
        print(f"[Batch Indexer] IndexNow Result: {result}")

        print(f"[Batch Indexer] Pinging Google and Bing sitemaps...")
        ping_res = ping_search_engines()
        print(f"[Batch Indexer] Sitemap Ping Results: {ping_res}")

        print("\n========================================================")
        print("🎉 Batch Indexing Completed!")
        print(f"   • Total URLs submitted: {len(urls)}")
        print(f"   • Search Engines: Bing, Yahoo, Yandex, Naver + Google Ping")
        print("========================================================")

    except Exception as e:
        print(f"[Batch Indexer Error] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    batch_index_all_articles()
