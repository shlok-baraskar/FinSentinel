from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id             = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    amount         = Column(Float, nullable=False)
    merchant       = Column(String, nullable=False)
    location       = Column(String, nullable=False)
    card_last4     = Column(String(4), nullable=False)
    fraud_score    = Column(Float, nullable=False)
    is_fraud       = Column(Boolean, default=False)
    risk_level     = Column(String, nullable=False)
    confidence     = Column(Float, nullable=False)
    status         = Column(String, default="pending")
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id             = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    amount         = Column(Float, nullable=False)
    merchant       = Column(String, nullable=False)
    fraud_score    = Column(Float, nullable=False)
    risk_level     = Column(String, nullable=False)
    email_sent     = Column(Boolean, default=False)
    email_to       = Column(String, nullable=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id         = Column(Integer, primary_key=True, index=True)
    auc_roc    = Column(Float)
    precision  = Column(Float)
    recall     = Column(Float)
    f1_score   = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())