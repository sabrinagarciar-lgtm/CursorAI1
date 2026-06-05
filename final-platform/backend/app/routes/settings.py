from flask import Blueprint, g, jsonify, request

from app.auth import require_auth
from app.services.settings_service import get_user_settings, save_user_settings

settings_bp = Blueprint("settings", __name__)


@settings_bp.get("/settings")
@require_auth
def get_settings():
    return jsonify(get_user_settings(g.current_user["id"]))


@settings_bp.put("/settings")
@require_auth
def put_settings():
    payload = request.get_json(silent=True) or {}
    return jsonify(save_user_settings(g.current_user["id"], payload))
