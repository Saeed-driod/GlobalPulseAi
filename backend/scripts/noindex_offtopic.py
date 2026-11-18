"""
GlobalPulse AI - Safe Off-Topic Article Noindex Script
===============================================================================
Finds PUBLISHED articles whose category is NOT in CATEGORY_FOCUS and sets
is_noindex = True on them so search engines and sitemaps ignore them.

Safety Guarantees:
- Never deletes any article records.
- Never modifies article status (remains PUBLISHED).
- Default mode is a DRY RUN (read-only); changes database only with --apply.
===============================================================================
"""

import sys
import os
import argparse
from pathlib import Path
from collections import Counter

# Safe Unicode output for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend directory to sys.path
try:
    SCRIPT_DIR = Path(__file__).resolve().parent
    BACKEND_DIR = SCRIPT_DIR.parent
    for p in (BACKEND_DIR, SCRIPT_DIR):
        if str(p) not in sys.path:
            sys.path.insert(0, str(p))
except Exception:
    pass

# Ensure standard working directories are present
for candidate in (Path.cwd(), Path.cwd() / "backend"):
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

from database import SessionLocal
from models import Article, ArticleStatus
from editorial_config import CATEGORY_FOCUS


def run_noindex_offtopic(apply_changes: bool = False):
    focus = CATEGORY_FOCUS if CATEGORY_FOCUS else ["AI & Tech", "Sports", "Entertainment"]
    print("=" * 78)
    print("  GlobalPulse AI - Off-Topic Article Noindex Utility")
    print(f"  Active Category Focus: {focus}")
    print(f"  Execution Mode: {'APPLY CHANGES (--apply)' if apply_changes else 'DRY RUN (Preview Only)'}")
    print("=" * 78)

    db = SessionLocal()
    try:
        # Fetch all published articles
        published_articles = (
            db.query(Article)
            .filter(Article.status == ArticleStatus.PUBLISHED.value)
            .order_by(Article.id.asc())
            .all()
        )

        total_published = len(published_articles)
        in_focus = []
        off_topic = []

        for art in published_articles:
            if art.category in focus:
                in_focus.append(art)
            else:
                off_topic.append(art)

        print(f"\n[Summary] Total PUBLISHED articles found: {total_published}")
        print(f"  - In-Focus Articles     : {len(in_focus)}")
        print(f"  - Off-Topic Articles    : {len(off_topic)}")

        # Breakdown of off-topic articles by category
        off_topic_counts = Counter(art.category for art in off_topic)
        already_noindex = sum(1 for art in off_topic if getattr(art, "is_noindex", False))
        need_update = [art for art in off_topic if not getattr(art, "is_noindex", False)]

        print("\n--- Off-Topic Category Breakdown ---")
        if off_topic_counts:
            for cat, count in sorted(off_topic_counts.items(), key=lambda x: -x[1]):
                print(f"  • {cat:<24}: {count:>4} articles")
        else:
            print("  (None found)")

        print("\n--- Status Breakdown ---")
        print(f"  • Already is_noindex = True  : {already_noindex}")
        print(f"  • Needs is_noindex = True    : {len(need_update)}")

        if not apply_changes:
            print("\n" + "-" * 78)
            print("[DRY RUN COMPLETE] No records were modified.")
            print("To apply these changes and set is_noindex = True on off-topic articles, run:")
            print("    python backend/scripts/noindex_offtopic.py --apply")
            print("-" * 78)
            return

        # Apply changes safely
        if not need_update:
            print("\n[OK] All off-topic articles already have is_noindex = True. No changes needed.")
            return

        updated_count = 0
        for art in need_update:
            art.is_noindex = True
            updated_count += 1

        db.commit()
        print("\n" + "=" * 78)
        print(f"✔ [SUCCESS] Updated {updated_count} off-topic article(s) to is_noindex = True.")
        print("  Articles remain PUBLISHED and visible to users, but excluded from sitemaps/robots.")
        print("=" * 78)

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Database operation failed: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Safely mark off-topic published articles as is_noindex=True."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        default=False,
        help="Apply changes to the database. Without this flag, performs a read-only dry run.",
    )
    args = parser.parse_args()
    run_noindex_offtopic(apply_changes=args.apply)


if __name__ == "__main__":
    main()
