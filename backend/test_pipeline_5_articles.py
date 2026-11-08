import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from services.scraper import fetch_breaking_rss_news
from services.ai_service import process_raw_news
from editorial_config import FIXED_CATEGORIES, BANNED_WORDS

def run_test():
    print("Fetching 5 real breaking RSS stories across wires...")
    raw_items = fetch_breaking_rss_news(limit=5)
    print(f"Fetched {len(raw_items)} items from RSS feeds.\n")

    results = []
    for idx, item in enumerate(raw_items[:5], 1):
        print(f"--- Processing Story #{idx} ---")
        print(f"Raw Title: {item.get('raw_title')}")
        print(f"Source: {item.get('source_name')} | Wire Cat: {item.get('suggested_category')}")

        res = process_raw_news(
            raw_title=item.get("raw_title", ""),
            raw_summary=item.get("raw_summary", ""),
            source_name=item.get("source_name", "News Wire"),
            suggested_category=item.get("suggested_category", "AI & Tech"),
            source_url=item.get("source_url", ""),
            raw_image_url=item.get("raw_image_url")
        )

        # Validation Checks
        headline = res.get("headline", res.get("title", ""))
        meta_desc = res.get("meta_description", "")
        category = res.get("category", "")
        key_points = res.get("key_points", [])
        body = res.get("body", "")
        why_it_matters = res.get("why_it_matters", "")
        confidence = res.get("confidence", "")
        byline = res.get("author_name", "")

        headline_len = len(headline)
        meta_desc_len = len(meta_desc)
        body_words = len(body.split())

        # Check banned words
        full_text = f"{headline} {meta_desc} {body} {why_it_matters}".lower()
        found_banned = [w for w in BANNED_WORDS if w.lower() in full_text]

        # Check for fake tables or FAQs
        has_table = "|" in res.get("content", "") and "\n|" in res.get("content", "")
        has_faq = "frequently asked questions" in res.get("content", "").lower() or "**q:" in res.get("content", "").lower()

        validation = {
            "headline_len": headline_len,
            "headline_valid": headline_len <= 68,
            "meta_desc_len": meta_desc_len,
            "meta_desc_valid": 130 <= meta_desc_len <= 165 and meta_desc.endswith("."),
            "category_valid": category in FIXED_CATEGORIES,
            "category": category,
            "key_points_count": len(key_points),
            "body_words": body_words,
            "confidence": confidence,
            "byline": byline,
            "banned_words_found": found_banned,
            "has_fabricated_tables": has_table,
            "has_fabricated_faqs": has_faq,
        }

        results.append({
            "raw": item,
            "processed": res,
            "validation": validation
        })

        print(f"Classified Category: {category} (Valid: {validation['category_valid']})")
        print(f"Headline ({headline_len} chars): {headline}")
        print(f"Meta Description ({meta_desc_len} chars): {meta_desc}")
        print(f"Key Points Count: {len(key_points)}")
        print(f"Confidence: {confidence} | Body Word Count: {body_words}")
        print(f"Byline: {byline}")
        print(f"Banned Words Found: {found_banned}")
        print(f"Fabricated Tables: {has_table} | Fabricated FAQs: {has_faq}\n")

    return results

if __name__ == "__main__":
    run_test()

