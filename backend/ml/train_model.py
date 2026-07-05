import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib
import os
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "data", "creditcard.csv")
MODEL_DIR  = os.path.join(BASE_DIR, "saved_model")
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("   FinSentinel — Fraud Detection Model Training")
print("=" * 60)

# ─── 1. Load Data ─────────────────────────────────────────────────────────────
print("\n[1/7] Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"      Dataset shape : {df.shape}")
print(f"      Total transactions : {len(df):,}")
print(f"      Fraud cases        : {df['Class'].sum():,}")
print(f"      Legit cases        : {(df['Class'] == 0).sum():,}")
fraud_pct = (df['Class'].sum() / len(df)) * 100
print(f"      Fraud percentage   : {fraud_pct:.4f}%")

# ─── 2. Prepare Features ──────────────────────────────────────────────────────
print("\n[2/7] Preparing features...")
df['NormAmount'] = StandardScaler().fit_transform(df['Amount'].values.reshape(-1, 1))
df['NormTime']   = StandardScaler().fit_transform(df['Time'].values.reshape(-1, 1))
df = df.drop(['Time', 'Amount'], axis=1)

X = df.drop('Class', axis=1)
y = df['Class']
print(f"      Features : {X.shape[1]}")

# ─── 3. Train / Test Split ────────────────────────────────────────────────────
print("\n[3/7] Splitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"      Training samples : {len(X_train):,}")
print(f"      Testing samples  : {len(X_test):,}")

# ─── 4. Handle Class Imbalance with SMOTE ────────────────────────────────────
print("\n[4/7] Applying SMOTE to balance classes...")
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"      Before SMOTE — Fraud: {y_train.sum():,} | Legit: {(y_train==0).sum():,}")
print(f"      After  SMOTE — Fraud: {y_train_res.sum():,} | Legit: {(y_train_res==0).sum():,}")

# ─── 5. Train XGBoost Model ───────────────────────────────────────────────────
print("\n[5/7] Training XGBoost model...")
model = XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_res, y_train_res)
print("      Model trained successfully!")

# ─── 6. Evaluate Model ────────────────────────────────────────────────────────
print("\n[6/7] Evaluating model...")
y_pred      = model.predict(X_test)
y_pred_prob = model.predict_proba(X_test)[:, 1]

auc       = roc_auc_score(y_test, y_pred_prob)
precision = precision_score(y_test, y_pred)
recall    = recall_score(y_test, y_pred)
f1        = f1_score(y_test, y_pred)

print(f"\n      AUC-ROC Score : {auc:.4f}")
print(f"      Precision     : {precision:.4f}")
print(f"      Recall        : {recall:.4f}")
print(f"      F1 Score      : {f1:.4f}")
print("\n      Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Legit', 'Fraud']))

# ─── 7. Save Everything ───────────────────────────────────────────────────────
print("\n[7/7] Saving model and metrics...")

# Save model
joblib.dump(model, os.path.join(MODEL_DIR, "fraud_model.pkl"))

# Save feature names
feature_names = list(X.columns)
with open(os.path.join(MODEL_DIR, "feature_names.json"), "w") as f:
    json.dump(feature_names, f)

# Save scaler info
scaler_info = {
    "amount_mean": float(df['NormAmount'].mean()),
    "amount_std" : float(df['NormAmount'].std()),
}
with open(os.path.join(MODEL_DIR, "scaler_info.json"), "w") as f:
    json.dump(scaler_info, f)

# Save metrics
metrics = {
    "auc_roc"   : round(auc, 4),
    "precision" : round(precision, 4),
    "recall"    : round(recall, 4),
    "f1_score"  : round(f1, 4),
    "total_transactions" : int(len(df)),
    "fraud_cases"        : int(df['Class'].sum()),
    "fraud_percentage"   : round(fraud_pct, 4)
}
with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f)

# Save confusion matrix plot
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(
    cm, annot=True, fmt='d', cmap='Blues',
    xticklabels=['Legit', 'Fraud'],
    yticklabels=['Legit', 'Fraud']
)
plt.title('FinSentinel — Confusion Matrix', fontsize=14, fontweight='bold')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, "confusion_matrix.png"), dpi=150)
plt.close()

print("\n" + "=" * 60)
print("   ✅ All files saved to backend/ml/saved_model/")
print("=" * 60)
print("\n   Files created:")
print("   → fraud_model.pkl       (trained ML model)")
print("   → feature_names.json    (input feature list)")
print("   → scaler_info.json      (normalization info)")
print("   → metrics.json          (model performance)")
print("   → confusion_matrix.png  (visual evaluation)")
print("\n" + "=" * 60)
print(f"   🎯 AUC-ROC: {auc:.4f} | Precision: {precision:.4f} | Recall: {recall:.4f}")
print("=" * 60)