"""
Verification Script for Vercel Entrypoint (api/index.py)
Tests all endpoints against api.index:app using TestClient and simulated requests.
"""

import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)

def test_endpoints():
    print("--- 1. Testing Health Endpoints ---")
    res1 = client.get("/api/health")
    assert res1.status_code == 200, f"/api/health failed: {res1.status_code} {res1.text}"
    assert res1.json() == {"status": "ok"}, f"Unexpected health response: {res1.json()}"
    print("  [PASS] GET /api/health ->", res1.json())

    res2 = client.get("/health")
    assert res2.status_code == 200, f"/health failed: {res2.status_code} {res2.text}"
    assert res2.json() == {"status": "ok"}
    print("  [PASS] GET /health ->", res2.json())

    print("\n--- 2. Testing Model Details Endpoints ---")
    res = client.get("/api/model-details")
    assert res.status_code == 200, f"/api/model-details failed: {res.status_code}"
    data = res.json()
    assert "architecture" in data, "architecture missing in model details"
    print(f"  [PASS] GET /api/model-details -> Architecture: {data['architecture']}")

    # Also test stripped prefix
    res_stripped = client.get("/model-details")
    assert res_stripped.status_code == 200, "/model-details failed"
    print("  [PASS] GET /model-details (stripped prefix) -> 200 OK")

    print("\n--- 3. Testing Metrics Endpoints ---")
    res = client.get("/api/metrics")
    assert res.status_code == 200, f"/api/metrics failed: {res.status_code}"
    metrics_data = res.json()
    assert "model_comparison" in metrics_data, "model_comparison missing"
    assert "confusion_matrix" in metrics_data, "confusion_matrix missing"
    print(f"  [PASS] GET /api/metrics -> {len(metrics_data['model_comparison'])} models compared, CM: {metrics_data['confusion_matrix']}")

    res_stripped = client.get("/metrics")
    assert res_stripped.status_code == 200
    print("  [PASS] GET /metrics (stripped prefix) -> 200 OK")

    print("\n--- 4. Testing Insights Endpoints ---")
    res = client.get("/api/insights")
    assert res.status_code == 200, f"/api/insights failed: {res.status_code}"
    insights_data = res.json()
    assert insights_data["total_records"] == 255347, "Incorrect total records"
    print(f"  [PASS] GET /api/insights -> Total records: {insights_data['total_records']}, Imbalance: {insights_data['class_distribution']['imbalance_ratio']}")

    res_stripped = client.get("/insights")
    assert res_stripped.status_code == 200
    print("  [PASS] GET /insights (stripped prefix) -> 200 OK")

    print("\n--- 5. Testing Prediction Endpoints ---")
    low_risk_app = {
        "Age": 45,
        "Income": 120000.0,
        "LoanAmount": 15000.0,
        "CreditScore": 780,
        "MonthsEmployed": 80,
        "NumCreditLines": 4,
        "InterestRate": 5.5,
        "LoanTerm": 36,
        "DTIRatio": 0.20,
        "Education": "Master's",
        "EmploymentType": "Full-time",
        "MaritalStatus": "Married",
        "HasMortgage": "Yes",
        "HasDependents": "Yes",
        "LoanPurpose": "Home",
        "HasCoSigner": "Yes"
    }

    res = client.post("/api/predict", json=low_risk_app)
    assert res.status_code == 200, f"/api/predict failed: {res.status_code} {res.text}"
    pred_data = res.json()
    assert pred_data["status"] == "success"
    assert "default_probability" in pred_data
    assert "risk_band" in pred_data
    assert "risk_factors" in pred_data
    print(f"  [PASS] POST /api/predict (Low Risk) -> {pred_data['risk_level']} ({pred_data['default_probability_percent']}) - Model: {pred_data['model_name']}")

    high_risk_app = {
        "Age": 22,
        "Income": 22000.0,
        "LoanAmount": 45000.0,
        "CreditScore": 480,
        "MonthsEmployed": 6,
        "NumCreditLines": 1,
        "InterestRate": 24.5,
        "LoanTerm": 60,
        "DTIRatio": 0.85,
        "Education": "High School",
        "EmploymentType": "Unemployed",
        "MaritalStatus": "Single",
        "HasMortgage": "No",
        "HasDependents": "No",
        "LoanPurpose": "Other",
        "HasCoSigner": "No"
    }

    res2 = client.post("/predict", json=high_risk_app)
    assert res2.status_code == 200, f"/predict failed: {res2.status_code} {res2.text}"
    pred_data2 = res2.json()
    assert pred_data2["risk_band"] == "High"
    print(f"  [PASS] POST /predict (High Risk, stripped prefix) -> {pred_data2['risk_level']} ({pred_data2['default_probability_percent']}) - Factors: {pred_data2['risk_factors'][:2]}")

    print("\n=======================================================")
    print("ALL VERCEL ENTRY POINT API TESTS PASSED SUCCESSFULLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_endpoints()
