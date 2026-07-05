import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.core.websocket_manager import manager
from app.services.simulator import generate_transaction
from app.services.fraud_service import predict_transaction, save_transaction, save_alert
from app.services.alert_service import send_fraud_alert_email
from app.schemas import TransactionInput
from app.core.config import get_settings

settings = get_settings()
router   = APIRouter()

# Track if simulator is running
_simulator_running = False


async def run_simulator(interval_seconds: float = 3.0):
    """
    Background task that generates and analyzes transactions
    at regular intervals and broadcasts results via WebSocket.
    """
    global _simulator_running
    _simulator_running = True
    print(f"Demo simulator started — interval: {interval_seconds}s")

    while _simulator_running:
        try:
            db = SessionLocal()
            tx_data = generate_transaction()

            input_data = TransactionInput(**tx_data)
            result     = predict_transaction(
                amount=input_data.amount,
                merchant=input_data.merchant,
                location=input_data.location,
                card_last4=input_data.card_last4
            )

            transaction = save_transaction(db, input_data, result)

            # Send alert email for high-risk transactions
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

            # Broadcast to all connected dashboards
            await manager.broadcast({
                "type":           "new_transaction",
                "is_demo":        True,
                "transaction_id": transaction.transaction_id,
                "amount":         transaction.amount,
                "merchant":       transaction.merchant,
                "location":       transaction.location,
                "card_last4":     transaction.card_last4,
                "fraud_score":    transaction.fraud_score,
                "is_fraud":       transaction.is_fraud,
                "risk_level":     transaction.risk_level,
                "confidence":     transaction.confidence,
                "status":         transaction.status,
                "created_at":     transaction.created_at.isoformat(),
            })

            db.close()

        except Exception as e:
            print(f"Simulator error: {e}")

        await asyncio.sleep(interval_seconds)

    print("Demo simulator stopped")


@router.post("/simulator/start")
async def start_simulator(
    interval: float = 3.0,
):
    """Start the demo transaction simulator."""
    global _simulator_running
    if _simulator_running:
        return {"status": "already_running", "message": "Simulator is already running"}

    asyncio.create_task(run_simulator(interval))
    return {"status": "started", "interval_seconds": interval, "is_demo": True}


@router.post("/simulator/stop")
async def stop_simulator():
    """Stop the demo transaction simulator."""
    global _simulator_running
    _simulator_running = False
    return {"status": "stopped"}


@router.get("/simulator/status")
async def simulator_status():
    """Check if the simulator is currently running."""
    return {
        "running":          _simulator_running,
        "connected_clients": len(manager.active_connections)
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — listen for ping messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)