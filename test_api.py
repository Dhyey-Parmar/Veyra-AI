import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app import app

client = app.test_client()

# 1. Health check
res = client.get('/api/health')
print('GET /api/health:', res.status_code, res.get_json()['status'])

# 2. Model details
res = client.get('/api/model-details')
print('GET /api/model-details:', res.status_code, res.get_json()['architecture'])

# 3. Metrics
res = client.get('/api/metrics')
data = res.get_json()
print('GET /api/metrics:', res.status_code, 'Models in comp:', len(data.get('model_comparison', [])))

# 4. Insights
res = client.get('/api/insights')
print('GET /api/insights:', res.status_code, 'Total records:', res.get_json()['total_records'])

# 5. Predict test (Low Risk)
sample_low = {
    'Age': 45, 'Income': 95000, 'LoanAmount': 18000, 'CreditScore': 780,
    'MonthsEmployed': 96, 'NumCreditLines': 4, 'InterestRate': 5.5, 'LoanTerm': 36,
    'DTIRatio': 0.22, 'Education': "Master's", 'EmploymentType': 'Full-time',
    'MaritalStatus': 'Married', 'HasMortgage': 'No', 'HasDependents': 'Yes',
    'LoanPurpose': 'Home', 'HasCoSigner': 'Yes'
}
res = client.post('/api/predict', data=json.dumps(sample_low), content_type='application/json')
pred_data = res.get_json()
print('POST /api/predict (Low Risk):', res.status_code, pred_data['risk_tier'], pred_data['default_probability_percent'])

# 6. Predict test (High Risk)
sample_high = {
    'Age': 24, 'Income': 22000, 'LoanAmount': 45000, 'CreditScore': 490,
    'MonthsEmployed': 8, 'NumCreditLines': 7, 'InterestRate': 21.5, 'LoanTerm': 60,
    'DTIRatio': 0.72, 'Education': 'High School', 'EmploymentType': 'Unemployed',
    'MaritalStatus': 'Divorced', 'HasMortgage': 'No', 'HasDependents': 'Yes',
    'LoanPurpose': 'Business', 'HasCoSigner': 'No'
}
res = client.post('/api/predict', data=json.dumps(sample_high), content_type='application/json')
pred_data = res.get_json()
print('POST /api/predict (High Risk):', res.status_code, pred_data['risk_tier'], pred_data['default_probability_percent'])

# 7. Check plots endpoint
res = client.get('/api/plots/roc_curve.png')
print('GET /api/plots/roc_curve.png:', res.status_code, len(res.data), 'bytes')
