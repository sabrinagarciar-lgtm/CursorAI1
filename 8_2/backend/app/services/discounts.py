import sqlite3

from app.db import get_db


class DiscountError(Exception):
    pass


def lookup_discount_code(code: str) -> sqlite3.Row:
    db = get_db()
    row = db.execute(
        """
        SELECT code, discount_type, value, min_order, max_uses, uses_count, active
        FROM discount_codes
        WHERE code = ?
        """,
        (code.upper(),),
    ).fetchone()
    if row is None:
        raise DiscountError("Invalid discount code.")
    if not row["active"]:
        raise DiscountError("This discount code has expired.")
    if row["max_uses"] is not None and row["uses_count"] >= row["max_uses"]:
        raise DiscountError("This discount code has reached its usage limit.")
    return row


def calculate_discount(subtotal: float, discount_row: sqlite3.Row) -> float:
    if subtotal < discount_row["min_order"]:
        raise DiscountError(
            f"Minimum order of ${discount_row['min_order']:.2f} required for this code."
        )

    if discount_row["discount_type"] == "percent":
        amount = round(subtotal * (discount_row["value"] / 100), 2)
    else:
        amount = round(min(discount_row["value"], subtotal), 2)

    return amount


def increment_discount_usage(code: str) -> None:
    db = get_db()
    db.execute(
        """
        UPDATE discount_codes
        SET uses_count = uses_count + 1
        WHERE code = ?
        """,
        (code.upper(),),
    )
    db.commit()
