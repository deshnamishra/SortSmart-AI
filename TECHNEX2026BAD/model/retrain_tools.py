import os
import json
import time
import shutil
import hashlib
from datetime import datetime

import cv2

from classifier import classify_image, classify_from_frame


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _utc_stamp() -> str:
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S")


def _safe_name(s: str) -> str:
    return "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in s)[:60]


def dhash_bgr(frame_bgr, hash_size: int = 8) -> str:
    """Compute a perceptual dHash for a BGR image (OpenCV frame).

    Returns a hex string; identical/very similar images tend to have same hash.
    """
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    diff = resized[:, 1:] > resized[:, :-1]
    # Pack bits into an integer, then to hex
    bit_string = ''.join('1' if v else '0' for v in diff.flatten())
    return hex(int(bit_string, 2))[2:].rjust(hash_size * hash_size // 4, '0')


def file_fingerprint(path: str) -> str:
    """Fast fingerprint: filename + size + mtime."""
    st = os.stat(path)
    return f"{os.path.basename(path)}|{st.st_size}|{int(st.st_mtime)}"


def sha256_file(path: str, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def collect_training_samples_from_images(
    image_paths,
    out_dir: str = "collected_samples",
    min_confidence: float = 50.0,
    focus_categories=("Hazardous", "Unknown"),
    dedupe: bool = True,
):
    """Run your current inference on a list of images and save samples for retraining.

    Saves:
      - image copies under out_dir/images/
      - metadata json under out_dir/meta/

    Collection policy:
      - If category in focus_categories OR confidence < min_confidence
      - Optional dedupe using SHA256 of file
    """
    _ensure_dir(out_dir)
    img_dir = os.path.join(out_dir, "images")
    meta_dir = os.path.join(out_dir, "meta")
    _ensure_dir(img_dir)
    _ensure_dir(meta_dir)

    seen_sha = set()
    saved = 0

    for p in image_paths:
        if not os.path.exists(p):
            continue

        if dedupe:
            try:
                s = sha256_file(p)
            except OSError:
                continue
            if s in seen_sha:
                continue
            seen_sha.add(s)

        result = classify_image(p)
        if not result.get("success"):
            continue

        cat = result.get("waste_category", "Unknown")
        conf = float(result.get("confidence", 0))

        should_collect = (cat in focus_categories) or (conf < float(min_confidence))
        if not should_collect:
            continue

        base = os.path.splitext(os.path.basename(p))[0]
        tag = f"{_utc_stamp()}_{_safe_name(base)}_{_safe_name(cat)}_{int(conf)}"
        dst_img = os.path.join(img_dir, f"{tag}{os.path.splitext(p)[1] or '.jpg'}")
        dst_meta = os.path.join(meta_dir, f"{tag}.json")

        shutil.copy2(p, dst_img)
        payload = {
            "source_path": os.path.abspath(p),
            "saved_path": os.path.abspath(dst_img),
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "policy": {
                "min_confidence": float(min_confidence),
                "focus_categories": list(focus_categories),
            },
            "prediction": result,
        }
        with open(dst_meta, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        saved += 1

    return {"saved": saved, "out_dir": os.path.abspath(out_dir)}


def collect_training_samples_from_webcam(
    out_dir: str = "collected_samples",
    camera_index: int = 0,
    seconds: int = 30,
    every_n_frames: int = 12,
    min_confidence: float = 50.0,
    focus_categories=("Hazardous", "Unknown"),
    dedupe: bool = True,
):
    """Capture webcam frames, run current inference, and save hazardous/low-conf samples.

    Uses perceptual hash (dHash) on frames when dedupe=True.
    """
    _ensure_dir(out_dir)
    img_dir = os.path.join(out_dir, "images")
    meta_dir = os.path.join(out_dir, "meta")
    _ensure_dir(img_dir)
    _ensure_dir(meta_dir)

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        return {"saved": 0, "error": "Could not open webcam"}

    seen = set()
    saved = 0
    start = time.time()
    frame_idx = 0

    try:
        while (time.time() - start) < seconds:
            ok, frame = cap.read()
            if not ok or frame is None:
                continue

            frame_idx += 1
            if frame_idx % max(1, int(every_n_frames)) != 0:
                continue

            if dedupe:
                h = dhash_bgr(frame)
                if h in seen:
                    continue
                seen.add(h)

            annotated, classifications = classify_from_frame(frame)
            if not classifications:
                continue

            best = max(classifications, key=lambda x: x.get("confidence", 0))
            cat = best.get("category", "Unknown")
            conf = float(best.get("confidence", 0))

            should_collect = (cat in focus_categories) or (conf < float(min_confidence))
            if not should_collect:
                continue

            tag = f"{_utc_stamp()}_{_safe_name(best.get('object','obj'))}_{_safe_name(cat)}_{int(conf)}"
            dst_img = os.path.join(img_dir, f"{tag}.jpg")
            dst_meta = os.path.join(meta_dir, f"{tag}.json")

            cv2.imwrite(dst_img, frame)
            payload = {
                "timestamp_utc": datetime.utcnow().isoformat() + "Z",
                "policy": {
                    "min_confidence": float(min_confidence),
                    "focus_categories": list(focus_categories),
                },
                "best": best,
                "all": classifications,
            }
            with open(dst_meta, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)

            saved += 1

    finally:
        cap.release()

    return {"saved": saved, "out_dir": os.path.abspath(out_dir)}
