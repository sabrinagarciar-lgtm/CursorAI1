from flask import Blueprint, g, jsonify, request

from app.auth import require_auth, require_roles
from app.services.users import UserError, create_user, delete_user, get_user_by_id, list_users, update_user

users_bp = Blueprint("users", __name__)


@users_bp.get("/users")
@require_roles("admin")
def get_users():
    return jsonify(list_users())


@users_bp.post("/users")
@require_roles("admin")
def post_user():
    payload = request.get_json(silent=True) or {}
    try:
        user = create_user(
            email=payload.get("email", ""),
            password=payload.get("password", ""),
            name=payload.get("name", ""),
            role=payload.get("role", "customer"),
        )
    except (UserError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(user), 201


@users_bp.get("/users/<int:user_id>")
@require_auth
def get_user(user_id: int):
    if g.current_user["role"] != "admin" and g.current_user["id"] != user_id:
        return jsonify({"message": "Insufficient permissions."}), 403
    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({"message": "User not found."}), 404
    return jsonify(user)


@users_bp.put("/users/<int:user_id>")
@require_auth
def put_user(user_id: int):
    if g.current_user["role"] != "admin" and g.current_user["id"] != user_id:
        return jsonify({"message": "Insufficient permissions."}), 403
    payload = request.get_json(silent=True) or {}
    if g.current_user["role"] != "admin":
        payload = {k: v for k, v in payload.items() if k in ("name", "password")}
    try:
        user = update_user(user_id, payload, is_admin=g.current_user["role"] == "admin")
    except (UserError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(user)


@users_bp.delete("/users/<int:user_id>")
@require_roles("admin")
def remove_user(user_id: int):
    if g.current_user["id"] == user_id:
        return jsonify({"message": "Cannot delete your own account."}), 400
    try:
        delete_user(user_id)
    except UserError as exc:
        return jsonify({"message": str(exc)}), 404
    return "", 204
