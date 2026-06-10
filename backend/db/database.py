import os
import uuid
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority",
)
DB_NAME = "logisticai"


# ── In-memory fallback (defined first so it can be used as default below) ────

class InMemoryCursor:
    def __init__(self, docs):
        self._docs = docs

    async def to_list(self, length=None):
        return self._docs[:length] if length else self._docs


class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._docs: list = []

    async def find_one(self, query: dict):
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    async def find(self, query: Optional[dict] = None):
        if not query:
            return InMemoryCursor(self._docs)
        results = [d for d in self._docs if all(d.get(k) == v for k, v in query.items())]
        return InMemoryCursor(results)

    async def insert_one(self, doc: dict):
        doc["_id"] = str(uuid.uuid4())
        self._docs.append(doc)
        return type("Result", (), {"inserted_id": doc["_id"]})()

    async def replace_one(self, query: dict, doc: dict, upsert=False):
        for i, d in enumerate(self._docs):
            if all(d.get(k) == v for k, v in query.items()):
                self._docs[i] = doc
                return
        if upsert:
            await self.insert_one(doc)

    async def update_one(self, query: dict, update: dict, upsert=False):
        for i, d in enumerate(self._docs):
            if all(d.get(k) == v for k, v in query.items()):
                if "$set" in update:
                    self._docs[i].update(update["$set"])
                return
        if upsert:
            new_doc = {**query, **(update.get("$set", {}))}
            await self.insert_one(new_doc)

    async def delete_one(self, query: dict):
        for i, d in enumerate(self._docs):
            if all(d.get(k) == v for k, v in query.items()):
                self._docs.pop(i)
                return

    async def delete_many(self, query: dict):
        self._docs = [
            d for d in self._docs
            if not all(d.get(k) == v for k, v in query.items())
        ]

    async def count_documents(self, query: Optional[dict] = None):
        if not query:
            return len(self._docs)
        return len([
            d for d in self._docs
            if all(d.get(k) == v for k, v in query.items())
        ])


class InMemoryDB:
    def __init__(self):
        self._collections: dict = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]


# ── Module-level db always has a value, never None ───────────────────────────

client = None
db = InMemoryDB()


async def init_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        db = client[DB_NAME]
        print(f"Connected to MongoDB: {DB_NAME}")
        await _create_indexes()
    except Exception as e:
        print(f"MongoDB unavailable: {e}. Running with in-memory database.")


async def _create_indexes():
    try:
        await db.locations.create_index([("session_id", ASCENDING)])
        await db.routes.create_index([("session_id", ASCENDING), ("created_at", ASCENDING)])
    except Exception:
        pass


def get_db():
    return db