import os
import sys
from pathlib import Path
import uvicorn

# Ensure the root project directory is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if __name__ == "__main__":
    print("Starting GlobalPulse AI FastAPI Server with 24/7 Background Scheduler...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
