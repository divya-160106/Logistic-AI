from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from db.database import get_db

router = APIRouter()


class TimeWindow(BaseModel):
    start: str  # "HH:MM"
    end: str    # "HH:MM"


class Location(BaseModel):
    id: Optional[str] = None
    session_id: str = "default"
    name: str
    lat: float
    lng: float
    criticality: str = "medium"  # low / medium / high
    availability_windows: List[TimeWindow] = []
    is_available: bool = True
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


@router.get("/", response_model=List[dict])
async def get_locations(session_id: str = "default"):
    db = get_db()
    cursor = await db.locations.find({"session_id": session_id})
    docs = await cursor.to_list(length=200)
    for d in docs:
        d.pop("_id", None)
    return docs


@router.post("/", response_model=dict)
async def create_location(location: Location):
    db = get_db()
    doc = location.dict()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.utcnow().isoformat()
    await db.locations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/{location_id}", response_model=dict)
async def update_location(location_id: str, location: Location):
    db = get_db()
    doc = location.dict()
    doc["id"] = location_id
    await db.locations.replace_one({"id": location_id}, doc, upsert=True)
    doc.pop("_id", None)
    return doc


@router.delete("/{location_id}")
async def delete_location(location_id: str):
    db = get_db()
    await db.locations.delete_one({"id": location_id})
    return {"deleted": location_id}


@router.delete("/session/{session_id}")
async def clear_session_locations(session_id: str):
    db = get_db()
    await db.locations.delete_many({"session_id": session_id})
    return {"cleared": session_id}
