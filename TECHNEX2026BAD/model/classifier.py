from inference_sdk import InferenceHTTPClient
import cv2

# Roboflow API Client
CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="r3gmnoIt6drLhuPYJjO9"   # your key
)

# IMPORTANT — back to stable model
MODEL_ID = "garbage-classification-3/2"

# Map model classes → 3 waste categories
WASTE_MAPPING = {
    # Recyclable
    "plastic":      {"category": "Recyclable",    "color": (255, 165, 0)},
    "glass":        {"category": "Recyclable",    "color": (255, 165, 0)},
    "metal":        {"category": "Recyclable",    "color": (255, 165, 0)},
    "cardboard":    {"category": "Recyclable",    "color": (255, 165, 0)},
    "cloth":        {"category": "Recyclable",    "color": (255, 165, 0)},

    # Biodegradable
    "paper":        {"category": "Biodegradable", "color": (0, 200, 0)},
    "biodegradable":{"category": "Biodegradable", "color": (0, 200, 0)},

    "battery": {"category": "Hazardous", "color": (0,0,255)},
    "charger": {"category": "Hazardous", "color": (0,0,255)},
    "electronic": {"category": "Hazardous", "color": (0,0,255)},
}

SECOND_LIFE = {
    "plastic":       "Recyclable into polyester fibre for clothing industry",
    "glass":         "100% recyclable — can be remelted infinitely",
    "metal":         "Aluminium recycling saves 95% energy vs new production",
    "cardboard":     "Recyclable into packaging — saves trees",
    "paper":         "Recyclable into notebooks and tissue products",
    "biodegradable": "Compostable — produces biogas and fertilizer",
}

# -------------------------------------------------
# IMAGE CLASSIFICATION (STATIC IMAGE)
# -------------------------------------------------
def classify_image(image_path):
    try:
        result = CLIENT.infer(image_path, model_id=MODEL_ID)

        if not result or "predictions" not in result or len(result["predictions"]) == 0:
            return {"success": False, "message": "No waste detected"}

        predictions = result["predictions"]
        best = max(predictions, key=lambda x: x["confidence"])

        class_name = best["class"].lower()
        confidence = round(best["confidence"] * 100, 2)

        mapping = WASTE_MAPPING.get(class_name,
                    {"category": "Unknown", "color": (128,128,128)})

        return {
            "success": True,
            "object_detected": class_name,
            "waste_category": mapping["category"],
            "confidence": confidence,
            "second_life": SECOND_LIFE.get(class_name, "Dispose responsibly"),
        }

    except Exception as e:
        return {"success": False, "message": str(e)}


# -------------------------------------------------
# WEBCAM CLASSIFICATION
# -------------------------------------------------
def classify_from_frame(frame):
    try:
        temp_path = "temp_frame.jpg"
        cv2.imwrite(temp_path, frame)

        result = CLIENT.infer(temp_path, model_id=MODEL_ID)
        annotated_frame = frame.copy()
        classifications = []

        if not result or "predictions" not in result:
            return annotated_frame, classifications

        predictions = result["predictions"]
        if len(predictions) == 0:
            return annotated_frame, classifications

        best = max(predictions, key=lambda x: x["confidence"])

        class_name = best["class"].lower()
        confidence = best["confidence"]

        mapping = WASTE_MAPPING.get(class_name,
                    {"category": "Unknown", "color": (128,128,128)})

        category = mapping["category"]
        color = mapping["color"]

        # Draw bounding box
        x = int(best["x"] - best["width"] / 2)
        y = int(best["y"] - best["height"] / 2)
        w = int(best["width"])
        h = int(best["height"])

        cv2.rectangle(annotated_frame, (x, y), (x+w, y+h), color, 2)

        label = f"{category} ({confidence:.0%})"
        cv2.putText(annotated_frame,
                   label,
                   (x, y - 10),
                   cv2.FONT_HERSHEY_SIMPLEX,
                   0.7,
                   color,
                   2)

        classifications.append({
            "object": class_name,
            "category": category,
            "confidence": round(confidence * 100, 2),
            "second_life": SECOND_LIFE.get(class_name, "Dispose responsibly")
        })

        return annotated_frame, classifications

    except Exception as e:
        print("Error:", e)
        return frame, []