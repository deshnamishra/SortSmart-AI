# VERDANT — Integrated Frontend + Backend

This project is set up so the backend lives in `model/` and serves:

- `POST /predict` (image → waste category)
- `GET /` (the built React app from `waste-classifier/build`)

The backend uses `model/predictor.py` (Roboflow Hosted API via `requests`).

## 1) Production-style (single server)

Build the frontend:

```powershell
Set-Location .\waste-classifier
npm run build
```

Start the backend (serves the React build + API on `http://localhost:8000`):

```powershell
Set-Location ..
.\venv\Scripts\python.exe -m uvicorn model.app:app --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000`

## 2) Development (two servers)

Start backend:

```powershell
Set-Location .
.\venv\Scripts\python.exe -m uvicorn model.app:app --host 0.0.0.0 --port 8000
```

Start React dev server (proxy is configured in `waste-classifier/package.json`):

```powershell
Set-Location .\waste-classifier
npm start
```

Open:

- `http://localhost:3000`

## Configuration (optional)

The Roboflow settings can be overridden with environment variables:

- `ROBOFLOW_API_KEY`
- `ROBOFLOW_MODEL_ID` (default: `garbage-classification-3/2`)
- `ROBOFLOW_API_URL` (default: `https://detect.roboflow.com`)
