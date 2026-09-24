from fastapi import APIRouter
from backend.services.model_service import ModelService

router = APIRouter(tags=["Insights"])
model_service = ModelService.get_instance()

@router.get("/insights")
async def get_insights():
    return model_service.get_insights()
