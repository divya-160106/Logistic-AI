# LogisticAI — Intelligent Route Control System

Enterprise AI-powered logistics routing dashboard with reinforcement learning optimization.

## Stack
- **Frontend**: React 18 + Vite + Zustand + Leaflet
- **Backend**: FastAPI + WebSockets + MongoDB (Atlas)
- **ML**: Custom RL-inspired optimizer (Q-learning + 2-opt)

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs at http://localhost:8000

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

### 3. (Optional) Train ML weights
```bash
cd backend
python ml/train.py
```

## MongoDB Setup
Edit `backend/.env` and replace `<username>` and `<password>` with your MongoDB Atlas credentials.
The system falls back to an in-memory database if MongoDB is unavailable.
