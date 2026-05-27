from flask import Blueprint, jsonify, request

from app.services.discounts import DiscountError, calculate_discount, lookup_discount_code
from app.utils.security import contains_sql_injection, sanitize_text

discounts_bp = Blueprint("discounts", __name__)


@discounts_bp.post("/discounts/validate")
def validate_discount():
    payload = request.get_json(silent=True) or {}
    raw_code = str(payload.get("code", "")).strip()
    subtotal = float(payload.get("subtotal", 0))

    if not raw_code:
        return jsonify({"valid": False, "message": "Discount code is required."}), 400

    if contains_sql_injection(raw_code):
        return jsonify({"valid": False, "message": "Potentially unsafe input detected."}), 400

    try:
        sanitize_text(raw_code, max_length=32)
        row = lookup_discount_code(raw_code)
        amount = calculate_discount(subtotal, row)
    except DiscountError as exc:
        return jsonify({"valid": False, "message": str(exc)}), 400
    except ValueError as exc:
        return jsonify({"valid": False, "message": str(exc)}), 400

    return jsonify(
        {
            "valid": True,
            "code": row["code"],
            "discount_type": row["discount_type"],
            "discount_amount": amount,
            "message": f"Discount applied: -${amount:.2f}",
        }
    )
