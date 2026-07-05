import pandas as pd
import io
from sqlalchemy.orm import Session
from app.schemas import TransactionInput
from app.services.fraud_service import predict_transaction, save_transaction, save_alert
from app.services.alert_service import send_fraud_alert_email
from app.core.config import get_settings

settings = get_settings()

REQUIRED_COLUMNS = {'amount', 'merchant', 'location', 'card_last4'}


def parse_uploaded_file(file_content: bytes, filename: str) -> pd.DataFrame:
    """Parse CSV or Excel file into a DataFrame, validating required columns."""
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_content))
    elif filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(io.BytesIO(file_content))
    else:
        raise ValueError("Unsupported file type. Please upload a .csv or .xlsx file")

    # Normalize column names (lowercase, strip spaces)
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(
            f"Missing required columns: {', '.join(missing)}. "
            f"File must contain: amount, merchant, location, card_last4"
        )

    # Clean data
    df = df.dropna(subset=['amount', 'merchant', 'location', 'card_last4'])
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])
    df['card_last4'] = df['card_last4'].astype(str).str.zfill(4).str[-4:]

    return df


def process_batch(db: Session, df: pd.DataFrame, max_rows: int = 500) -> dict:
    """
    Process a batch of transactions from an uploaded file.
    Returns summary statistics.
    """
    if len(df) > max_rows:
        df = df.head(max_rows)

    results = {
        "total_processed": 0,
        "fraud_detected": 0,
        "alerts_sent": 0,
        "errors": 0,
        "transactions": []
    }

    for _, row in df.iterrows():
        try:
            input_data = TransactionInput(
                amount=float(row['amount']),
                merchant=str(row['merchant']),
                location=str(row['location']),
                card_last4=str(row['card_last4'])
            )

            prediction = predict_transaction(
                amount=input_data.amount,
                merchant=input_data.merchant,
                location=input_data.location,
                card_last4=input_data.card_last4
            )

            transaction = save_transaction(db, input_data, prediction)
            results["total_processed"] += 1

            if prediction.is_fraud:
                results["fraud_detected"] += 1
                email_sent = send_fraud_alert_email(
                    transaction_id=transaction.transaction_id,
                    amount=input_data.amount,
                    merchant=input_data.merchant,
                    location=input_data.location,
                    card_last4=input_data.card_last4,
                    fraud_score=prediction.fraud_score,
                    risk_level=prediction.risk_level
                )
                if email_sent:
                    save_alert(db, transaction, settings.ALERT_TO_EMAIL)
                    results["alerts_sent"] += 1

            results["transactions"].append({
                "merchant": transaction.merchant,
                "amount": transaction.amount,
                "fraud_score": transaction.fraud_score,
                "risk_level": transaction.risk_level
            })

        except Exception as e:
            results["errors"] += 1
            continue

    return results