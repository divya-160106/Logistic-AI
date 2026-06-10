from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from db.database import get_db

router = APIRouter()


class ExternalFactors(BaseModel):
    session_id: str = "default"
    rain: float = 0.0          # 0.0 - 1.0 severity
    snow: float = 0.0
    traffic: float = 0.0
    construction: float = 0.0
    fog: float = 0.0
    wind: float = 0.0
    road_closure: float = 0.0


@router.get("/{session_id}")
async def get_factors(session_id: str):
    db = get_db()
    doc = await db.factors.find_one({"session_id": session_id})
    if not doc:
        return ExternalFactors(session_id=session_id).dict()
    doc.pop("_id", None)
    return doc


@router.put("/{session_id}")
async def update_factors(session_id: str, factors: ExternalFactors):
    db = get_db()
    doc = factors.dict()
    doc["session_id"] = session_id
    await db.factors.update_one({"session_id": session_id}, {"$set": doc}, upsert=True)
    return doc
