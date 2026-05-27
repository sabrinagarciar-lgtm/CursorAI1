import sqlite3
import uuid

from flask import g, has_request_context

from app.db import get_db
from app.services.discounts import (
    DiscountError,
    calculate_discount,
    increment_discount_usage,
    lookup_discount_code,
)
from app.services.email_service import send_order_confirmation
from app.services.payment import process_payment
from app.utils.security import sanitize_text, validate_email


class CheckoutError(Exception):
    pass


def fetch_products_by_ids(product_ids: list[str]) -> dict[str, sqlite3.Row]:
    if not product_ids:
        return {}
    db = get_db()
    placeholders = ",".join("?" for _ in product_ids)
    rows = db.execute(
        f"SELECT id, title, description, price, image_url, rating, review_count FROM products WHERE id IN ({placeholders})",
        product_ids,
    ).fetchall()
    return {row["id"]: row for row in rows}


def create_order(payload: dict) -> dict:
    items = payload.get("items") or []
    if not items:
        raise CheckoutError("Cart is empty. Add items before checkout.")

    product_ids = [item["product_id"] for item in items]
    products = fetch_products_by_ids(product_ids)

    line_items = []
    subtotal = 0.0
    for item in items:
        product_id = str(item.get("product_id", "")).strip()
        quantity = int(item.get("quantity", 0))
        if quantity <= 0:
            raise CheckoutError("Item quantity must be at least 1.")
        product = products.get(product_id)
        if product is None:
            raise CheckoutError(f"Product '{product_id}' was not found.")

        line_total = round(product["price"] * quantity, 2)
        subtotal += line_total
        line_items.append(
            {
                "product_id": product_id,
                "title": product["title"],
                "quantity": quantity,
                "unit_price": product["price"],
                "line_total": line_total,
            }
        )

    subtotal = round(subtotal, 2)
    customer_name = sanitize_text(payload.get("customer_name", ""), max_length=100)
    customer_email = validate_email(payload.get("customer_email", ""))

    discount_code = (payload.get("discount_code") or "").strip().upper()
    discount_amount = 0.0
    if discount_code:
        try:
            discount_row = lookup_discount_code(discount_code)
            discount_amount = calculate_discount(subtotal, discount_row)
        except DiscountError as exc:
            raise CheckoutError(str(exc)) from exc

    total = round(max(subtotal - discount_amount, 0), 2)

    payment = payload.get("payment") or {}
    payment_result = process_payment(
        card_number=payment.get("card_number", ""),
        expiry=payment.get("expiry", ""),
        cvv=payment.get("cvv", ""),
        cardholder_name=payment.get("cardholder_name", customer_name),
        amount=total,
    )
    if not payment_result.success:
        raise CheckoutError(payment_result.message)

    order_id = uuid.uuid4().hex[:12].upper()
    user_id = None
    if has_request_context():
        current_user = getattr(g, "current_user", None)
        if current_user:
            user_id = current_user["id"]

    db = get_db()
    db.execute(
        """
        INSERT INTO orders (
            id, user_id, customer_name, customer_email, subtotal, discount_code,
            discount_amount, total, payment_last4, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            order_id,
            user_id,
            customer_name,
            customer_email,
            subtotal,
            discount_code or None,
            discount_amount,
            total,
            payment_result.last4,
            "confirmed",
        ),
    )

    for line in line_items:
        db.execute(
            """
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES (?, ?, ?, ?)
            """,
            (order_id, line["product_id"], line["quantity"], line["unit_price"]),
        )

    if discount_code:
        increment_discount_usage(discount_code)

    db.commit()

    email_record = send_order_confirmation(
        order_id=order_id,
        customer_email=customer_email,
        customer_name=customer_name,
        total=total,
        items=line_items,
    )

    return {
        "order_id": order_id,
        "user_id": user_id,
        "status": "confirmed",
        "customer_name": customer_name,
        "customer_email": customer_email,
        "subtotal": subtotal,
        "discount_code": discount_code or None,
        "discount_amount": discount_amount,
        "total": total,
        "payment_last4": payment_result.last4,
        "items": line_items,
        "email_sent": True,
        "email_preview": {
            "subject": email_record["subject"],
            "to": email_record["to"],
        },
    }


def get_order(order_id: str) -> dict | None:
    db = get_db()
    order = db.execute(
        """
        SELECT id, user_id, customer_name, customer_email, subtotal, discount_code,
               discount_amount, total, payment_last4, status, created_at
        FROM orders
        WHERE id = ?
        """,
        (order_id.upper(),),
    ).fetchone()
    if order is None:
        return None

    items = db.execute(
        """
        SELECT oi.product_id, oi.quantity, oi.unit_price, p.title
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        """,
        (order_id.upper(),),
    ).fetchall()

    return {
        "order_id": order["id"],
        "user_id": order["user_id"],
        "status": order["status"],
        "customer_name": order["customer_name"],
        "customer_email": order["customer_email"],
        "subtotal": order["subtotal"],
        "discount_code": order["discount_code"],
        "discount_amount": order["discount_amount"],
        "total": order["total"],
        "payment_last4": order["payment_last4"],
        "created_at": order["created_at"],
        "items": [
            {
                "product_id": row["product_id"],
                "title": row["title"],
                "quantity": row["quantity"],
                "unit_price": row["unit_price"],
            }
            for row in items
        ],
    }
