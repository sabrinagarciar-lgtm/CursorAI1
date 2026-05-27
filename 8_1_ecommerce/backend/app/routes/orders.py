from flask import Blueprint, jsonify

from app.services.orders import get_order

orders_bp = Blueprint("orders", __name__)


@orders_bp.get("/orders/<order_id>")
def fetch_order(order_id: str):
    order = get_order(order_id)
    if order is None:
        return jsonify({"message": "Order not found."}), 404
    return jsonify(order)
