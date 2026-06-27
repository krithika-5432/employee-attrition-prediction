from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.main import router
import app.ml.loader as loader

# This variable initialization MUST be named lowercase "app"
app = FastAPI(title="Retainify API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        loader.load_all()
        print("✓ Startup complete — all models ready")
    except Exception as e:
        print(f"✗ Startup failed: {e}")
        raise

app.include_router(router)

@app.get("/")
def root():
    return {
        "status": "Retainify API running",
        "models_loaded": list(loader.models.keys()),
        "scaler_ready": loader.scaler is not None,
        "features": len(loader.feature_columns) if loader.feature_columns else 0,
    }