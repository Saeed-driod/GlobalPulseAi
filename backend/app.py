import os
import sys
from pathlib import Path

# Ensure BOTH the backend dir AND project root are on sys.path
# so that plain imports like `from database import ...` work when
# uvicorn runs this file directly from the backend/ directory on Render.
_this_dir = Path(__file__).resolve().parent          # .../backend/
_root_dir = _this_dir.parent                          # .../

for _p in (_this_dir, _root_dir):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

# Import the FastAPI app.  Render's Procfile runs:
#   uvicorn main:app  (cwd = backend/)
# so plain `from database import` works fine after the sys.path setup above.
# When called from project root (e.g. `uvicorn backend.app:app`) the try/
# except inside main.py's relative-import block handles it automatically.
try:
    from backend.main import app          # project-root context
except (ImportError, ModuleNotFoundError):
    from main import app                  # backend/ cwd context

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting GlobalPulse AI FastAPI Server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
