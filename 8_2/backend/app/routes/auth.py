from flask import Blueprint, g, jsonify, request

from app.auth import create_access_token, require_auth
from app.services.users import UserError, authenticate_user, create_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/auth/register")
def register():
    payload = request.get_json(silent=True) or {}
    try:
        user = create_user(
            email=payload.get("email", ""),
            password=payload.get("password", ""),
            name=payload.get("name", ""),
            role="customer",
        )
    except (UserError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400

    token = create_access_token(user["id"], user["email"], user["role"])
    return jsonify({"token": token, "user": user}), 201


@auth_bp.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    try:
        user = authenticate_user(
            email=payload.get("email", ""),
            password=payload.get("password", ""),
        )
    except (UserError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 401

    token = create_access_token(user["id"], user["email"], user["role"])
    return jsonify({"token": token, "user": user})


@auth_bp.get("/auth/me")
@require_auth
def me():
    return jsonify(g.current_user)
