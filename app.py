import sys
import os
from pathlib import Path

# Ensure root directory is on sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Expose FastAPI app instance so 'gunicorn app:app' and 'uvicorn app:app' find it immediately
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[Launcher] Launching GlobalPulse AI FastAPI Server on port {port}...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
