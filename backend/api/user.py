from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from db.database import get_db

router = APIRouter()


class TimeWindow(BaseModel):
    start: str
    end: str
    label: Optional[str] = None


class UserAvailability(BaseModel):
    session_id: str = "default"
    windows: List[TimeWindow] = []
    start_location: Optional[dict] = None  # {lat, lng, name}
    max_travel_time_minutes: int = 480


@router.get("/{session_id}")
async def get_user(session_id: str):
    db = get_db()
    doc = await db.user_availability.find_one({"session_id": session_id})
    if not doc:
        return UserAvailability(session_id=session_id).dict()
    doc.pop("_id", None)
    return doc


@router.put("/{session_id}")
async def update_user(session_id: str, availability: UserAvailability):
    db = get_db()
    doc = availability.dict()
    doc["session_id"] = session_id
    await db.user_availability.update_one({"session_id": session_id}, {"$set": doc}, upsert=True)
    return doc
