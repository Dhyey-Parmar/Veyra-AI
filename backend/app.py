import os
import json
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

# Basic CORS headers for all responses
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# Handle CORS preflight OPTIONS requests
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return jsonify({"status": "ok"}), 200

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "artifacts")
PLOTS_DIR = os.path.join(ARTIFACTS_DIR, "plots")
METRICS_DIR = os.path.join(ARTIFACTS_DIR, "metrics")

# Lazy-loaded model and metadata
pipeline = None
metadata = None

def get_pipeline():
    global pipeline
    if pipeline is None:
        pipeline_path = os.path.join(MODELS_DIR, "best_pipeline.pkl")
        if os.path.exists(pipeline_path):
            pipeline = joblib.load(pipeline_path)
    return pipeline

def get_metadata():
    global metadata
    if metadata is None:
        meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                metadata = json.load(f)
    return metadata

# ----------------------------------------------------------------
# 1. Health Check Endpoint
# ----------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    pipe = get_pipeline()
    meta = get_metadata()
    return jsonify({
        "status": "healthy",
        "service": "Loan Default Prediction REST API",
        "model_loaded": pipe is not None,
        "model_architecture": meta.get("architecture") if meta else "Not yet loaded",
        "version": "1.0.0"
    }), 200

# ----------------------------------------------------------------
# 2. Prediction Endpoint
# ----------------------------------------------------------------
@app.route('/api/predict', methods=['POST'])
def predict():
    pipe = get_pipeline()
    if pipe is None:
        return jsonify({"error": "ML Pipeline model is not available. Please run train_pipeline.py first."}), 503

    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({"error": "Invalid request: Missing JSON body."}), 400

    # Required fields with default fallbacks if missing
    expected_numerical = [
        "Age", "Income", "LoanAmount", "CreditScore",
        "MonthsEmployed", "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio"
    ]
    expected_categorical = [
        "Education", "EmploymentType", "MaritalStatus",
        "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner"
    ]

    # Validate and build input dict
    try:
        input_data = {}
        for col in expected_numerical:
            if col not in payload:
                return jsonify({"error": f"Missing numerical feature: '{col}'"}), 400
            input_data[col] = [float(payload[col])]

        for col in expected_categorical:
            if col not in payload:
                return jsonify({"error": f"Missing categorical feature: '{col}'"}), 400
            input_data[col] = [str(payload[col])]

        input_df = pd.DataFrame(input_data)
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Input formatting error: {str(e)}"}), 400

    # Perform inference
    try:
        proba = pipe.predict_proba(input_df)[0][1]
        default_probability = float(proba)
        # Default decision threshold (0.50)
        prediction = 1 if default_probability >= 0.50 else 0

        # Determine risk tier
        if default_probability < 0.30:
            risk_tier = "Low Risk"
            risk_color = "#10B981" # Green
            recommendation = "Approved: Applicant exhibits low likelihood of loan default."
        elif default_probability < 0.60:
            risk_tier = "Moderate Risk"
            risk_color = "#F59E0B" # Amber
            recommendation = "Review Required: Applicant demonstrates moderate default probability. Consider verifying collateral or adjusting loan terms."
        else:
            risk_tier = "High Risk"
            risk_color = "#EF4444" # Red
            recommendation = "High Risk of Default: Enhanced credit scrutiny or co-signer recommended before approval."

        # Compute dynamic risk factor insights based on applicant's financial ratios
        risk_factors = []
        dti = float(payload.get("DTIRatio", 0))
        credit_score = float(payload.get("CreditScore", 700))
        interest_rate = float(payload.get("InterestRate", 10))
        income = float(payload.get("Income", 50000))
        loan_amt = float(payload.get("LoanAmount", 20000))

        if dti > 0.5:
            risk_factors.append(f"Elevated Debt-to-Income Ratio ({dti:.2f})")
        if credit_score < 580:
            risk_factors.append(f"Subprime Credit Score ({int(credit_score)})")
        if interest_rate > 15.0:
            risk_factors.append(f"High Interest Rate ({interest_rate:.1f}%)")
        if loan_amt > income * 2.5:
            risk_factors.append(f"High Loan-to-Income Ratio ({loan_amt/max(income, 1):.1f}x income)")
        if payload.get("HasCoSigner") == "No":
            risk_factors.append("No Co-Signer present")
        if payload.get("EmploymentType") == "Unemployed":
            risk_factors.append("Applicant currently unemployed")

        if not risk_factors:
            risk_factors.append("Applicant metrics are well within safe underwriting guidelines.")

        return jsonify({
            "status": "success",
            "prediction": prediction,
            "prediction_label": "Default" if prediction == 1 else "Non-Default",
            "default_probability": round(default_probability, 4),
            "default_probability_percent": f"{default_probability * 100:.2f}%",
            "risk_tier": risk_tier,
            "risk_color": risk_color,
            "recommendation": recommendation,
            "risk_factors": risk_factors,
            "applicant_summary": {
                "Age": payload.get("Age"),
                "Income": f"${float(payload.get('Income', 0)):,.0f}",
                "LoanAmount": f"${float(payload.get('LoanAmount', 0)):,.0f}",
                "CreditScore": payload.get("CreditScore"),
                "DTIRatio": payload.get("DTIRatio")
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Inference error: {str(e)}"}), 500

# ----------------------------------------------------------------
# 3. Model Details Endpoint
# ----------------------------------------------------------------
@app.route('/api/model-details', methods=['GET'])
def model_details():
    meta = get_metadata()
    if not meta:
        return jsonify({"error": "Model metadata not found. Please train the model."}), 404
    return jsonify(meta), 200

# ----------------------------------------------------------------
# 4. Metrics & Evaluation Endpoint
# ----------------------------------------------------------------
@app.route('/api/metrics', methods=['GET'])
def metrics():
    res = {}
    
    # Model comparison CSV
    comp_path = os.path.join(METRICS_DIR, "model_comparison.csv")
    if os.path.exists(comp_path):
        res["model_comparison"] = pd.read_csv(comp_path).to_dict(orient="records")
        
    # Cross validation CSV
    cv_path = os.path.join(METRICS_DIR, "cross_validation.csv")
    if os.path.exists(cv_path):
        res["cross_validation"] = pd.read_csv(cv_path).to_dict(orient="records")
        
    # Feature importance CSV
    feat_path = os.path.join(METRICS_DIR, "feature_importance.csv")
    if os.path.exists(feat_path):
        res["feature_importance"] = pd.read_csv(feat_path).to_dict(orient="records")

    # Threshold analysis CSV
    th_path = os.path.join(METRICS_DIR, "threshold_analysis.csv")
    if os.path.exists(th_path):
        res["threshold_analysis"] = pd.read_csv(th_path).to_dict(orient="records")

    return jsonify(res), 200

# ----------------------------------------------------------------
# 5. Dataset Insights / EDA Endpoint
# ----------------------------------------------------------------
@app.route('/api/insights', methods=['GET'])
def insights():
    meta = get_metadata()
    data_path = os.path.join(PROJECT_ROOT, "DataSet", "Loan_default.csv")
    
    # Pre-calculated summary statistics to return quickly without full dataset scan
    eda_summary = {
        "dataset_name": "Loan Default Dataset (Banking)",
        "total_records": 255347,
        "features_count": 18,
        "target": "Default",
        "class_balance": {
            "non_default_count": 225694,
            "default_count": 29653,
            "non_default_percentage": 88.38,
            "default_percentage": 11.61,
            "imbalance_ratio": "7.61 : 1"
        },
        "key_feature_ranges": {
            "Age": {"min": 18, "max": 69, "mean": 43.5},
            "Income": {"min": 15000, "max": 149999, "mean": 82499},
            "LoanAmount": {"min": 5000, "max": 249999, "mean": 127578},
            "CreditScore": {"min": 300, "max": 849, "mean": 574.3},
            "InterestRate": {"min": 2.0, "max": 25.0, "mean": 13.5},
            "DTIRatio": {"min": 0.1, "max": 0.9, "mean": 0.50}
        },
        "categorical_distributions": {
            "Education": {"Bachelor's": 64366, "High School": 63983, "Master's": 63541, "PhD": 63457},
            "EmploymentType": {"Full-time": 64154, "Part-time": 63811, "Self-employed": 63708, "Unemployed": 63674},
            "MaritalStatus": {"Divorced": 85140, "Married": 85302, "Single": 84905},
            "LoanPurpose": {"Auto": 51104, "Business": 51298, "Education": 50904, "Home": 51286, "Other": 50755}
        },
        "key_findings": [
            "High class imbalance (88.4% Non-Default vs 11.6% Default) requires class-weighted loss and threshold calibration.",
            "Higher Interest Rates and Debt-to-Income (DTI) ratios have the strongest positive correlation with default risk.",
            "Higher Credit Scores and longer Employment durations significantly mitigate default probability.",
            "Having a co-signer reduces observed default incidence across all income tiers."
        ]
    }
    return jsonify(eda_summary), 200

# ----------------------------------------------------------------
# 6. Serve Visualizations
# ----------------------------------------------------------------
@app.route('/api/plots/<path:filename>', methods=['GET'])
def get_plot(filename):
    return send_from_directory(PLOTS_DIR, filename)

if __name__ == '__main__':
    print("Starting Flask REST API server on http://localhost:5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
