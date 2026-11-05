"""
========================================================================================
GlobalPulse AI - HD Image Batch Upgrader & Quality Backfiller
========================================================================================
Upgrades all low-resolution thumbnails (BBC 240px, Guardian 140px, Pollinations 800x450,
CoinDesk 800px, ScienceX thumbnails) across all articles in the database to 1024px+ HD.
========================================================================================
"""

import sys
import re
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
from models import Article
from services.image_resolver import (
    upgrade_image_url_to_hd,
    is_low_res_thumbnail,
    is_generic_placeholder,
    scrape_opengraph_image,
    generate_pollinations_image_url
)

def upgrade_all_database_images():
    db = SessionLocal()
    total_articles = db.query(Article).count()
    print(f"[HD Upgrader] Inspecting {total_articles} articles in database...")

    upgraded_count = 0
    guardian_scraped = 0
    bbc_upgraded = 0
    pollinations_upgraded = 0
    sanity_upgraded = 0
    sciencex_upgraded = 0

    try:
        articles = db.query(Article).order_by(Article.id.desc()).all()

        for a in articles:
            old_url = a.image_url or ""
            new_url = old_url

            # 1. BBC 240px -> 1024px
            if "ichef.bbci.co.uk" in old_url and ("/240/" in old_url or "/320/" in old_url or "/480/" in old_url):
                new_url = upgrade_image_url_to_hd(old_url)
                bbc_upgraded += 1

            # 2. Guardian signed 140px -> Scrape authentic 1200px master from source_url
            elif "i.guim.co.uk" in old_url and ("width=140" in old_url or "width=500" in old_url):
                source_url = getattr(a, "source_url", "")
                if source_url:
                    og_img = scrape_opengraph_image(source_url)
                    if og_img and not is_low_res_thumbnail(og_img):
                        new_url = og_img
                        guardian_scraped += 1
                if new_url == old_url:
                    # Fallback to Flux HD if scrape not available
                    new_url = generate_pollinations_image_url(a.title, a.category or "", a.id)

            # 3. Pollinations 800x450 -> Flux 1280x720 with enhancement
            elif "image.pollinations.ai" in old_url:
                if "width=800" in old_url or "model=flux" not in old_url:
                    new_url = upgrade_image_url_to_hd(old_url)
                    pollinations_upgraded += 1

            # 4. Sanity CDN (CoinDesk) 800px -> 1600px
            elif "cdn.sanity.io" in old_url and ("w=800" in old_url or "fit=" not in old_url):
                new_url = upgrade_image_url_to_hd(old_url)
                sanity_upgraded += 1

            # 5. ScienceX CDN /tmb/ -> /800/
            elif "b-cdn.net" in old_url and "/tmb/" in old_url:
                new_url = upgrade_image_url_to_hd(old_url)
                sciencex_upgraded += 1

            # 6. Generic or missing placeholders
            elif not old_url or is_generic_placeholder(old_url):
                new_url = generate_pollinations_image_url(a.title, a.category or "", a.id)

            if new_url != old_url:
                a.image_url = new_url
                upgraded_count += 1
                print(f"[Upgraded #{a.id}] {a.title[:40]} -> {new_url[:75]}...")

        if upgraded_count > 0:
            db.commit()
            print("\n========================================================")
            print(f"🎉 SUCCESS: Upgraded {upgraded_count} articles to Full HD!")
            print(f"   • BBC standard/1024/: {bbc_upgraded}")
            print(f"   • Guardian 1200px Master: {guardian_scraped}")
            print(f"   • Pollinations Flux 1280x720: {pollinations_upgraded}")
            print(f"   • Sanity 1600px: {sanity_upgraded}")
            print(f"   • ScienceX 800px: {sciencex_upgraded}")
            print("========================================================")
        else:
            print("\n[HD Upgrader] All articles are already full HD!")

    except Exception as e:
        db.rollback()
        print(f"[HD Upgrader Error] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    upgrade_all_database_images()
