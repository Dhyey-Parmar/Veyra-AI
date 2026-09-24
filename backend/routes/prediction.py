import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.services.prediction_service import PredictionService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Prediction"])
prediction_service = PredictionService()

class LoanApplicationInput(BaseModel):
    Age: int = Field(..., ge=18, le=100, description="Applicant age in years")
    Income: float = Field(..., ge=0, description="Annual income in USD")
    LoanAmount: float = Field(..., ge=500, description="Requested loan amount in USD")
    CreditScore: int = Field(..., ge=300, le=850, description="FICO/Bureau credit score")
    MonthsEmployed: int = Field(..., ge=0, le=600, description="Employment duration in months")
    NumCreditLines: int = Field(..., ge=0, le=50, description="Total active credit lines")
    InterestRate: float = Field(..., ge=0.1, le=40.0, description="Interest rate percentage")
    LoanTerm: int = Field(..., ge=12, le=360, description="Loan term in months")
    DTIRatio: float = Field(..., ge=0.0, le=2.0, description="Debt-to-Income ratio")
    Education: str = Field(..., description="Highest education level")
    EmploymentType: str = Field(..., description="Employment classification")
    MaritalStatus: str = Field(..., description="Marital status")
    HasMortgage: str = Field(..., description="'Yes' or 'No'")
    HasDependents: str = Field(..., description="'Yes' or 'No'")
    LoanPurpose: str = Field(..., description="Purpose of loan")
    HasCoSigner: str = Field(..., description="'Yes' or 'No'")

@router.post("/predict")
async def predict_loan_risk(application: LoanApplicationInput):
    try:
        result = prediction_service.predict(application.model_dump())
        return result
    except Exception as e:
        logger.error("Inference execution error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while evaluating the credit risk application."
        )
