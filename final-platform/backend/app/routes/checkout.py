from flask import Blueprint, g, jsonify, request

from app.auth import load_current_user
from app.services.orders import CheckoutError, create_order

checkout_bp = Blueprint("checkout", __name__)


@checkout_bp.post("/checkout")
def checkout():
    user = load_current_user()
    if user is not None:
        g.current_user = user

    payload = request.get_json(silent=True) or {}
    try:
        order = create_order(payload)
    except CheckoutError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    return jsonify({"success": True, "order": order}), 201
