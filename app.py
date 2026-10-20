import sys
from pathlib import Path
import uvicorn

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print("[Launcher] Launching GlobalPulse AI Full-Stack Platform...")
    print("   FastAPI Backend: http://localhost:8000")
    print("   Documentation:   http://localhost:8000/docs")
    print("   Admin Dashboard: http://localhost:3000/admin")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
