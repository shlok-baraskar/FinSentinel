import pandas as pd
import numpy as np
import joblib
import json
import os

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR  = os.path.join(BASE_DIR, "saved_model")

# ─── Load Model and Files ─────────────────────────────────────────────────────
model         = joblib.load(os.path.join(MODEL_DIR, "fraud_model.pkl"))
feature_names = json.load(open(os.path.join(MODEL_DIR, "feature_names.json")))
metrics       = json.load(open(os.path.join(MODEL_DIR, "metrics.json")))

def predict_fraud(transaction: dict) -> dict:
    """
    Takes a transaction dictionary and returns fraud prediction.
    
    Args:
        transaction: dict with keys matching feature_names
        
    Returns:
        dict with fraud_score, is_fraud, risk_level, confidence
    """
    # Convert to dataframe
    df = pd.DataFrame([transaction])
    
    # Ensure correct feature order
    df = df[feature_names]
    
    # Get prediction and probability
    fraud_prob  = model.predict_proba(df)[0][1]
    is_fraud    = bool(fraud_prob >= 0.5)
    fraud_score = round(float(fraud_prob) * 100, 2)
    
    # Risk level based on score
    if fraud_score >= 80:
        risk_level = "CRITICAL"
    elif fraud_score >= 60:
        risk_level = "HIGH"
    elif fraud_score >= 40:
        risk_level = "MEDIUM"
    elif fraud_score >= 20:
        risk_level = "LOW"
    else:
        risk_level = "SAFE"
    
    return {
        "fraud_score" : fraud_score,
        "is_fraud"    : is_fraud,
        "risk_level"  : risk_level,
        "confidence"  : round(float(max(fraud_prob, 1 - fraud_prob)) * 100, 2)
    }


def get_model_metrics() -> dict:
    """Returns saved model performance metrics."""
    return metrics


# ─── Test the model ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("   FinSentinel — Model Prediction Test")
    print("=" * 60)

    # Load a few real transactions from dataset to test
    DATA_PATH = os.path.join(BASE_DIR, "data", "creditcard.csv")
    df_test   = pd.read_csv(DATA_PATH)

    # Prepare features same way as training
    from sklearn.preprocessing import StandardScaler
    df_test['NormAmount'] = StandardScaler().fit_transform(
        df_test['Amount'].values.reshape(-1, 1)
    )
    df_test['NormTime'] = StandardScaler().fit_transform(
        df_test['Time'].values.reshape(-1, 1)
    )
    df_test = df_test.drop(['Time', 'Amount'], axis=1)

    # Get 3 legit and 3 fraud transactions
    legit_samples = df_test[df_test['Class'] == 0].head(3)
    fraud_samples = df_test[df_test['Class'] == 1].head(3)

    print("\n── Testing LEGIT transactions ──────────────────────────")
    for i, (_, row) in enumerate(legit_samples.iterrows()):
        transaction = row.drop('Class').to_dict()
        result      = predict_fraud(transaction)
        status      = "✅ CORRECT" if not result['is_fraud'] else "❌ WRONG"
        print(f"\n   Transaction {i+1}: {status}")
        print(f"   Fraud Score : {result['fraud_score']}%")
        print(f"   Risk Level  : {result['risk_level']}")
        print(f"   Confidence  : {result['confidence']}%")

    print("\n── Testing FRAUD transactions ──────────────────────────")
    for i, (_, row) in enumerate(fraud_samples.iterrows()):
        transaction = row.drop('Class').to_dict()
        result      = predict_fraud(transaction)
        status      = "✅ CORRECT" if result['is_fraud'] else "❌ WRONG"
        print(f"\n   Transaction {i+1}: {status}")
        print(f"   Fraud Score : {result['fraud_score']}%")
        print(f"   Risk Level  : {result['risk_level']}")
        print(f"   Confidence  : {result['confidence']}%")

    print("\n── Model Performance Metrics ───────────────────────────")
    metrics_data = get_model_metrics()
    for key, value in metrics_data.items():
        print(f"   {key:<25} : {value}")

    print("\n" + "=" * 60)
    print("   ✅ Model test complete — ready for backend integration!")
    print("=" * 60)