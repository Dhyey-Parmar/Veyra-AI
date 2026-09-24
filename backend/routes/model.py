from fastapi import APIRouter, HTTPException
from backend.services.model_service import ModelService

router = APIRouter(tags=["Model Details"])
model_service = ModelService.get_instance()

@router.get("/model-details")
async def get_model_details():
    metadata = model_service.get_metadata()
    if not metadata:
        raise HTTPException(status_code=404, detail="Model metadata not found.")
    return metadata
