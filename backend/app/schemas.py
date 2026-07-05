from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Transaction Schemas ──────────────────────────────────────────────────────
class TransactionInput(BaseModel):
    amount:    float  = Field(..., gt=0, description="Transaction amount")
    merchant:  str    = Field(..., description="Merchant name")
    location:  str    = Field(..., description="Transaction location")
    card_last4: str   = Field(..., min_length=4, max_length=4, description="Last 4 digits of card")


class TransactionResponse(BaseModel):
    id:             int
    transaction_id: str
    amount:         float
    merchant:       str
    location:       str
    card_last4:     str
    fraud_score:    float
    is_fraud:       bool
    risk_level:     str
    confidence:     float
    status:         str
    created_at:     datetime

    class Config:
        from_attributes = True


# ─── Alert Schemas ────────────────────────────────────────────────────────────
class AlertResponse(BaseModel):
    id:             int
    transaction_id: str
    amount:         float
    merchant:       str
    fraud_score:    float
    risk_level:     str
    email_sent:     bool
    email_to:       str
    created_at:     datetime

    class Config:
        from_attributes = True


# ─── Stats Schema ─────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_transactions: int
    fraud_detected:     int
    total_alerts:       int
    fraud_rate:         float
    avg_fraud_score:    float
    model_auc:          float


# ─── Prediction Schema ────────────────────────────────────────────────────────
class PredictionResult(BaseModel):
    fraud_score: float
    is_fraud:    bool
    risk_level:  str
    confidence:  float


# ─── Auth Schemas ─────────────────────────────────────────────────────────────
class UserSignup(BaseModel):
    full_name: str = Field(..., min_length=2)
    email:     str = Field(...)
    password:  str = Field(..., min_length=6)
    role:      str = Field(default="analyst")  # "admin" or "analyst"


class UserLogin(BaseModel):
    email:    str
    password: str


class UserResponse(BaseModel):
    id:         int
    full_name:  str
    email:      str
    role:       str
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserResponse