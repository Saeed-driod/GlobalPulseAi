import os
import sys
from pathlib import Path

# Ensure the root project directory is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Expose app for gunicorn/uvicorn inside backend directory
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting GlobalPulse AI FastAPI Server on port {port}...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
