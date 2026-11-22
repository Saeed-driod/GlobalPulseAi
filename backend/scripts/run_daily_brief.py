"""
GlobalPulse AI - Daily Brief Runner Script
CLI entrypoint to execute or dry-run the Daily Brief pipeline.
Usage:
  python backend/scripts/run_daily_brief.py --dry-run   (Default: generates & tests gate without publishing)
  python backend/scripts/run_daily_brief.py --apply     (Publishes Daily Brief to live database and IndexNow)
"""

import sys
import os
import argparse
from pathlib import Path

# Auto re-exec into backend/venv if executed with system python
_venv_py_linux = Path(__file__).resolve().parent.parent / "venv" / "bin" / "python"
_venv_py_win = Path(__file__).resolve().parent.parent / "venv" / "Scripts" / "python.exe"
_venv_py = _venv_py_linux if _venv_py_linux.exists() else (_venv_py_win if _venv_py_win.exists() else None)

if _venv_py and Path(sys.executable).resolve() != _venv_py.resolve():
    os.execv(str(_venv_py), [str(_venv_py)] + sys.argv)

# Safe Unicode output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure backend directory and root are in sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

for p in (ROOT_DIR, BACKEND_DIR, SCRIPT_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

try:
    from services.daily_brief import run_daily_brief
except ImportError:
    from backend.services.daily_brief import run_daily_brief


def main():
    parser = argparse.ArgumentParser(description="Run GlobalPulse AI Daily Brief")
    parser.add_argument(
        "--apply",
        dest="dry_run",
        action="store_false",
        help="Generate and publish Daily Brief live to portal & IndexNow",
    )
    parser.add_argument(
        "--dry-run",
        dest="dry_run",
        action="store_true",
        default=True,
        help="Generate Daily Brief and run quality gate without saving/publishing (default)",
    )
    args = parser.parse_args()

    mode = "DRY-RUN" if args.dry_run else "APPLY (LIVE PUBLISH)"
    print("=" * 60)
    print(f"  GLOBALPULSE AI - DAILY BRIEF RUNNER [{mode}]")
    print("=" * 60)

    result = run_daily_brief(dry_run=args.dry_run)

    status = result.get("status")
    if status == "skipped":
        print(f"\n[Daily Brief Skipped] Reason: {result.get('reason')}")
        return

    if status in ("failed", "error") and "headline" not in result:
        print(f"\n[Daily Brief Error] Reason: {result.get('reason')}")
        return

    headline = result.get("headline", "")
    word_count = result.get("word_count", 0)
    candidates_count = result.get("candidates_count", 0)
    links_count = result.get("links_count", 0)
    gate_passed = result.get("gate_passed", False)
    failures = result.get("failures", [])
    body_preview = result.get("body_preview", "")

    gate_str = "PASS" if gate_passed else f"FAIL ({'; '.join(failures)})"

    print(f"\nheadline: {headline}")
    print(f"word count: {word_count}")
    print(f"candidates count: {candidates_count}")
    print(f"links count: {links_count}")
    print(f"gate: {gate_str}")

    if body_preview:
        print("\n--- BODY PREVIEW (First 600 chars) ---")
        print(body_preview)
        print("--- END PREVIEW ---")

    if not args.dry_run:
        if status == "published":
            print(f"\n✔ Successfully published article #{result.get('article_id')} (slug: {result.get('slug')})")
        else:
            print(f"\n✖ Publishing aborted: {result.get('reason')}")


if __name__ == "__main__":
    main()
