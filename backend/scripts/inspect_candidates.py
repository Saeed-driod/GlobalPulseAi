import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Auto re-exec into backend/venv if executed with system python
_venv_py_linux = Path(__file__).resolve().parent.parent / "venv" / "bin" / "python"
if _venv_py_linux.exists() and sys.executable != str(_venv_py_linux):
    import os
    os.execv(str(_venv_py_linux), [str(_venv_py_linux)] + sys.argv)

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
for p in (BACKEND_DIR, SCRIPT_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from database import SessionLocal
from models import Article, ArticleStatus
from editorial_config import CATEGORY_FOCUS

db = SessionLocal()
cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
print(f"Cutoff 24h: {cutoff.isoformat()}")
print(f"CATEGORY_FOCUS: {CATEGORY_FOCUS}")

query = (
    db.query(Article)
    .filter(
        Article.status == ArticleStatus.PUBLISHED.value,
        Article.is_noindex == False,
        Article.published_at >= cutoff,
        ~Article.slug.like("daily-brief-%")
    )
)
all_in_window = query.all()
print(f"\nTotal articles in last 24h window (published, not noindex, not daily-brief): {len(all_in_window)}")
for a in all_in_window:
    words = len((a.content or "").split())
    total_words = len(((a.summary or "") + " " + (a.content or "")).split())
    in_focus = a.category in CATEGORY_FOCUS
    print(f"  #{a.id} [{a.category}] in_focus={in_focus} content_words={words} total_words={total_words} views={a.views} title={a.title[:45]}")

gta = db.query(Article).filter(Article.slug == "gta-6-uk-prices-editions-where-to-buy").first()
if gta:
    print(f"\nGTA 6 article: id={gta.id} pub={gta.published_at} words={len((gta.content or '').split())}")

db.close()
