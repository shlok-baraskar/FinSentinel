import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import joblib
import json
import pandas as pd
import uuid
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, Alert, ModelMetric
from app.schemas import TransactionInput, PredictionResult
from app.core.config import get_settings

settings = get_settings()

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR     = os.path.join(BASE_DIR, '..', '..', 'ml', 'saved_model')

# ─── Load Model Once ──────────────────────────────────────────────────────────
print("Loading fraud detection model...")
model         = joblib.load(os.path.join(MODEL_DIR, 'fraud_model.pkl'))
feature_names = json.load(open(os.path.join(MODEL_DIR, 'feature_names.json')))
metrics_data  = json.load(open(os.path.join(MODEL_DIR, 'metrics.json')))
print("Model loaded successfully!")


from app.services.feature_engineering import engineer_features


def predict_transaction(amount: float, merchant: str = "", location: str = "", card_last4: str = "") -> PredictionResult:
    """
    Run fraud prediction using engineered features based on real transaction risk signals.
    """
    features = engineer_features(amount, merchant, location, card_last4, feature_names)
    df = pd.DataFrame([features])[feature_names]

    fraud_prob  = model.predict_proba(df)[0][1]
    is_fraud    = bool(fraud_prob >= (settings.FRAUD_THRESHOLD / 100))
    fraud_score = round(float(fraud_prob) * 100, 2)

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

    return PredictionResult(
        fraud_score=fraud_score,
        is_fraud=is_fraud,
        risk_level=risk_level,
        confidence=round(float(max(fraud_prob, 1 - fraud_prob)) * 100, 2)
    )


def save_transaction(db: Session, input_data: TransactionInput, result: PredictionResult) -> Transaction:
    """Save transaction and prediction result to database."""
    transaction = Transaction(
        transaction_id=str(uuid.uuid4()),
        amount=input_data.amount,
        merchant=input_data.merchant,
        location=input_data.location,
        card_last4=input_data.card_last4,
        fraud_score=result.fraud_score,
        is_fraud=result.is_fraud,
        risk_level=result.risk_level,
        confidence=result.confidence,
        status="flagged" if result.is_fraud else "clear"
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def save_alert(db: Session, transaction: Transaction, email_to: str) -> Alert:
    """Save alert record to database."""
    alert = Alert(
        transaction_id=transaction.transaction_id,
        amount=transaction.amount,
        merchant=transaction.merchant,
        fraud_score=transaction.fraud_score,
        risk_level=transaction.risk_level,
        email_sent=True,
        email_to=email_to
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_dashboard_stats(db: Session) -> dict:
    """Get stats for the dashboard."""
    from sqlalchemy import func

    total     = db.query(Transaction).count()
    frauds    = db.query(Transaction).filter(Transaction.is_fraud == True).count()
    alerts    = db.query(Alert).count()
    avg_score = db.query(func.avg(Transaction.fraud_score)).scalar() or 0.0
    fraud_rate = round((frauds / total * 100), 2) if total > 0 else 0.0

    return {
        "total_transactions": total,
        "fraud_detected":     frauds,
        "total_alerts":       alerts,
        "fraud_rate":         fraud_rate,
        "avg_fraud_score":    round(float(avg_score), 2),
        "model_auc":          metrics_data.get("auc_roc", 0.0)
    }


def get_model_metrics() -> dict:
    """Return model performance metrics."""
    return metrics_data