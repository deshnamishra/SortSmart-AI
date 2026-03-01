from pathlib import Path
import glob

from retrain_tools import (
    collect_training_samples_from_images,
    collect_training_samples_from_webcam,
)


def collect_from_folder(folder: str = ".", out_dir: str = "hazardous_collection"):
    paths = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp", "*.jfif", "*.avif"):
        paths.extend(glob.glob(str(Path(folder) / ext)))

    res = collect_training_samples_from_images(
        paths,
        out_dir=out_dir,
        min_confidence=65.0,
        focus_categories=("Hazardous", "Unknown"),
        dedupe=True,
    )
    print(res)


def collect_from_camera(out_dir: str = "hazardous_collection", seconds: int = 45):
    res = collect_training_samples_from_webcam(
        out_dir=out_dir,
        seconds=seconds,
        min_confidence=65.0,
        focus_categories=("Hazardous", "Unknown"),
        every_n_frames=10,
        dedupe=True,
    )
    print(res)


if __name__ == "__main__":
    # Option A: collect from the images already in ./model
    collect_from_folder(folder=".", out_dir="hazardous_collection")

    # Option B: collect from webcam (uncomment)
    # collect_from_camera(out_dir="hazardous_collection", seconds=60)
