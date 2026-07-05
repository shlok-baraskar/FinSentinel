from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # SendGrid
    SENDGRID_API_KEY: str
    ALERT_FROM_EMAIL: str
    ALERT_TO_EMAIL: str

    # App
    APP_NAME: str = "FinSentinel"
    APP_VERSION: str = "1.0.0"
    FRAUD_THRESHOLD: float = 50.0
    SECRET_KEY: str = "finsentinel_secret_key_2024"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()