"""
Prepend an update note to the top of an existing article's content and re-submit to IndexNow.
"""

import argparse
import os
import sys
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import SessionLocal
from backend.models import Article
from backend.services.indexing_service import notify_search_engines_new_article


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepend an update line to an article's content.")
    parser.add_argument("--slug", required=True, help="Target article slug")
    parser.add_argument("--text", required=True, help="Update paragraph to prepend")
    parser.add_argument("--dry-run", action="store_true", help="Preview without modifying DB")
    parser.add_argument("--apply", action="store_true", help="Apply change to DB and trigger IndexNow")
    args = parser.parse_args()

    if not args.dry_run and not args.apply:
        print("Specify either --dry-run or --apply")
        sys.exit(1)

    db = SessionLocal()
    try:
        art = db.query(Article).filter(Article.slug == args.slug).first()
        if not art:
            print(f"Article not found: {args.slug}")
            sys.exit(1)

        update_line = args.text.strip()
        existing_content = art.content or ""

        if existing_content.startswith(update_line):
            print(f"Already updated: {args.slug}")
            if args.apply:
                notify_search_engines_new_article(args.slug)
            return

        new_content = f"{update_line}\n\n{existing_content}"

        if args.dry_run:
            print(f"[DRY-RUN] Article #{art.id}: {art.title}")
            print(f"[DRY-RUN] Old start: {existing_content[:120]!r}")
            print(f"[DRY-RUN] New start: {new_content[:280]!r}")
            return

        art.content = new_content
        if hasattr(art, "updated_at"):
            art.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(art)
        print(f"[APPLIED] Updated article #{art.id}: {args.slug}")
        notify_search_engines_new_article(args.slug)
    finally:
        db.close()


if __name__ == "__main__":
    main()
