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
        # Fast projected query: load only the slug column
        rows = (
            db.query(Article.slug)
            .filter(Article.status == ArticleStatus.PUBLISHED.value)
            .order_by(Article.id.desc())
            .all()
        )
        print(f"[Batch Indexer] Found {len(rows)} published articles in database.", flush=True)

        urls = [
            BASE_SITE_URL,
            f"{BASE_SITE_URL}/live",
            f"{BASE_SITE_URL}/movies",
            f"{BASE_SITE_URL}/about",
        ]

        for (slug,) in rows:
            if slug:
                urls.append(f"{BASE_SITE_URL}/news/{slug}")

        print(f"[Batch Indexer] Submitting {len(urls)} URLs to IndexNow...", flush=True)
        result = submit_urls_to_indexnow(urls)
        print(f"[Batch Indexer] IndexNow Result: {result}", flush=True)

        print(f"[Batch Indexer] Checking sitemaps...", flush=True)
        ping_res = ping_search_engines()
        print(f"[Batch Indexer] Status: {ping_res}", flush=True)

        print("\n========================================================", flush=True)
        print("🎉 Batch Indexing Completed!", flush=True)
        print(f"   • Total URLs submitted: {len(urls)}", flush=True)
        print(f"   • Search Engines: Bing, Yahoo, Yandex, Naver", flush=True)
        print("========================================================", flush=True)

    except Exception as e:
        print(f"[Batch Indexer Error] {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    batch_index_all_articles()
