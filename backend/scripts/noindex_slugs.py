"""
GlobalPulse AI - Slugs Noindex Script
Sets is_noindex = True on specific articles identified by slug.
Prints matched count first, then applies updates, and prints updated count.
Does NOT delete anything.
"""

import sys
import os
from pathlib import Path

# Auto re-exec into backend/venv if executed with system python
_venv_py_linux = Path(__file__).resolve().parent.parent / "venv" / "bin" / "python"
_venv_py_win = Path(__file__).resolve().parent.parent / "venv" / "Scripts" / "python.exe"
_venv_py = _venv_py_linux if _venv_py_linux.exists() else (_venv_py_win if _venv_py_win.exists() else None)

if _venv_py and Path(sys.executable).resolve() != _venv_py.resolve():
    os.execv(str(_venv_py), [str(_venv_py)] + sys.argv)

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
    "daily-brief-2026-11-22",
    "daily-brief-2026-11-23",
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
