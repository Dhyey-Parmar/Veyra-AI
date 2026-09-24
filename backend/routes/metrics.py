from fastapi import APIRouter
from backend.services.model_service import ModelService

router = APIRouter(tags=["Metrics"])
model_service = ModelService.get_instance()

@router.get("/metrics")
async def get_metrics():
    return model_service.get_metrics()
