from __future__ import annotations

import uuid

from app.db import get_db
from app.services.orders import CheckoutError, fetch_products_by_ids
from app.utils.security import sanitize_text, validate_email


class OrderCrudError(Exception):
    pass


def _order_row_to_dict(row, items: list) -> dict:
    return {
        "order_id": row["id"],
        "user_id": row["user_id"],
        "status": row["status"],
        "customer_name": row["customer_name"],
        "customer_email": row["customer_email"],
        "subtotal": row["subtotal"],
        "discount_code": row["discount_code"],
        "discount_amount": row["discount_amount"],
        "total": row["total"],
        "payment_last4": row["payment_last4"],
        "created_at": row["created_at"],
        "items": items,
    }


def _fetch_order_items(db, order_id: str) -> list[dict]:
    rows = db.execute(
        """
        SELECT oi.product_id, oi.quantity, oi.unit_price, p.title
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        """,
        (order_id,),
    ).fetchall()
    return [
        {
            "product_id": row["product_id"],
            "title": row["title"],
            "quantity": row["quantity"],
            "unit_price": row["unit_price"],
        }
        for row in rows
    ]


def list_orders(*, user_id: int | None = None, is_admin: bool = False) -> list[dict]:
    db = get_db()
    if is_admin:
        rows = db.execute(
            """
            SELECT id, user_id, customer_name, customer_email, subtotal, discount_code,
                   discount_amount, total, payment_last4, status, created_at
            FROM orders ORDER BY created_at DESC
            """
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT id, user_id, customer_name, customer_email, subtotal, discount_code,
                   discount_amount, total, payment_last4, status, created_at
            FROM orders WHERE user_id = ? ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()

    result = []
    for row in rows:
        items = _fetch_order_items(db, row["id"])
        result.append(_order_row_to_dict(row, items))
    return result


def get_order_detail(order_id: str) -> dict | None:
    db = get_db()
    order = db.execute(
        """
        SELECT id, user_id, customer_name, customer_email, subtotal, discount_code,
               discount_amount, total, payment_last4, status, created_at
        FROM orders WHERE id = ?
        """,
        (order_id.upper(),),
    ).fetchone()
    if order is None:
        return None
    items = _fetch_order_items(db, order["id"])
    return _order_row_to_dict(order, items)


def create_order_record(
    payload: dict,
    *,
    user_id: int | None = None,
) -> dict:
    items = payload.get("items") or []
    if not items:
        raise OrderCrudError("At least one item is required.")

    product_ids = [str(item.get("product_id", "")).strip() for item in items]
    products = fetch_products_by_ids(product_ids)

    line_items = []
    subtotal = 0.0
    for item in items:
        product_id = str(item.get("product_id", "")).strip()
        try:
            quantity = int(item.get("quantity", 0))
        except (TypeError, ValueError) as exc:
            raise OrderCrudError("Invalid quantity.") from exc
        if quantity <= 0:
            raise OrderCrudError("Item quantity must be at least 1.")
        product = products.get(product_id)
        if product is None:
            raise OrderCrudError(f"Product '{product_id}' was not found.")
        line_total = round(product["price"] * quantity, 2)
        subtotal += line_total
        line_items.append(
            {
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": product["price"],
            }
        )

    subtotal = round(subtotal, 2)
    customer_name = sanitize_text(
        payload.get("customer_name", "Guest"), max_length=100
    )
    customer_email = validate_email(
        payload.get("customer_email", "guest@example.com")
    )
    status = str(payload.get("status", "pending")).lower()
    if status not in ("pending", "confirmed", "shipped", "cancelled"):
        raise OrderCrudError("Invalid order status.")

    order_id = uuid.uuid4().hex[:12].upper()
    db = get_db()
    db.execute(
        """
        INSERT INTO orders (
            id, user_id, customer_name, customer_email, subtotal, discount_code,
            discount_amount, total, payment_last4, status
        ) VALUES (?, ?, ?, ?, ?, NULL, 0, ?, '0000', ?)
        """,
        (
            order_id,
            user_id,
            customer_name,
            customer_email,
            subtotal,
            subtotal,
            status,
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
    db.commit()
    return get_order_detail(order_id)  # type: ignore[return-value]


def update_order_record(order_id: str, payload: dict, *, is_admin: bool) -> dict:
    order = get_order_detail(order_id.upper())
    if order is None:
        raise OrderCrudError("Order not found.")

    updates: list[str] = []
    values: list = []

    if is_admin and "status" in payload:
        status = str(payload["status"]).lower()
        if status not in ("pending", "confirmed", "shipped", "cancelled"):
            raise OrderCrudError("Invalid order status.")
        updates.append("status = ?")
        values.append(status)

    if "customer_name" in payload:
        updates.append("customer_name = ?")
        values.append(sanitize_text(str(payload["customer_name"]), max_length=100))

    if "customer_email" in payload:
        updates.append("customer_email = ?")
        values.append(validate_email(str(payload["customer_email"])))

    if not updates:
        return order

    values.append(order_id.upper())
    db = get_db()
    db.execute(f"UPDATE orders SET {', '.join(updates)} WHERE id = ?", values)
    db.commit()
    return get_order_detail(order_id.upper())  # type: ignore[return-value]


def delete_order_record(order_id: str) -> None:
    db = get_db()
    row = db.execute("SELECT id FROM orders WHERE id = ?", (order_id.upper(),)).fetchone()
    if row is None:
        raise OrderCrudError("Order not found.")
    db.execute("DELETE FROM order_items WHERE order_id = ?", (order_id.upper(),))
    db.execute("DELETE FROM orders WHERE id = ?", (order_id.upper(),))
    db.commit()
