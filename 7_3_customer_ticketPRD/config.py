"""Application configuration."""

from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    INSTANCE_PATH = str(INSTANCE_DIR)
    UPLOAD_FOLDER = str(INSTANCE_DIR / "uploads")
    ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
    MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024  # 5 MB per file
    MAX_UPLOAD_FILES_TICKET_CREATE = 3

    API_TITLE = "Customer Support Ticket API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.3"
    OPENAPI_URL_PREFIX = "/api"
    OPENAPI_JSON_PATH = "openapi.json"
    OPENAPI_SWAGGER_UI_PATH = "/swagger-ui"
    OPENAPI_REDOC_PATH = "/redoc"
    DOC_UI_AUTH = {}

    JSON_SORT_KEYS = False

    SMOREST_SERVERS = [{"url": "/"}]

    BCRYPT_COST = 12

    # FR-021: approaching SLA threshold (fraction of elapsed time before due)
    SLA_APPROACHING_FRACTION = 0.8

    RATE_LIMIT_PER_MINUTE = 100

    TALISMAN_FORCE_HTTPS = os.getenv("TALISMAN_FORCE_HTTPS", "false").lower() in {"1", "true", "yes"}

    SLAL_DEBUG_EMAIL = False  # overridden in tests via app config

    # `None` = do not attach Flask-CORS. Set to a non-empty list in Development/Production via env when needed.
    CORS_ORIGINS: list[str] | None = None


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{INSTANCE_DIR}/support.db",
    )
    _cors_raw = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
    CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "x" * 48
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=60)
    RATE_LIMIT_PER_MINUTE = 1000  # loosen for tests unless overridden
    BCRYPT_COST = 8  # speed up fixtures while keeping hashing semantics in assertions


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or ""
    _cors_prod = os.getenv("CORS_ORIGINS", "").strip()
    CORS_ORIGINS = [o.strip() for o in _cors_prod.split(",") if o.strip()] if _cors_prod else None

    @classmethod
    def validate(cls):
        if not ProductionConfig.SQLALCHEMY_DATABASE_URI:
            raise RuntimeError("DATABASE_URL is required in production")


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_by_name.get(env, DevelopmentConfig)


def ensure_directories(cfg: BaseConfig):
    Path(cfg.INSTANCE_PATH).mkdir(parents=True, exist_ok=True)
    Path(cfg.UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
