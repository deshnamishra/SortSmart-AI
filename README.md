# SortSmart AI — Waste Segregation & Carbon Footprint Analyser

> Technex Green Hackathon 2026 | Problem Statement 1

---

## What is SortSmart AI?

SortSmart AI is an AI-powered waste classification system that identifies waste from images, maps it to the correct disposal category, calculates carbon footprint savings, and displays sustainability analytics — all in real time.

---

## Problem It Solves

India generates **62 million tonnes** of waste annually. Less than **20% is correctly segregated**. The rest ends up in landfills, releasing methane — 25x more potent than CO₂. SortSmart AI closes this gap by making correct waste disposal instant, effortless, and impactful.

---

## Key Features

- **AI Waste Classification** — Upload any image, get instant category detection
- **3 Category Mapping** — Recyclable, Biodegradable, Hazardous
- **Carbon Footprint Calculator** — Auto-estimates CO₂ saved per item
- **Trees Equivalent** — Translates CO₂ into relatable real-world impact
- **Sustainability Dashboard** — Real-time analytics for citizens, campuses & municipalities
- **Circular Economy Score** — Second life suggestion for every waste item

**Future Vision**
- **Community Leaderboard** — Campus/city-wide rankings based on waste correctly segregated, encouraging healthy competition and sustained engagement

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Roboflow — 99.1% accuracy, 52 waste classes |
| Backend | Python + FastAPI |
| Frontend | React.js + TailwindCSS + Recharts |
| Camera | OpenCV |
| Database | Firebase Firestore |

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Webcam (for live scanning)

### Backend Setup
```bash
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

pip install fastapi uvicorn inference-sdk opencv-python numpy

cd backend
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## Target Audience

| User | What They Get |
|---|---|
| Citizens | Personal carbon impact and disposal guidance |
| Campus Admins | Aggregate waste patterns and analytics |
| Municipalities | City-wide data to optimize collection routes |

---

## Business Model

- **SaaS licensing** to municipalities — ₹50,000/month per city zone
- **Per-bin software licensing** — ₹5,000/bin/year
- **Carbon credit brokerage** — 10% commission on verified credits sold
- Break-even at **50 smart bins deployed**
