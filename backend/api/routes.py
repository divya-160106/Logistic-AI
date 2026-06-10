from fastapi import APIRouter
from api.locations import router as locations_router
from api.routes_endpoint import router as routes_router
from api.factors import router as factors_router
from api.user import router as user_router

router = APIRouter()
router.include_router(locations_router, prefix="/locations", tags=["Locations"])
router.include_router(routes_router, prefix="/routes", tags=["Routes"])
router.include_router(factors_router, prefix="/factors", tags=["External Factors"])
router.include_router(user_router, prefix="/user", tags=["User"])
