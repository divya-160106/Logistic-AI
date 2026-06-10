import json
from contextlib import asynccontextmanager
from datetime import datetime

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from core.websocket_manager import ConnectionManager
from db.database import init_db, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("LogisticAI backend started.")
    yield
    # optional teardown goes here


app = FastAPI(
    title="LogisticAI Control System",
    description="Enterprise AI-powered logistics routing engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()


# ── Non-prefixed routes declared BEFORE include_router ──────────────────────

@app.get("/health")
async def health():
    return {"status": "operational", "timestamp": datetime.utcnow().isoformat()}


@app.get("/stats/{session_id}")
async def session_stats(session_id: str):
    db = get_db()
    loc_count = await db.locations.count_documents({"session_id": session_id})
    route_count = await db.routes.count_documents({"session_id": session_id})
    return {
        "session_id": session_id,
        "location_count": loc_count,
        "route_count": route_count,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.broadcast(
                json.dumps({"type": "echo", "payload": message, "client": client_id})
            )
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(
            json.dumps({"type": "client_disconnected", "client": client_id})
        )

app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)