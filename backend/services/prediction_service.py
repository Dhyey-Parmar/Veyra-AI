import pandas as pd
from backend.services.model_service import ModelService

class PredictionService:
    def __init__(self):
        self.model_service = ModelService.get_instance()

    def predict(self, data_dict: dict) -> dict:
        pipeline = self.model_service.get_pipeline()
        if pipeline is None:
            raise RuntimeError("ML Pipeline model is not loaded. Please ensure models/best_pipeline.pkl exists.")

        # Build DataFrame with expected schema
        input_df = pd.DataFrame([{
            "Age": float(data_dict["Age"]),
            "Income": float(data_dict["Income"]),
            "LoanAmount": float(data_dict["LoanAmount"]),
            "CreditScore": float(data_dict["CreditScore"]),
            "MonthsEmployed": float(data_dict["MonthsEmployed"]),
            "NumCreditLines": float(data_dict["NumCreditLines"]),
            "InterestRate": float(data_dict["InterestRate"]),
            "LoanTerm": float(data_dict["LoanTerm"]),
            "DTIRatio": float(data_dict["DTIRatio"]),
            "Education": str(data_dict["Education"]),
            "EmploymentType": str(data_dict["EmploymentType"]),
            "MaritalStatus": str(data_dict["MaritalStatus"]),
            "HasMortgage": str(data_dict["HasMortgage"]),
            "HasDependents": str(data_dict["HasDependents"]),
            "LoanPurpose": str(data_dict["LoanPurpose"]),
            "HasCoSigner": str(data_dict["HasCoSigner"])
        }])

        proba = float(pipeline.predict_proba(input_df)[0][1])
        prediction = 1 if proba >= 0.50 else 0

        from datetime import datetime, timezone

        if proba < 0.30:
            risk_band = "Low"
            risk_level = "Low Risk"
            risk_color = "#10B981"
            message = "Low probability of default. Applicant meets prime credit risk profile."
        elif proba < 0.60:
            risk_band = "Moderate"
            risk_level = "Moderate Risk"
            risk_color = "#F59E0B"
            message = "Moderate probability of default. Secondary review or additional collateral verification suggested."
        else:
            risk_band = "High"
            risk_level = "High Risk"
            risk_color = "#EF4444"
            message = "Higher probability of default. Enhanced credit scrutiny, lower loan amount, or co-signer recommended."

        # Dynamic risk factors
        risk_factors = []
        dti = float(data_dict.get("DTIRatio", 0))
        credit_score = float(data_dict.get("CreditScore", 700))
        interest_rate = float(data_dict.get("InterestRate", 10))
        income = float(data_dict.get("Income", 50000))
        loan_amt = float(data_dict.get("LoanAmount", 20000))

        if dti > 0.50:
            risk_factors.append(f"Elevated Debt-to-Income ratio ({dti:.2f})")
        if credit_score < 580:
            risk_factors.append(f"Subprime credit score ({int(credit_score)})")
        if interest_rate > 15.0:
            risk_factors.append(f"High loan interest rate ({interest_rate:.1f}%)")
        if loan_amt > income * 2.5:
            risk_factors.append(f"High loan-to-income leverage ({loan_amt/max(income, 1):.1f}x annual income)")
        if data_dict.get("HasCoSigner") == "No":
            risk_factors.append("Absence of a co-signer on application")
        if data_dict.get("EmploymentType") == "Unemployed":
            risk_factors.append("Applicant currently unemployed")

        if not risk_factors:
            risk_factors.append("Applicant metrics are aligned with standard prime underwriting criteria.")

        return {
            "status": "success",
            "prediction": prediction,
            "prediction_label": "Default" if prediction == 1 else "Non-Default",
            "default_probability": round(proba, 4),
            "default_probability_percent": f"{proba * 100:.1f}%",
            "risk_band": risk_band,
            "risk_level": risk_level,
            "risk_color": risk_color,
            "message": message,
            "risk_factors": risk_factors,
            "model_name": "HistGradientBoostingClassifier",
            "model_version": "1.0.0",
            "predicted_at": datetime.now(timezone.utc).isoformat(),
            "applicant_summary": {
                "Age": data_dict["Age"],
                "Income": f"${float(data_dict['Income']):,.0f}",
                "LoanAmount": f"${float(data_dict['LoanAmount']):,.0f}",
                "CreditScore": data_dict["CreditScore"],
                "DTIRatio": data_dict["DTIRatio"]
            }
        }

