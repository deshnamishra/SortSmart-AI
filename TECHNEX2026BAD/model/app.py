from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .predictor import classify_image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_BUILD_DIR = PROJECT_ROOT / "waste-classifier" / "build"


app = FastAPI(title="VERDANT API", version="1.0.0")

# Safe defaults for local dev; if you serve the React build from this same app,
# the browser will be same-origin and CORS is irrelevant.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "image"
    suffix = Path(filename).suffix.lower() or ".jpg"
    allowed_suffixes = {".jpg", ".jpeg", ".png", ".webp", ".jfif", ".avif"}
    looks_like_image = suffix in allowed_suffixes
    content_type = (file.content_type or "").lower()

    if (content_type and not content_type.startswith("image/")) and not looks_like_image:
        raise HTTPException(status_code=400, detail="Please upload an image file")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = Path(tmp.name)

        result = classify_image(str(tmp_path))

        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("message", "No waste detected"))

        category = result.get("waste_category")
        if category not in {"Recyclable", "Biodegradable", "Hazardous"}:
            raise HTTPException(status_code=422, detail="Unable to classify this item")

        confidence_pct = float(result.get("confidence", 0.0))
        return {
            "prediction": category,
            "confidence": round(confidence_pct / 100.0, 4),
            "object": result.get("object_detected"),
            "secondLife": result.get("second_life"),
        }
    finally:
        try:
            if "tmp_path" in locals() and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
        except Exception:
            pass


# Serve the built React frontend (production integration)
if FRONTEND_BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD_DIR / "static")), name="static")


@app.get("/")
def index() -> FileResponse:
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(
            status_code=404,
            detail="React build not found. Run `npm run build` in waste-classifier/ first.",
        )
    return FileResponse(str(index_file))


@app.get("/{full_path:path}")
def spa_fallback(full_path: str) -> FileResponse:
    # Let API routes (e.g. /predict) take precedence; this only runs if no match.
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(
        status_code=404,
        detail="React build not found. Run `npm run build` in waste-classifier/ first.",
    )
