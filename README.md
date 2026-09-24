# Veyra

## Intelligent Credit Risk Analytics

**See the risk before it becomes a default.**

Veyra is an intelligent credit risk analytics platform designed for underwriting teams, risk officers, and lending institutions. Powered by a production-grade machine learning pipeline trained on 255,000+ loan portfolio records, Veyra evaluates borrower repayment behavior, provides calibrated default probability diagnostics, explains applicant-specific risk factors, and offers comprehensive portfolio intelligence.

---

## 1. System Architecture

Veyra is structured as a decoupled, high-performance architecture:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Veyra Frontend (React + Vite)               │
│                                                             │
│  [Overview]        [Assess]         [Risk Analysis]         │
│  • Density Curve   • 5-Step Stepper • Animated RiskGauge    │
│  • KPI Snapshots   • Form Validation• Dynamic Risk Factors  │
│                                                             │
│  [Intelligence]    [Insights]       [Navigation & Design]   │
│  • Model Benchmark • Outcome Balance• Editorial Light UI    │
│  • ROC / PR Curves • Credit Tiers   • Framer Motion & Recharts
└──────────────────────────────┬──────────────────────────────┘
                               │
                       HTTP / JSON (REST)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI REST API Backend                 │
│                                                             │
│  GET  /api/health        -> Health status                   │
│  POST /api/predict       -> Real-time risk probability & band
│  GET  /api/model-details -> Model architecture & specs      │
│  GET  /api/metrics       -> Test metrics & ROC/PR curves    │
│  GET  /api/insights      -> Dataset distribution & EDA      │
│  GET  /api/plots/<name>  -> Diagnostic evaluation plots     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Trained Scikit-Learn Pipeline               │
│                                                             │
│  Input Features -> ColumnTransformer -> Imputer/Scaler/OHE  │
│  -> Tuned HistGradientBoostingClassifier (Class Balanced)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Capabilities

- **Interactive Underwriting Workflow**: 5-step applicant evaluation stepper covering demographic, financial, credit history, and loan structure parameters.
- **Calibrated Default Probability**: Real-time inference returning precise default probabilities, calibrated risk bands (`Low Risk <30%`, `Moderate Risk 30–60%`, `High Risk ≥60%`), and qualitative risk levels.
- **Prediction-Specific Risk Factors**: Dynamic rule-based factor explanations highlighting key drivers (e.g. debt burden, credit utilization, employment tenure) alongside portfolio-wide permutation feature importance.
- **Model Intelligence Hub**: Out-of-sample benchmarking across 7 candidate models (Logistic Regression, Random Forest, AdaBoost, Gradient Boosting, HistGradientBoosting) with interactive ROC curves, Precision-Recall curves, and confusion matrix.
- **Portfolio Insights**: In-depth empirical analysis of class balance (7.61 : 1 ratio), credit score bucket default elasticities, and feature sensitivity rankings.

---

## 3. Machine Learning Methodology

### Class Imbalance Handling
- **Portfolio Outcome Distribution:**
  - Non-Default ($y = 0$): 225,694 ($88.38\%$)
  - Default ($y = 1$): 29,653 ($11.61\%$)
  - Imbalance Ratio: $\approx 7.61 : 1$
- **Calibration Strategy:**
  - Employed `class_weight='balanced'` in the production `HistGradientBoostingClassifier` to ensure robust recall on minority default events without sacrificing overall discrimination power.
  - Decision threshold calibrated at $0.500$ based on comprehensive precision-recall tradeoff analysis.

### Out-of-Sample Performance Summary (51,070 Test Loans)

| Model Architecture | Accuracy | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HistGradientBoosting (Balanced)** | **0.695** | **0.228** | **0.682** | **0.342** | **0.757** | **0.329** | **Selected Production** |
| Balanced Logistic Regression | 0.676 | 0.220 | 0.700 | 0.334 | 0.753 | 0.311 | Evaluated |
| Random Forest (Balanced) | 0.775 | 0.270 | 0.548 | 0.362 | 0.752 | 0.310 | Evaluated |
| Gradient Boosting | 0.886 | 0.579 | 0.069 | 0.123 | 0.755 | 0.326 | Evaluated |
| AdaBoost | 0.886 | 0.611 | 0.043 | 0.081 | 0.751 | 0.317 | Evaluated |
| Logistic Regression (Baseline) | 0.885 | 0.603 | 0.033 | 0.063 | 0.753 | 0.312 | Evaluated |
| Scratch Logistic Regression | 0.885 | 0.551 | 0.036 | 0.068 | 0.746 | 0.300 | Evaluated |

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1-Click Launch (Runs Both Services)
```bash
python run_all.py
```

### Manual Step-by-Step Launch

#### 1. Start the FastAPI Backend
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
API Documentation available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Start the Veyra Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 3. Run Production Build
```bash
cd frontend
npm run build
```

---

## 5. Repository Structure

```text
ML/
├── DataSet/
│   └── Loan_default.csv             # Primary dataset (255,347 records, 18 variables)
├── models/
│   ├── best_pipeline.pkl            # Final production pipeline (ColumnTransformer + HistGradientBoosting)
│   ├── preprocessor.pkl             # Standalone ColumnTransformer preprocessor
│   └── model_metadata.json          # Architecture specifications & test metrics
├── artifacts/
│   ├── plots/                       # High-resolution diagnostic plots (ROC, PR, CM, etc.)
│   └── metrics/                     # Benchmark evaluation metrics (JSON / CSV)
├── backend/
│   ├── main.py                      # FastAPI application entry point & routing
│   ├── services/                    # Prediction service & model intelligence service
│   └── schemas/                     # Pydantic validation schemas
├── frontend/
│   ├── index.html                   # HTML entry point with Veyra metadata & favicon
│   ├── package.json                 # React 18, Vite 5, React Router, Tailwind dependencies
│   ├── vite.config.ts               # Vite configuration with API proxy to port 8000
│   └── src/
│       ├── main.tsx                 # Application entry point
│       ├── App.tsx                  # React Router configuration & dynamic title manager
│       ├── context/                 # AssessmentContext state management
│       ├── services/                # Typed API client
│       ├── components/              # Navigation, assessment stepper, risk gauge, charts
│       └── pages/                   # Overview, Assess, RiskAnalysis, Intelligence, Insights
├── run_all.py                       # Unified service launcher
├── verify_fastapi_e2e.py            # Automated backend test suite
├── verify_frontend_e2e.py           # Automated frontend browser test suite
└── README.md                        # Project documentation
```

---

## 6. License & Credits

© 2026 Veyra Systems Inc. All rights reserved.
"# Veyra-AI" 
