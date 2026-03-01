from classifier import classify_image
import json

print("Starting test...")
result = classify_image("test12.jpeg")
print("Result received:")
print(json.dumps(result, indent=2))
print("Done!")
