"""
GlobalPulse AI - Slugs Noindex Script
Sets is_noindex = True on specific articles identified by slug.
Prints matched count first, then applies updates, and prints updated count.
Does NOT delete anything.
"""

import sys
from pathlib import Path

# Safe Unicode output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend directory to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
for p in (BACKEND_DIR, SCRIPT_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

for candidate in (Path.cwd(), Path.cwd() / "backend"):
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

try:
    from database import SessionLocal
    from models import Article
except ImportError:
    from backend.database import SessionLocal
    from backend.models import Article

SLUGS_TO_NOINDEX = [
    "apple-teases-macbook-pro-event-next-week-7",
    "apple-teases-macbook-pro-event-next-week-6",
    "apple-teases-macbook-pro-event-next-week-2",
    "apple-teases-macbook-pro-event-next-week-1",
    "sonys-best-noise-canceling-earbuds-are-nearly-100-off-today-only-2",
    "sonys-best-noise-canceling-earbuds-are-nearly-100-off-today-only-1",
    "hackers-hit-ai-coding-tool-opencode-running-up-charges-on-users-ai-accounts-4",
    "hackers-hit-ai-coding-tool-opencode-running-up-charges-on-users-ai-accounts-3",
    "hackers-hit-ai-coding-tool-opencode-running-up-charges-on-users-ai-accounts-1",
    "amazon-is-funding-a-new-nuclear-plant-in-indiana-4",
    "amazon-is-funding-a-new-nuclear-plant-in-indiana-1",
    "nvidia-launches-new-open-models-to-run-agents-in-the-enterprise-and-on-pcs-2",
    "nvidia-launches-new-open-models-to-run-agents-in-the-enterprise-and-on-pcs-1",
    "people-are-using-ai-to-make-their-smart-tvs-dumb-again-2",
    "people-are-using-ai-to-make-their-smart-tvs-dumb-again-1",
    "lets-talk-about-jensen-huangs-many-affairs",
    "the-nvidia-scandal-isnt-slowing-down",
    "the-unfolding-jensen-huang-scandal-a-timeline",
    "an-overview-of-jensen-huangs-messy-days",
    "what8217s-really-at-stake-in-the-jensen-huang-saga",
    "nvidia-is-reportedly-preparing-to-fire-jensen-huang",
    "grard-depardieu-drops-appeal-in-sexual-assault-case-and-accep",
    "russell-brand-faces-sexual-misconduct-claims-from-six-more-wom",
    "openssl-vulnerability-identified-in-evpencodeblock",
    "microsoft8217s-massive-outlook-outage-continues",
]

def main():
    db = SessionLocal()
    try:
        articles = db.query(Article).filter(Article.slug.in_(SLUGS_TO_NOINDEX)).all()
        matched_count = len(articles)
        print(f"Matched count: {matched_count}")

        updated_count = 0
        for art in articles:
            if not art.is_noindex:
                art.is_noindex = True
                updated_count += 1

        if updated_count > 0:
            db.commit()

        print(f"Updated count: {updated_count}")
        print(f"Total target slugs: {len(SLUGS_TO_NOINDEX)}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
