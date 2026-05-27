"""Authentication routes."""

from __future__ import annotations

from flask import Blueprint, current_app, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError
from sqlalchemy import select

from app.extensions import db
from app.http_helpers import error_response, success_response
from app.models.user import User, UserRole
from app.schemas.api import LoginSchema, RegisterSchema
from app.utils.passwords import hash_password, verify_password
from app.utils.sanitize import sanitize_text

auth_bp = Blueprint("authentication", __name__, url_prefix="/auth")


def serialize_user_public(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email.lower(),
        "role": user.role,
        "availability_status": user.availability_status,
        "expertise_areas": user.expertise_areas or [],
    }


@auth_bp.route("/register", methods=["POST"])
def register_account():
    try:
        payload = RegisterSchema().load(request.get_json(silent=True) or {})
    except ValidationError as err:
        return error_response(message="Validation failed.", code="VALIDATION_ERROR", http_status=400, errors=err.messages)

    pw = sanitize_text(payload["password"], strip=True)
    normalized_email = payload["email"].strip().lower()
    if db.session.scalar(select(User.id).where(User.email == normalized_email)):
        return error_response(
            message="Email already registered.",
            code="CONFLICT",
            http_status=409,
            errors={"email": ["duplicate"]},
        )

    hashed = hash_password(pw, cost=current_app.config.get("BCRYPT_COST", 12))
    user = User(name=sanitize_text(payload["name"]), email=normalized_email, password_hash=hashed, role=UserRole.customer.value)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    body = {"user": serialize_user_public(user), "access_token": token}
    return success_response(body, status_code=201)


@auth_bp.route("/login", methods=["POST"])
def login_account():
    try:
        payload = LoginSchema().load(request.get_json(silent=True) or {})
    except ValidationError as err:
        return error_response(message="Validation failed.", code="VALIDATION_ERROR", http_status=400, errors=err.messages)

    normalized_email = payload["email"].strip().lower()
    user = db.session.scalar(select(User).where(User.email == normalized_email))
    if not user or not verify_password(payload["password"], user.password_hash):
        return error_response(
            message="Invalid credentials.",
            code="UNAUTHORIZED",
            http_status=401,
            errors={"credentials": ["Invalid email/password combination"]},
        )

    token = create_access_token(identity=str(user.id))
    return success_response({"access_token": token, "user": serialize_user_public(user)})


@auth_bp.route("/logout", methods=["POST"])
def logout_account():
    return success_response({"detail": "Client should discard the JWT access token.", "hints": {"token_transport": "Authorization: Bearer"}})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def auth_me():
    uid = int(get_jwt_identity())
    user = db.session.get(User, uid)
    if not user:
        return error_response(message="User not found.", code="NOT_FOUND", http_status=404)
    return success_response(serialize_user_public(user))
