from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid

from db.database import get_db
from ml.optimizer import RouteOptimizer

router = APIRouter()
optimizer = RouteOptimizer()


class OptimizeRequest(BaseModel):
    session_id: str = "default"
    locations: List[dict]
    user_availability: dict
    external_factors: dict
    start_location: Optional[dict] = None


class RouteResult(BaseModel):
    id: str
    session_id: str
    ordered_locations: List[dict]
    total_distance_km: float
    total_time_minutes: float
    feasibility_score: float
    warnings: List[str]
    segments: List[dict]
    created_at: str
    factor_penalties: dict


@router.post("/optimize", response_model=dict)
async def optimize_route(req: OptimizeRequest):
    if not req.locations:
        raise HTTPException(status_code=400, detail="No locations provided")

    available_locs = [l for l in req.locations if l.get("is_available", True)]
    if not available_locs:
        raise HTTPException(status_code=400, detail="No available locations")

    result = optimizer.optimize(
        locations=available_locs,
        user_availability=req.user_availability,
        external_factors=req.external_factors,
        start_location=req.start_location,
    )

    result["id"] = str(uuid.uuid4())
    result["session_id"] = req.session_id
    result["created_at"] = datetime.utcnow().isoformat()

    db = get_db()
    await db.routes.insert_one(result.copy())

    result.pop("_id", None)
    return result


@router.get("/history/{session_id}")
async def get_route_history(session_id: str):
    db = get_db()
    cursor = await db.routes.find({"session_id": session_id})
    docs = await cursor.to_list(length=50)
    for d in docs:
        d.pop("_id", None)
    return docs


@router.get("/{route_id}")
async def get_route(route_id: str):
    db = get_db()
    doc = await db.routes.find_one({"id": route_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Route not found")
    doc.pop("_id", None)
    return doc
