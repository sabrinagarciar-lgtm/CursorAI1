"""Shared Flask extensions (created once, bound in factory)."""

from __future__ import annotations

from flask import request
from flask_jwt_extended import decode_token
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy


def compose_rate_limit_key() -> str:
    """Prefer authenticated subject for per-user quotas; fallback to caller IP."""

    auth = request.headers.get("Authorization", "") or ""
    lowered = auth.lower()
    token = lowered.split(" ", 1)[1].strip() if lowered.startswith("bearer ") else ""
    if token:
        try:
            decoded = decode_token(token)
            return f"jwt:{decoded['sub']}"
        except Exception:  # noqa: BLE001 — treat invalid tokens like anonymous IP buckets
            return f"anonymous:{get_remote_address()}"
    return f"ip:{get_remote_address()}"


def burst_limit_callable() -> str:
    """Turn `RATE_LIMIT_PER_MINUTE` into a limiter string inside an app context."""

    try:
        from flask import current_app

        configured = int(current_app.config.get("RATE_LIMIT_PER_MINUTE", 100))
    except RuntimeError:
        configured = 100
    return f"{configured}/minute"


db = SQLAlchemy()
limiter = Limiter(
    key_func=compose_rate_limit_key,
    default_limits=[burst_limit_callable],
)
