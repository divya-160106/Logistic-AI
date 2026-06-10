# LogisticAI 🗺️
### Enterprise AI-Powered Logistics Route Optimization System

> A full-stack intelligent route planning dashboard built with React, FastAPI, and a custom
> Reinforcement Learning optimizer. Designed to feel like a real internal dispatch system —
> think UPS or FedEx control panels, but open source.

🌐 **Live Demo → [https://logistic-ai-swart.vercel.app](https://logistic-ai-swart.vercel.app)**

---

## 📸 Preview

<img width="1918" height="911" alt="image" src="https://github.com/user-attachments/assets/06e4ada5-3542-4d2b-8778-cf353c6ad271" />

---

## ✨ Features

- 🗺️  Interactive map — click anywhere to drop waypoints
- 🧭  AI route optimization using Reinforcement Learning (Q-learning + 2-opt)
- ⚡  Real-time updates via WebSockets
- 🌦️  Environmental conditions panel — rain, snow, traffic, construction, fog, wind, road closures
- 🕐  User availability time windows — hard constraints on when you can travel
- 🔴🟡🟢  Location criticality levels — High / Medium / Low priority
- 📊  Route dashboard with feasibility score, total distance, ETA, and warnings
- 💾  Session persistence — map state survives page refresh
- 🧪  One-click demo loader — 8 pre-seeded NYC locations to try instantly
- 📡  Live activity feed with real-time event log

---

## 🖥️ Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Zustand, Leaflet.js             |
| Backend    | FastAPI, Uvicorn, WebSockets                    |
| Database   | MongoDB Atlas (falls back to in-memory if none) |
| ML Engine  | Custom RL optimizer — Q-learning + 2-opt        |
| Styling    | Pure CSS with CSS variables, dark theme         |
| Deployment | Vercel (frontend) + Render (backend)            |

## 📁 Project Structure

```text
logisticai/
│
├── backend/
│   ├── api/
│   │   ├── locations.py
│   │   ├── routes_endpoint.py
│   │   ├── factors.py
│   │   ├── user.py
│   │   └── routes.py
│   │
│   ├── core/
│   │   └── websocket_manager.py
│   │
│   ├── db/
│   │   └── database.py
│   │
│   ├── ml/
│   │   ├── optimizer.py
│   │   ├── train.py
│   │   └── weights.json
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── Map/
│   │   │   ├── Panels/
│   │   │   └── Sidebar/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSessionPersistence.js
│   │   │   └── useWebSocket.js
│   │   │
│   │   ├── store/
│   │   │   └── useStore.js
│   │   │
│   │   └── utils/
│   │       ├── api.js
│   │       └── demoData.js
│   │
│   └── package.json
│
├── start.sh
├── start.bat
└── README.md
```

### Backend

| File | Purpose |
|--------|---------|
| `api/locations.py` | CRUD endpoints for map waypoints |
| `api/routes_endpoint.py` | Route optimization endpoint |
| `api/factors.py` | External conditions API |
| `api/user.py` | User availability API |
| `core/websocket_manager.py` | WebSocket connection manager |
| `db/database.py` | MongoDB + in-memory fallback |
| `ml/optimizer.py` | Reinforcement-learning route optimizer |
| `ml/train.py` | Offline model training |
| `ml/weights.json` | Pre-trained model weights |
| `main.py` | FastAPI application entry point |

### Frontend

| Folder/File | Purpose |
|-------------|---------|
| `components/Map` | Leaflet map, controls, legend |
| `components/Panels` | Locations, factors, routes, availability |
| `components/Sidebar` | Navigation, stats, top bar |
| `components/Dashboard` | Live feed and notifications |
| `hooks/useWebSocket.js` | WebSocket connection hook |
| `hooks/useSessionPersistence.js` | Local storage persistence |
| `store/useStore.js` | Zustand global state |
| `utils/api.js` | Axios API client |
| `utils/demoData.js` | Demo scenario seed data |

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1 — Backend

```bash
cd backend

python -m venv venv

# Mac/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate

pip install -r requirements.txt
python main.py
```

Backend → http://localhost:8000
API docs → http://localhost:8000/docs

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend → http://localhost:5173

### 3 — One-command start

```bash
# Mac/Linux
chmod +x start.sh && ./start.sh

# Windows — double-click or run:
start.bat
```

---

## 🗄️ Database Setup (MongoDB Atlas)

1. Create a free account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free **M0** cluster
3. Create a database user and copy your connection string
4. Edit `backend/.env`:
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

> If you skip this step the app runs fine using an in-memory database.
> All features work — data just won't persist between restarts.

---

## 🧠 How the AI Works

The optimizer in `ml/optimizer.py` runs in three phases:

**Phase 1 — Q-learning inspired greedy construction**
Scores each unvisited location using a reward function:
Q = criticality_bonus - distance_penalty × distance - time_violation_penalty
Always picks the highest-scoring unvisited location next.

**Phase 2 — 2-opt local search**
Takes the greedy route and repeatedly tries reversing segments to reduce
total distance. Runs up to 50 iterations.

**Phase 3 — External factor penalties**
Travel time is multiplied by a severity factor derived from active conditions.
Heavy traffic at 60% severity adds ~16% to every travel time on the route.

**Feasibility score**
The final route is rated 0–100 based on how well it satisfies time windows,
user availability, and condition severity. Shown in the dashboard and top bar.

To retrain the model weights on new synthetic scenarios:

```bash
cd backend
python ml/train.py
# completes in ~30 seconds, saves weights.json
```

---

## ☁️ Deployment

| Service  | Platform | URL                                                                    |
|----------|----------|------------------------------------------------------------------------|
| Frontend | Vercel   | [logistic-ai-swart.vercel.app](https://logistic-ai-swart.vercel.app)  |
| Backend  | Render   | Your Render URL                                                        |
| Database | MongoDB Atlas | Free M0 cluster                                                   |

---

## 📄 Copyright

Copyright (c) 2025 Divya. All rights reserved.

This project and its source code may not be copied, modified, distributed,
or used in any form without explicit written permission from the author.

---

<p align="center">Built by Divya</p>
