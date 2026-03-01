from fastapi import FastAPI, UploadFile, File
import tensorflow as tf
import numpy as np
from PIL import Image

app = FastAPI()
model = tf.keras.models.load_model("model.h5")

classes = ["Biodegradable","Recyclable","Hazardous"]

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img = Image.open(file.file).resize((224,224))
    img = np.array(img)/255.0
    img = img.reshape(1,224,224,3)

    prediction = model.predict(img)
    result = classes[np.argmax(prediction)]

    return {"prediction": result}