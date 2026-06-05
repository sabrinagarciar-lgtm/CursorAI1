from __future__ import annotations

import time
from functools import wraps
from typing import Callable

import jwt
from flask import current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    return check_password_hash(password_hash, password)


def create_access_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + current_app.config["JWT_EXPIRY_SECONDS"],
    }
    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET"],
        algorithm="HS256",
    )


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            current_app.config["JWT_SECRET"],
            algorithms=["HS256"],
        )
    except jwt.PyJWTError:
        return None


def get_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:].strip() or None


def load_current_user() -> dict | None:
    token = get_bearer_token()
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    from app.services.users import get_user_by_id

    user = get_user_by_id(int(str(payload["sub"])))
    if user is None or not user.get("active", True):
        return None
    return user


def require_auth(f: Callable):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = load_current_user()
        if user is None:
            token = get_bearer_token()
            if token:
                return jsonify({"message": "Invalid or expired token."}), 401
            return jsonify({"message": "Authentication required."}), 401
        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def require_roles(*roles: str):
    def decorator(f: Callable):
        @require_auth
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.current_user["role"] not in roles:
                return jsonify({"message": "Insufficient permissions."}), 403
            return f(*args, **kwargs)

        return decorated

    return decorator
