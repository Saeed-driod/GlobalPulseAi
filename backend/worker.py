#!/usr/bin/env python
"""
GlobalPulse AI - Backend Worker Launcher
Provides a direct alias so running `python backend/worker.py` executes the local worker.
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
LOCAL_WORKER_PATH = ROOT_DIR / "local_worker.py"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from local_worker import main

if __name__ == "__main__":
    main()
