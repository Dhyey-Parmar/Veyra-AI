import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("--- Testing FastAPI Endpoints ---")

# 1. Health
res = client.get("/api/health")
assert res.status_code == 200
assert res.json() == {"status": "ok"}
print("[PASS] GET /api/health:", res.status_code, res.json())

# 2. Model Details
res = client.get("/api/model-details")
assert res.status_code == 200
data = res.json()
print("[PASS] GET /api/model-details:", res.status_code, data.get("architecture"))

# 3. Metrics
res = client.get("/api/metrics")
assert res.status_code == 200
data = res.json()
assert "model_comparison" in data
assert "cross_validation" in data
assert "feature_importance" in data
assert "threshold_analysis" in data
assert "confusion_matrix" in data
assert "roc_curve" in data
assert "pr_curve" in data
assert "test_metrics" in data
print("[PASS] GET /api/metrics:", res.status_code, f"{len(data['model_comparison'])} models compared, CM: {data['confusion_matrix']}")

# 4. Insights
res = client.get("/api/insights")
assert res.status_code == 200
data = res.json()
assert data["total_records"] == 255347
assert "default_rate_by_score" in data
assert "risk_distribution" in data
print("[PASS] GET /api/insights:", res.status_code, f"{data['total_records']} records, {len(data['default_rate_by_score'])} score buckets")

# 5. Predict - Low Risk Profile
payload_low = {
    "Age": 45, "Income": 95000, "LoanAmount": 18000, "CreditScore": 780,
    "MonthsEmployed": 96, "NumCreditLines": 4, "InterestRate": 5.5, "LoanTerm": 36,
    "DTIRatio": 0.22, "Education": "Master's", "EmploymentType": "Full-time",
    "MaritalStatus": "Married", "HasMortgage": "No", "HasDependents": "Yes",
    "LoanPurpose": "Home", "HasCoSigner": "Yes"
}
res = client.post("/api/predict", json=payload_low)
assert res.status_code == 200
pred_low = res.json()
assert pred_low["risk_level"] == "Low Risk"
assert pred_low["model_name"] == "HistGradientBoostingClassifier"
assert "predicted_at" in pred_low
print(f"[PASS] POST /api/predict (Low Risk): {pred_low['risk_level']} - {pred_low['default_probability_percent']} by {pred_low['model_name']}")

# 6. Predict - High Risk Profile
payload_high = {
    "Age": 24, "Income": 22000, "LoanAmount": 45000, "CreditScore": 490,
    "MonthsEmployed": 8, "NumCreditLines": 7, "InterestRate": 21.5, "LoanTerm": 60,
    "DTIRatio": 0.72, "Education": "High School", "EmploymentType": "Unemployed",
    "MaritalStatus": "Divorced", "HasMortgage": "No", "HasDependents": "Yes",
    "LoanPurpose": "Business", "HasCoSigner": "No"
}
res = client.post("/api/predict", json=payload_high)
assert res.status_code == 200
pred_high = res.json()
assert pred_high["risk_level"] == "High Risk"
assert "risk_band" in pred_high
print(f"[PASS] POST /api/predict (High Risk): {pred_high['risk_level']} - {pred_high['default_probability_percent']}")


# 7. Static Plot
res = client.get("/api/plots/roc_curve.png")
assert res.status_code == 200
print(f"[PASS] GET /api/plots/roc_curve.png: {res.status_code} ({len(res.content)} bytes)")

print("\nALL FASTAPI ENDPOINTS VERIFIED SUCCESSFULLY!")
