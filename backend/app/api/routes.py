from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import (
    TransactionInput,
    TransactionResponse,
    AlertResponse,
    DashboardStats,
    PredictionResult
)
from app.services.fraud_service import (
    predict_transaction,
    save_transaction,
    save_alert,
    get_dashboard_stats,
    get_model_metrics
)
from app.services.alert_service import send_fraud_alert_email
from app.services.batch_service import parse_uploaded_file, process_batch
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, Alert
from app.core.config import get_settings

settings = get_settings()
router   = APIRouter()


# ─── Health Check ─────────────────────────────────────────────────────────────
@router.get("/health")
def health_check():
    return {
        "status":  "online",
        "app":     settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# ─── Analyze Transaction ──────────────────────────────────────────────────────
@router.post("/transactions/analyze", response_model=TransactionResponse)
def analyze_transaction(input_data: TransactionInput, db: Session = Depends(get_db)):
    """
    Analyze a transaction for fraud.
    Automatically sends alert email if fraud is detected.
    """
    # Run ML prediction with full transaction context
    result = predict_transaction(
        amount=input_data.amount,
        merchant=input_data.merchant,
        location=input_data.location,
        card_last4=input_data.card_last4
    )

    # Save to database
    transaction = save_transaction(db, input_data, result)

    # Auto-send alert if fraud detected
    if result.is_fraud:
        email_sent = send_fraud_alert_email(
            transaction_id=transaction.transaction_id,
            amount=input_data.amount,
            merchant=input_data.merchant,
            location=input_data.location,
            card_last4=input_data.card_last4,
            fraud_score=result.fraud_score,
            risk_level=result.risk_level
        )
        if email_sent:
            save_alert(db, transaction, settings.ALERT_TO_EMAIL)

    return transaction


# ─── Get All Transactions ─────────────────────────────────────────────────────
@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    skip:     int = 0,
    limit:    int = 50,
    db: Session = Depends(get_db)
):
    """Get all transactions, newest first."""
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return transactions


# ─── Get Single Transaction ───────────────────────────────────────────────────
@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    """Get a single transaction by ID."""
    transaction = (
        db.query(Transaction)
        .filter(Transaction.transaction_id == transaction_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


# ─── Get All Alerts ───────────────────────────────────────────────────────────
@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    skip:  int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all fraud alerts, newest first."""
    alerts = (
        db.query(Alert)
        .order_by(Alert.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return alerts


# ─── Dashboard Stats ──────────────────────────────────────────────────────────
@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    return get_dashboard_stats(db)


# ─── Model Metrics ────────────────────────────────────────────────────────────
@router.get("/model/metrics")
def get_metrics():
    """Get ML model performance metrics."""
    return get_model_metrics()


# ─── Batch Upload ──────────────────────────────────────────────────────────────
@router.post("/transactions/batch-upload")
async def batch_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a CSV or Excel file with transactions for bulk fraud analysis.
    Required columns: amount, merchant, location, card_last4
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only .csv, .xlsx, .xls files are supported")

    content = await file.read()

    try:
        df = parse_uploaded_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="No valid transaction rows found in file")

    results = process_batch(db, df)
    return results