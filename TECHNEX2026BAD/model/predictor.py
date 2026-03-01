from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import requests


# Model + API key (env var overrides)
ROBOFLOW_API_URL = os.getenv("ROBOFLOW_API_URL", "https://detect.roboflow.com")
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "r3gmnoIt6drLhuPYJjO9")
MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "garbage-classification-3/2")


# Map model classes → 3 waste categories
WASTE_MAPPING: dict[str, dict[str, Any]] = {
    # Recyclable
    "plastic": {"category": "Recyclable"},
    "glass": {"category": "Recyclable"},
    "metal": {"category": "Recyclable"},
    "cardboard": {"category": "Recyclable"},
    "cloth": {"category": "Recyclable"},

    # Biodegradable
    "paper": {"category": "Biodegradable"},
    "biodegradable": {"category": "Biodegradable"},

    # Hazardous
    "battery": {"category": "Hazardous"},
    "charger": {"category": "Hazardous"},
    "electronic": {"category": "Hazardous"},
}


SECOND_LIFE: dict[str, str] = {
    "plastic": "Recyclable into polyester fibre for clothing industry",
    "glass": "100% recyclable — can be remelted infinitely",
    "metal": "Aluminium recycling saves 95% energy vs new production",
    "cardboard": "Recyclable into packaging — saves trees",
    "paper": "Recyclable into notebooks and tissue products",
    "biodegradable": "Compostable — produces biogas and fertilizer",
}


def _post_image_bytes(url: str, image_bytes: bytes) -> requests.Response:
    # Roboflow Hosted API commonly accepts either raw bytes or multipart.
    # Try multipart first (more proxy-friendly), then raw bytes.
    try:
        files = {"file": ("image.jpg", image_bytes, "application/octet-stream")}
        resp = requests.post(url, files=files, timeout=60)
        if resp.status_code < 500:
            return resp
    except Exception:
        pass

    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    return requests.post(url, data=image_bytes, headers=headers, timeout=60)


def infer(image_path: str) -> dict[str, Any]:
    if not ROBOFLOW_API_KEY:
        raise RuntimeError("ROBOFLOW_API_KEY is missing")

    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(str(path))

    url = f"{ROBOFLOW_API_URL.rstrip('/')}/{MODEL_ID}?api_key={ROBOFLOW_API_KEY}"

    image_bytes = path.read_bytes()
    resp = _post_image_bytes(url, image_bytes)
    resp.raise_for_status()
    return resp.json()


def classify_image(image_path: str) -> dict[str, Any]:
    """Classify a local image using Roboflow Hosted API.

    Returns a dict compatible with the previous model/classifier.py output.
    """
    try:
        result = infer(image_path)

        predictions = result.get("predictions") or []
        if not predictions:
            return {"success": False, "message": "No waste detected"}

        best = max(predictions, key=lambda x: float(x.get("confidence", 0.0)))

        class_name = str(best.get("class", "")).lower().strip()
        confidence = round(float(best.get("confidence", 0.0)) * 100.0, 2)

        mapping = WASTE_MAPPING.get(class_name, {"category": "Unknown"})

        return {
            "success": True,
            "object_detected": class_name,
            "waste_category": mapping["category"],
            "confidence": confidence,
            "second_life": SECOND_LIFE.get(class_name, "Dispose responsibly"),
        }
    except requests.HTTPError as e:
        return {"success": False, "message": f"Roboflow API error: {e}"}
    except Exception as e:
        return {"success": False, "message": str(e)}
