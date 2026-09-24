import os
import json
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    HistGradientBoostingClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier
)
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve
)
from sklearn.inspection import permutation_importance

from scratch_logistic_regression import ScratchLogisticRegression

# Set styling for plots
sns.set_theme(style="whitegrid", palette="deep")
plt.rcParams.update({'font.sans-serif': 'DejaVu Sans', 'font.size': 11})

# Define directories
MODELS_DIR = "models"
ARTIFACTS_PLOTS_DIR = os.path.join("artifacts", "plots")
ARTIFACTS_METRICS_DIR = os.path.join("artifacts", "metrics")

for d in [MODELS_DIR, ARTIFACTS_PLOTS_DIR, ARTIFACTS_METRICS_DIR]:
    os.makedirs(d, exist_ok=True)

print("=" * 70)
print("LOAN DEFAULT PREDICTION SYSTEM: END-TO-END ML PIPELINE")
print("=" * 70)

# -------------------------------------------------------------
# 1. LOAD & EXPLORE DATASET
# -------------------------------------------------------------
data_path = os.path.join("DataSet", "Loan_default.csv")
print(f"\n[1/10] Loading dataset from: {data_path}...")
df = pd.read_csv(data_path)
print(f"Dataset Shape: {df.shape[0]:,} rows, {df.shape[1]} columns")

# Target and feature definitions
target_col = "Default"
id_col = "LoanID"

if id_col in df.columns:
    X_raw = df.drop(columns=[id_col, target_col])
else:
    X_raw = df.drop(columns=[target_col])
y = df[target_col].values

# Calculate actual class balance
n_total = len(y)
n_default = int(np.sum(y == 1))
n_non_default = int(np.sum(y == 0))
default_rate = (n_default / n_total) * 100
non_default_rate = (n_non_default / n_total) * 100

print("\n--- Actual Class Distribution ---")
print(f"Non-default (0): {n_non_default:,} ({non_default_rate:.2f}%)")
print(f"Default (1):     {n_default:,} ({default_rate:.2f}%)")
print(f"Class Imbalance Ratio: ~{non_default_rate/default_rate:.2f} : 1")

# Identify numerical and categorical feature columns
numerical_cols = [
    "Age", "Income", "LoanAmount", "CreditScore",
    "MonthsEmployed", "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio"
]
categorical_cols = [
    "Education", "EmploymentType", "MaritalStatus",
    "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner"
]

print(f"\nNumerical features ({len(numerical_cols)}): {numerical_cols}")
print(f"Categorical features ({len(categorical_cols)}): {categorical_cols}")

# -------------------------------------------------------------
# 2. LEAKAGE-SAFE PREPROCESSING PIPELINE & SPLIT
# -------------------------------------------------------------
print("\n[2/10] Constructing Leakage-Safe Preprocessing Pipeline...")

num_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

cat_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(drop='first', handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', num_transformer, numerical_cols),
        ('cat', cat_transformer, categorical_cols)
    ],
    remainder='drop'
)

# Stratified 80/20 train/test split
X_train_raw, X_test_raw, y_train, y_test = train_test_split(
    X_raw, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Training set: {X_train_raw.shape[0]:,} samples")
print(f"Testing set:  {X_test_raw.shape[0]:,} samples")

# Fit preprocessor on training data only
preprocessor.fit(X_train_raw)
joblib.dump(preprocessor, os.path.join(MODELS_DIR, "preprocessor.pkl"))
print(f"Saved: {os.path.join(MODELS_DIR, 'preprocessor.pkl')}")

# Extract transformed feature names
cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
cat_feature_names = list(cat_encoder.get_feature_names_out(categorical_cols))
all_feature_names = numerical_cols + cat_feature_names

X_train_proc = preprocessor.transform(X_train_raw)
X_test_proc = preprocessor.transform(X_test_raw)
print(f"Total encoded features: {len(all_feature_names)}")

# -------------------------------------------------------------
# 3. SCRATCH LOGISTIC REGRESSION IMPLEMENTATION & BENCHMARK
# -------------------------------------------------------------
print("\n[3/10] Training Scratch Logistic Regression (Week 3 Mandatory Constraint)...")
# Train Scratch Logistic Regression on scaled data
scratch_lr = ScratchLogisticRegression(learning_rate=0.08, n_iterations=800, l2_reg=0.001, random_state=42)
t0 = time.time()
scratch_lr.fit(X_train_proc, y_train, verbose=False)
scratch_time = time.time() - t0
print(f"Scratch model trained in {scratch_time:.2f}s across 800 epochs.")

# Save loss convergence plot
plt.figure(figsize=(8, 5))
plt.plot(scratch_lr.loss_history, color="#2563EB", lw=2, label="BCE Loss (Binary Cross Entropy)")
plt.title("Scratch Logistic Regression: Training Loss Convergence", fontsize=13, fontweight="bold", pad=12)
plt.xlabel("Epoch", fontsize=11)
plt.ylabel("Binary Cross-Entropy Loss", fontsize=11)
plt.grid(True, linestyle="--", alpha=0.6)
plt.legend(loc="upper right")
plt.tight_layout()
scratch_loss_path = os.path.join(ARTIFACTS_PLOTS_DIR, "scratch_logistic_loss.png")
plt.savefig(scratch_loss_path, dpi=300)
plt.close()
print(f"Saved plot: {scratch_loss_path}")

# Benchmark Scratch vs Scikit-Learn Logistic Regression
scratch_preds = scratch_lr.predict(X_test_proc)
scratch_probas = scratch_lr.predict_proba(X_test_proc)[:, 1]

# Baseline Scikit-Learn Logistic Regression
sk_lr = LogisticRegression(max_iter=1000, random_state=42)
sk_lr.fit(X_train_proc, y_train)
sk_preds = sk_lr.predict(X_test_proc)
sk_probas = sk_lr.predict_proba(X_test_proc)[:, 1]

print("\n--- Scratch vs Scikit-Learn Logistic Regression Benchmark ---")
print(f"Metric                Scratch LR      Scikit-Learn LR")
print(f"Accuracy:             {accuracy_score(y_test, scratch_preds):.4f}          {accuracy_score(y_test, sk_preds):.4f}")
print(f"Precision:            {precision_score(y_test, scratch_preds, zero_division=0):.4f}          {precision_score(y_test, sk_preds, zero_division=0):.4f}")
print(f"Recall:               {recall_score(y_test, scratch_preds, zero_division=0):.4f}          {recall_score(y_test, sk_preds, zero_division=0):.4f}")
print(f"F1 Score:             {f1_score(y_test, scratch_preds, zero_division=0):.4f}          {f1_score(y_test, sk_preds, zero_division=0):.4f}")
print(f"ROC-AUC Score:        {roc_auc_score(y_test, scratch_probas):.4f}          {roc_auc_score(y_test, sk_probas):.4f}")
print(f"PR-AUC Score:         {average_precision_score(y_test, scratch_probas):.4f}          {average_precision_score(y_test, sk_probas):.4f}")

# -------------------------------------------------------------
# 4. ADVANCED MODEL BENCHMARKING (WEEKS 4 & 5)
# -------------------------------------------------------------
print("\n[4/10] Training & Benchmarking Advanced Models...")

# Define candidate models
models = {
    "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, random_state=42),
    "Balanced Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
    "HistGradientBoosting (Balanced)": HistGradientBoostingClassifier(class_weight='balanced', random_state=42, max_iter=150),
    "Random Forest (Balanced)": RandomForestClassifier(n_estimators=100, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1),
    "AdaBoost": AdaBoostClassifier(n_estimators=100, random_state=42),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
}

# -------------------------------------------------------------
# 5. STRATIFIED 5-FOLD CROSS-VALIDATION
# -------------------------------------------------------------
print("\n[5/10] Running 5-Fold Stratified Cross-Validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results_list = []

# To make CV fast on 204,277 training rows without sacrificing statistical validity,
# we use a representative stratified sample of 40,000 rows for the 5-fold CV comparisons
cv_sample_idx, _ = train_test_split(np.arange(len(y_train)), train_size=40000, stratify=y_train, random_state=42)
X_cv_sample = X_train_proc[cv_sample_idx]
y_cv_sample = y_train[cv_sample_idx]

for name, model in models.items():
    print(f"  Evaluating {name} with 5-Fold CV...")
    scoring = ['f1', 'roc_auc', 'average_precision']
    scores = cross_validate(model, X_cv_sample, y_cv_sample, cv=cv, scoring=scoring, n_jobs=-1)
    
    cv_results_list.append({
        "Model": name,
        "F1_Mean": scores['test_f1'].mean(),
        "F1_Std": scores['test_f1'].std(),
        "ROC_AUC_Mean": scores['test_roc_auc'].mean(),
        "ROC_AUC_Std": scores['test_roc_auc'].std(),
        "PR_AUC_Mean": scores['test_average_precision'].mean(),
        "PR_AUC_Std": scores['test_average_precision'].std(),
    })

df_cv = pd.DataFrame(cv_results_list)
cv_csv_path = os.path.join(ARTIFACTS_METRICS_DIR, "cross_validation.csv")
df_cv.to_csv(cv_csv_path, index=False)
print(f"Saved: {cv_csv_path}")
print(df_cv[["Model", "ROC_AUC_Mean", "F1_Mean", "PR_AUC_Mean"]].to_string(index=False))

# -------------------------------------------------------------
# 6. TRAIN ON FULL TRAINING SET & EVALUATE ON TEST SET
# -------------------------------------------------------------
print("\n[6/10] Fitting Models on Full Training Set & Testing...")
comparison_list = []
trained_models = {}
probas_dict = {}
preds_dict = {}

for name, model in models.items():
    print(f"  Fitting {name} on {len(y_train):,} samples...")
    t_start = time.time()
    
    # For GradientBoostingClassifier, fitting on 204k samples with 100 trees can take 20+ mins.
    # Train on 60,000 stratified samples so it completes promptly while maintaining high precision.
    if name == "Gradient Boosting":
        gb_idx, _ = train_test_split(np.arange(len(y_train)), train_size=60000, stratify=y_train, random_state=42)
        model.fit(X_train_proc[gb_idx], y_train[gb_idx])
    else:
        model.fit(X_train_proc, y_train)
        
    fit_duration = time.time() - t_start
    trained_models[name] = model
    
    y_pred = model.predict(X_test_proc)
    y_proba = model.predict_proba(X_test_proc)[:, 1]
    
    probas_dict[name] = y_proba
    preds_dict[name] = y_pred
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)
    pr_auc = average_precision_score(y_test, y_proba)
    
    comparison_list.append({
        "Model": name,
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1_Score": f1,
        "ROC_AUC": roc_auc,
        "PR_AUC": pr_auc,
        "Train_Time_Sec": round(fit_duration, 2)
    })

# Also add Scratch Logistic Regression to comparison
scratch_acc = accuracy_score(y_test, scratch_preds)
scratch_prec = precision_score(y_test, scratch_preds, zero_division=0)
scratch_rec = recall_score(y_test, scratch_preds, zero_division=0)
scratch_f1 = f1_score(y_test, scratch_preds, zero_division=0)
scratch_roc = roc_auc_score(y_test, scratch_probas)
scratch_pr = average_precision_score(y_test, scratch_probas)

comparison_list.append({
    "Model": "Scratch Logistic Regression",
    "Accuracy": scratch_acc,
    "Precision": scratch_prec,
    "Recall": scratch_rec,
    "F1_Score": scratch_f1,
    "ROC_AUC": scratch_roc,
    "PR_AUC": scratch_pr,
    "Train_Time_Sec": round(scratch_time, 2)
})

df_comparison = pd.DataFrame(comparison_list)
comp_csv_path = os.path.join(ARTIFACTS_METRICS_DIR, "model_comparison.csv")
df_comparison.to_csv(comp_csv_path, index=False)
print(f"Saved: {comp_csv_path}")
print(df_comparison[["Model", "Accuracy", "F1_Score", "ROC_AUC", "PR_AUC"]].to_string(index=False))

# -------------------------------------------------------------
# 7. THRESHOLD ANALYSIS (CLASS IMBALANCE HANDLING)
# -------------------------------------------------------------
print("\n[7/10] Performing Classification Threshold Analysis...")
# Use HistGradientBoosting (Balanced) as the leading balanced model
best_balanced_name = "HistGradientBoosting (Balanced)"
best_probas = probas_dict[best_balanced_name]

thresholds = [0.30, 0.40, 0.50, 0.60, 0.70]
threshold_list = []

for th in thresholds:
    th_preds = (best_probas >= th).astype(int)
    threshold_list.append({
        "Threshold": th,
        "Precision": precision_score(y_test, th_preds, zero_division=0),
        "Recall": recall_score(y_test, th_preds, zero_division=0),
        "F1_Score": f1_score(y_test, th_preds, zero_division=0),
        "Predicted_Defaults": int(np.sum(th_preds)),
        "Actual_Defaults": int(np.sum(y_test))
    })

df_threshold = pd.DataFrame(threshold_list)
th_csv_path = os.path.join(ARTIFACTS_METRICS_DIR, "threshold_analysis.csv")
df_threshold.to_csv(th_csv_path, index=False)
print(f"Saved: {th_csv_path}")
print(df_threshold.to_string(index=False))

# -------------------------------------------------------------
# 8. HYPERPARAMETER TUNING
# -------------------------------------------------------------
print("\n[8/10] Hyperparameter Tuning on Top Candidate...")
# Tune HistGradientBoostingClassifier
param_dist = {
    'learning_rate': [0.03, 0.05, 0.08, 0.1],
    'max_iter': [100, 150, 200],
    'max_leaf_nodes': [20, 31, 40],
    'min_samples_leaf': [20, 50, 100],
    'l2_regularization': [0.0, 0.1, 1.0]
}

hgb_base = HistGradientBoostingClassifier(class_weight='balanced', random_state=42)
rs = RandomizedSearchCV(
    estimator=hgb_base,
    param_distributions=param_dist,
    n_iter=6,
    cv=3,
    scoring='roc_auc',
    random_state=42,
    n_jobs=-1
)
rs.fit(X_train_proc, y_train)

best_hgb = rs.best_estimator_
print(f"Best Hyperparameters: {rs.best_params_}")
print(f"Best CV ROC-AUC Score: {rs.best_score_:.4f}")

# Final test evaluation of tuned model
tuned_preds = best_hgb.predict(X_test_proc)
tuned_probas = best_hgb.predict_proba(X_test_proc)[:, 1]
tuned_roc = roc_auc_score(y_test, tuned_probas)
tuned_f1 = f1_score(y_test, tuned_preds)
print(f"Tuned Model Test ROC-AUC: {tuned_roc:.4f}, Test F1: {tuned_f1:.4f}")

# -------------------------------------------------------------
# 9. ASSEMBLE COMPLETE PRODUCTION PIPELINE & EXPORT
# -------------------------------------------------------------
print("\n[9/10] Building and Saving End-to-End Production Pipeline...")
best_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', best_hgb)
])

pipeline_path = os.path.join(MODELS_DIR, "best_pipeline.pkl")
joblib.dump(best_pipeline, pipeline_path)
print(f"Saved: {pipeline_path}")

# Feature importance computation
print("Computing feature importance (Permutation Importance on test sample)...")
sample_eval_idx, _ = train_test_split(np.arange(len(y_test)), train_size=5000, stratify=y_test, random_state=42)
perm_result = permutation_importance(
    best_hgb, X_test_proc[sample_eval_idx], y_test[sample_eval_idx],
    n_repeats=5, random_state=42, scoring='roc_auc', n_jobs=-1
)

feat_imp_df = pd.DataFrame({
    'Feature': all_feature_names,
    'Importance': perm_result.importances_mean,
    'Std': perm_result.importances_std
}).sort_values(by='Importance', ascending=False)

feat_imp_path = os.path.join(ARTIFACTS_METRICS_DIR, "feature_importance.csv")
feat_imp_df.to_csv(feat_imp_path, index=False)
print(f"Saved: {feat_imp_path}")
print(feat_imp_df.head(10).to_string(index=False))

# Save model metadata JSON
metadata = {
    "project_name": "Loan Default Prediction System",
    "architecture": "ColumnTransformer + HistGradientBoostingClassifier",
    "target_column": target_col,
    "class_distribution": {
        "non_default_count": n_non_default,
        "default_count": n_default,
        "default_rate_pct": round(default_rate, 2),
        "non_default_rate_pct": round(non_default_rate, 2)
    },
    "training_samples": len(y_train),
    "testing_samples": len(y_test),
    "numerical_features": numerical_cols,
    "categorical_features": categorical_cols,
    "encoded_features_count": len(all_feature_names),
    "best_hyperparameters": rs.best_params_,
    "test_metrics": {
        "accuracy": round(float(accuracy_score(y_test, tuned_preds)), 4),
        "precision": round(float(precision_score(y_test, tuned_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, tuned_preds, zero_division=0)), 4),
        "f1_score": round(float(tuned_f1), 4),
        "roc_auc": round(float(tuned_roc), 4),
        "pr_auc": round(float(average_precision_score(y_test, tuned_probas)), 4)
    },
    "top_5_features": feat_imp_df['Feature'].head(5).tolist(),
    "created_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
}

metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
with open(metadata_path, "w") as f:
    json.dump(metadata, f, indent=2)
print(f"Saved: {metadata_path}")

# -------------------------------------------------------------
# 10. GENERATE ALL PERFORMANCE VISUALIZATIONS
# -------------------------------------------------------------
print("\n[10/10] Generating Performance Visualizations...")

# 1. ROC Curves for all models
plt.figure(figsize=(9, 6.5))
for name, probas in probas_dict.items():
    fpr, tpr, _ = roc_curve(y_test, probas)
    score = roc_auc_score(y_test, probas)
    plt.plot(fpr, tpr, lw=2, label=f"{name} (AUC = {score:.3f})")

# Add Scratch LR
fpr_s, tpr_s, _ = roc_curve(y_test, scratch_probas)
plt.plot(fpr_s, tpr_s, lw=2, linestyle=":", label=f"Scratch LR (AUC = {scratch_roc:.3f})")

plt.plot([0, 1], [0, 1], color='gray', linestyle='--', label="Chance (AUC = 0.500)")
plt.title("ROC Curves Comparison (Receiver Operating Characteristic)", fontsize=13, fontweight="bold", pad=12)
plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=11)
plt.ylabel("True Positive Rate (Sensitivity / Recall)", fontsize=11)
plt.legend(loc="lower right", frameon=True, fontsize=9.5)
plt.tight_layout()
roc_path = os.path.join(ARTIFACTS_PLOTS_DIR, "roc_curve.png")
plt.savefig(roc_path, dpi=300)
plt.close()
print(f"Saved: {roc_path}")

# 2. Precision-Recall Curves
plt.figure(figsize=(9, 6.5))
for name, probas in probas_dict.items():
    p, r, _ = precision_recall_curve(y_test, probas)
    ap = average_precision_score(y_test, probas)
    plt.plot(r, p, lw=2, label=f"{name} (AP = {ap:.3f})")

# Scratch LR
p_s, r_s, _ = precision_recall_curve(y_test, scratch_probas)
plt.plot(r_s, p_s, lw=2, linestyle=":", label=f"Scratch LR (AP = {scratch_pr:.3f})")

plt.title("Precision-Recall Curves (Critical for Imbalanced Loan Default)", fontsize=13, fontweight="bold", pad=12)
plt.xlabel("Recall", fontsize=11)
plt.ylabel("Precision", fontsize=11)
plt.legend(loc="upper right", frameon=True, fontsize=9.5)
plt.tight_layout()
pr_path = os.path.join(ARTIFACTS_PLOTS_DIR, "precision_recall_curve.png")
plt.savefig(pr_path, dpi=300)
plt.close()
print(f"Saved: {pr_path}")

# 3. Confusion Matrix Heatmap (for Tuned Best Model)
cm = confusion_matrix(y_test, tuned_preds)
plt.figure(figsize=(7, 5.5))
sns.heatmap(
    cm, annot=True, fmt=",d", cmap="Blues", cbar=True,
    xticklabels=["Predicted Non-Default (0)", "Predicted Default (1)"],
    yticklabels=["Actual Non-Default (0)", "Actual Default (1)"]
)
plt.title(f"Confusion Matrix: {metadata['architecture']}", fontsize=12, fontweight="bold", pad=12)
plt.ylabel("Actual Label", fontsize=11)
plt.xlabel("Predicted Label", fontsize=11)
plt.tight_layout()
cm_path = os.path.join(ARTIFACTS_PLOTS_DIR, "confusion_matrix.png")
plt.savefig(cm_path, dpi=300)
plt.close()
print(f"Saved: {cm_path}")

# 4. Feature Importance Bar Chart
plt.figure(figsize=(10, 6))
top_feats = feat_imp_df.head(10).iloc[::-1]
bars = plt.barh(top_feats['Feature'], top_feats['Importance'], color="#2563EB", edgecolor="#1D4ED8", height=0.65)
plt.title("Top 10 Feature Importances (Permutation ROC-AUC Drop)", fontsize=13, fontweight="bold", pad=12)
plt.xlabel("Mean Importance (Decrease in ROC-AUC when shuffled)", fontsize=11)
plt.ylabel("Features", fontsize=11)
plt.grid(True, axis='x', linestyle="--", alpha=0.6)
plt.tight_layout()
feat_plot_path = os.path.join(ARTIFACTS_PLOTS_DIR, "feature_importance.png")
plt.savefig(feat_plot_path, dpi=300)
plt.close()
print(f"Saved: {feat_plot_path}")

# 5. Learning Curve (Training vs Validation Score)
print("Generating Learning Curve...")
train_sizes = [0.1, 0.3, 0.5, 0.7, 1.0]
train_scores = []
val_scores = []

# Quick evaluation on sample for learning curve
lc_sample_idx, _ = train_test_split(np.arange(len(y_train)), train_size=30000, stratify=y_train, random_state=42)
X_lc = X_train_proc[lc_sample_idx]
y_lc = y_train[lc_sample_idx]

for frac in train_sizes:
    n_sub = int(frac * len(y_lc))
    sub_model = HistGradientBoostingClassifier(class_weight='balanced', random_state=42, max_iter=100)
    sub_model.fit(X_lc[:n_sub], y_lc[:n_sub])
    train_scores.append(roc_auc_score(y_lc[:n_sub], sub_model.predict_proba(X_lc[:n_sub])[:, 1]))
    val_scores.append(roc_auc_score(y_test, sub_model.predict_proba(X_test_proc)[:, 1]))

plt.figure(figsize=(8, 5))
plt.plot([int(f * len(y_lc)) for f in train_sizes], train_scores, 'o-', color="#10B981", lw=2, label="Training ROC-AUC")
plt.plot([int(f * len(y_lc)) for f in train_sizes], val_scores, 's-', color="#EF4444", lw=2, label="Validation ROC-AUC (Test Set)")
plt.title("Learning Curve: Model Generalization vs Sample Size", fontsize=13, fontweight="bold", pad=12)
plt.xlabel("Training Samples", fontsize=11)
plt.ylabel("ROC-AUC Score", fontsize=11)
plt.legend(loc="lower right")
plt.grid(True, linestyle="--", alpha=0.6)
plt.tight_layout()
lc_path = os.path.join(ARTIFACTS_PLOTS_DIR, "learning_curve.png")
plt.savefig(lc_path, dpi=300)
plt.close()
print(f"Saved: {lc_path}")

print("\n" + "=" * 70)
print("ML TRAINING & VISUALIZATION PIPELINE COMPLETED SUCCESSFULLY!")
print("=" * 70)
