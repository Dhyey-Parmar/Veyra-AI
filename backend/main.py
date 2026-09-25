import os
import sys
import types
from pathlib import Path

# Ensure 'backend' is importable whether running from project root or inside backend service root
_CURRENT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _CURRENT_DIR.parent

for _p in [str(_CURRENT_DIR), str(_PROJECT_ROOT)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(_CURRENT_DIR)]
    sys.modules["backend"] = backend_pkg

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes import prediction, model, metrics, insights

app = FastAPI(
    title="Veyra - Intelligent Credit Risk Analytics API",
    description="Veyra Machine Learning REST API for loan default risk prediction and portfolio diagnostics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration: allows local Vite dev server and optional custom domain
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Lightweight health endpoints
@app.get("/health")
@app.get("/api/health")
@app.get("/api")
async def health_check():
    return {"status": "ok"}

# Mount feature routers with /api prefix
app.include_router(prediction.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(insights.router, prefix="/api")

# Also mount feature routers at root to support environments where Vercel strips /api prefix
app.include_router(prediction.router)
app.include_router(model.router)
app.include_router(metrics.router)
app.include_router(insights.router)

# Mount diagnostic plots static directory if available
CURRENT_FILE = Path(__file__).resolve()
PROJECT_ROOT = CURRENT_FILE.parent.parent
if not (PROJECT_ROOT / "artifacts").exists():
    if (CURRENT_FILE.parent / "artifacts").exists():
        PROJECT_ROOT = CURRENT_FILE.parent
    elif (Path.cwd() / "artifacts").exists():
        PROJECT_ROOT = Path.cwd()

PLOTS_DIR = PROJECT_ROOT / "artifacts" / "plots"
if PLOTS_DIR.exists():
    app.mount("/api/plots", StaticFiles(directory=str(PLOTS_DIR)), name="plots")
    app.mount("/plots", StaticFiles(directory=str(PLOTS_DIR)), name="plots_root")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
