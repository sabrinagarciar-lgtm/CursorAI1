"""
Application configuration.

Database URI resolution priority:
  1. ``DATABASE_URL`` — always wins when set (recommended for Cloud SQL Auth Proxy TCP).
  2. ``CLOUD_SQL_CONNECT_MODE=unix_socket`` + ``PGUSER`` / ``PGPASSWORD`` / ``PGDATABASE``
     — builds a Unix-socket URI for workloads with ``/cloudsql/<PROJECT:REGION:INSTANCE>``.
  3. Local dev default pointing at ``localhost``.
"""

from __future__ import annotations

import os
from datetime import timedelta
from urllib.parse import quote, quote_plus

# GCP Cloud SQL — connection resource name PROJECT:REGION:INSTANCE
DEFAULT_CLOUDSQL_CONNECTION_NAME = "gd-gcp-gridu-genai:us-central1:appuser1"


def build_sqlalchemy_database_uri() -> str:
    explicit = os.getenv("DATABASE_URL")
    if explicit:
        return explicit.strip()

    mode = (os.getenv("CLOUD_SQL_CONNECT_MODE") or "").lower()

    conn_name = os.getenv(
        "CLOUDSQL_INSTANCE_CONNECTION_NAME",
        DEFAULT_CLOUDSQL_CONNECTION_NAME,
    )

    if mode in {"unix_socket", "unix", "socket"}:
        user = os.getenv("PGUSER")
        password = os.getenv("PGPASSWORD")
        dbname = os.getenv("PGDATABASE")

        missing = [
            label
            for label, raw in (
                ("PGUSER", user),
                ("PGPASSWORD", password),
                ("PGDATABASE", dbname),
            )
            if not raw
        ]
        if missing:
            raise RuntimeError(
                f"CLOUD_SQL_CONNECT_MODE=unix_socket requires env vars {missing}; "
                "or set DATABASE_URL instead."
            )

        sock = os.getenv("CLOUDSQL_UNIX_SOCKET_HOST") or f"/cloudsql/{conn_name}"

        return (
            f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}@/"
            f"{quote_plus(dbname)}?host={quote(sock)}"
        )

    return (
        os.getenv(
            "DATABASE_LOCAL_URL",
            "postgresql+psycopg://postgres:postgres@localhost:5432/blog_platform",
        )
    )


class Config:
    """Base Flask configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-use-a-strong-random-key")

    # HTTP response caching — Redis in production/shared dev; falls back locally.
    REDIS_URL = os.getenv("REDIS_URL") or ""
    CACHE_POSTS_ENABLED = os.getenv("CACHE_POSTS_ENABLED", "true").lower() not in {"0", "false", "no"}
    CACHE_DISABLED = os.getenv("CACHE_DISABLED")  # force-disable reads + writes when truthy

    CACHE_TYPE = os.getenv("CACHE_TYPE") or ("Redis" if (os.getenv("REDIS_URL") or "").strip() else "SimpleCache")
    CACHE_REDIS_URL = (os.getenv("REDIS_URL") or "redis://127.0.0.1:6379/0").strip()

    CACHE_KEY_PREFIX = os.getenv("CACHE_KEY_PREFIX", "blog_api:")
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", "120"))
    CACHE_POSTS_LIST_TTL = int(os.getenv("CACHE_POSTS_LIST_TTL", "60"))
    CACHE_POSTS_DETAIL_TTL = int(os.getenv("CACHE_POSTS_DETAIL_TTL", "120"))

    TRY_REDIS_SENTINEL = os.getenv("TRY_REDIS_SENTINEL")  # reserved for clustered Redis

    # Set at runtime in ``create_app`` via ``build_sqlalchemy_database_uri()``.
    SQLALCHEMY_DATABASE_URI: str | None = None

    CLOUDSQL_INSTANCE_CONNECTION_NAME = os.getenv(
        "CLOUDSQL_INSTANCE_CONNECTION_NAME",
        DEFAULT_CLOUDSQL_CONNECTION_NAME,
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": int(os.getenv("SQLALCHEMY_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("SQLALCHEMY_MAX_OVERFLOW", "20")),
    }

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "jwt-dev-secret-change-me-use-a-strong-random-key-min-32-chars",
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_SECONDS", str(60 * 15))),
    )

    REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "14"))

    API_TITLE = "Blog Platform API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.3"
    OPENAPI_JSON_PATH = "api-docs.json"
    OPENAPI_URL_PREFIX = "/"
    OPENAPI_SWAGGER_UI_PATH = "/swagger-ui"
    OPENAPI_SWAGGER_UI_URL = (
        "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
    )
    OPENAPI_SWAGGER_UI_CONFIG = {"persistAuthorization": True}

    # Rate limits (Flask-Limiter); tune per deployment.
    # Keys expected by Flask-Limiter (constants.DEFAULT_LIMITS, STORAGE_URI, ...)
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "200 per day;50 per hour")
    RATELIMIT_AUTH = os.getenv("RATELIMIT_AUTH", "20 per minute")
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "true").lower() not in {"0", "false", "no"}

    # Trust reverse proxy (nginx, load balancer) for HTTPS / client IP.
    TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "").lower() in {
        "1",
        "true",
        "yes",
    }


class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False


class TestingConfig(DevelopmentConfig):
    """pytest / CI targets — disable outbound rate buckets; in-process cache."""

    TESTING = True
    CACHE_TYPE = "SimpleCache"
    CACHE_POSTS_ENABLED = True
    RATELIMIT_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False
    # Browsers only send cookies over HTTPS; pair with TLS termination (e.g. nginx).
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PREFERRED_URL_SCHEME = "https"
    # HSTS / CSP via flask-talisman when enabled in app factory.
    TALISMAN_FORCE_HTTPS = os.getenv("TALISMAN_FORCE_HTTPS", "false").lower() in {
        "1",
        "true",
        "yes",
    }


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
