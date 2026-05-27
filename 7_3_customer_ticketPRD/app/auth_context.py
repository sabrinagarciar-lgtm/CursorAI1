"""Resolve authenticated users from JWT claims."""

from __future__ import annotations

from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User
from werkzeug.exceptions import Unauthorized


def get_current_user(strict: bool = True) -> User | None:
    uid = get_jwt_identity()
    if not uid:
        if strict:
            raise Unauthorized(description="Authentication required.")
        return None
    try:
        key = int(uid)
    except (TypeError, ValueError) as exc:  # pragma: no cover
        raise Unauthorized(description="Invalid subject claim.") from exc
    user = db.session.get(User, key)
    if strict and not user:
        raise Unauthorized(description="User no longer exists.")
    return user
