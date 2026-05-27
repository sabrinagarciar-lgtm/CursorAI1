from flask import Blueprint, g, jsonify, request

from app.auth import load_current_user, require_auth, require_roles
from app.services.order_crud import (
    OrderCrudError,
    create_order_record,
    delete_order_record,
    get_order_detail,
    list_orders,
    update_order_record,
)
from app.services.orders import get_order

orders_bp = Blueprint("orders", __name__)


@orders_bp.get("/orders")
@require_auth
def list_orders_route():
    is_admin = g.current_user["role"] == "admin"
    return jsonify(
        list_orders(user_id=g.current_user["id"], is_admin=is_admin)
    )


@orders_bp.post("/orders")
@require_auth
def create_order_route():
    payload = request.get_json(silent=True) or {}
    try:
        order = create_order_record(
            payload,
            user_id=g.current_user["id"],
        )
    except (OrderCrudError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(order), 201


@orders_bp.get("/orders/<order_id>")
def fetch_order(order_id: str):
    user = load_current_user()
    if user is not None:
        g.current_user = user

    order = get_order(order_id)
    if order is None:
        order = get_order_detail(order_id)
    if order is None:
        return jsonify({"message": "Order not found."}), 404
    order_user_id = order.get("user_id")
    if order_user_id is not None and user is None:
        return jsonify({"message": "Authentication required."}), 401
    if (
        order_user_id is not None
        and user
        and user["role"] != "admin"
        and user["id"] != order_user_id
    ):
        return jsonify({"message": "Insufficient permissions."}), 403
    return jsonify(order)


@orders_bp.put("/orders/<order_id>")
@require_auth
def update_order_route(order_id: str):
    order = get_order_detail(order_id.upper())
    if order is None:
        return jsonify({"message": "Order not found."}), 404

    is_admin = g.current_user["role"] == "admin"
    if not is_admin and order.get("user_id") != g.current_user["id"]:
        return jsonify({"message": "Insufficient permissions."}), 403

    payload = request.get_json(silent=True) or {}
    if not is_admin:
        payload = {
            k: v
            for k, v in payload.items()
            if k in ("customer_name", "customer_email")
        }

    try:
        updated = update_order_record(
            order_id, payload, is_admin=is_admin
        )
    except (OrderCrudError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(updated)


@orders_bp.delete("/orders/<order_id>")
@require_roles("admin")
def delete_order_route(order_id: str):
    try:
        delete_order_record(order_id)
    except OrderCrudError as exc:
        return jsonify({"message": str(exc)}), 404
    return "", 204
