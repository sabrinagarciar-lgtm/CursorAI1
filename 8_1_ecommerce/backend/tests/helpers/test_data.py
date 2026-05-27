"""Test data generation strategy for ShopEase checkout tests.

Strategy
--------
1. **Fixtures** – Stable baseline payloads (`valid_checkout_payload`) for happy-path tests.
2. **Factories** – Parameterized builders (`build_checkout_payload`, `build_cart_items`)
   for variations without duplicating JSON blobs.
3. **Catalog constants** – Known product IDs, discount codes, and test cards aligned
   with seeded database data in `app/db.py`.
4. **Edge generators** – Helpers for bulk quantities, injection strings, and invalid
   payment permutations used across negative/security suites.
5. **Isolation** – Each pytest run uses a fresh temp SQLite DB (see `conftest.py`) so
   generated orders never collide across tests.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

# --- Catalog constants (mirror seeded DB) ---

PRODUCT_IDS = {
    "headphones": "1",
    "watch": "2",
    "tshirt": "3",
    "powerbank": "4",
    "mug": "5",
    "shoes": "6",
}

DISCOUNT_CODES = {
    "save10": "SAVE10",
    "welcome20": "WELCOME20",
    "flat15": "FLAT15",
    "vip50": "VIP50",
    "expired": "EXPIRED",
    "invalid": "NOTREAL",
}

VALID_CARDS = {
    "visa_success": "4111111111111111",
    "visa_success_spaced": "4111 1111 1111 1111",
    "amex_success": "378282246310005",
}

INVALID_CARDS = {
    "luhn_fail": "4111111111111112",
    "declined": "4000000000000002",
    "too_short": "411111",
    "empty": "",
}

SQL_INJECTION_PAYLOADS = [
    "SAVE10'; DROP TABLE orders;--",
    "Robert'); DROP TABLE orders;--",
    "test@example.com' OR '1'='1",
    "1 UNION SELECT * FROM orders",
    "'; DELETE FROM orders WHERE '1'='1",
]

DEFAULT_PAYMENT = {
    "card_number": VALID_CARDS["visa_success"],
    "expiry": "12/30",
    "cvv": "123",
    "cardholder_name": "Jane Doe",
}


def build_cart_items(
    *entries: tuple[str, int],
) -> list[dict[str, Any]]:
    """Build cart line items from (product_id, quantity) tuples."""
    return [{"product_id": pid, "quantity": qty} for pid, qty in entries]


def build_payment(
    *,
    card_number: str | None = None,
    expiry: str | None = None,
    cvv: str | None = None,
    cardholder_name: str | None = None,
) -> dict[str, str]:
    payment = deepcopy(DEFAULT_PAYMENT)
    if card_number is not None:
        payment["card_number"] = card_number
    if expiry is not None:
        payment["expiry"] = expiry
    if cvv is not None:
        payment["cvv"] = cvv
    if cardholder_name is not None:
        payment["cardholder_name"] = cardholder_name
    return payment


def build_checkout_payload(
    *,
    customer_name: str = "Jane Doe",
    customer_email: str = "jane@example.com",
    items: list[dict[str, Any]] | None = None,
    discount_code: str | None = None,
    payment: dict[str, str] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "customer_name": customer_name,
        "customer_email": customer_email,
        "items": items if items is not None else build_cart_items((PRODUCT_IDS["headphones"], 1)),
        "payment": payment if payment is not None else build_payment(),
    }
    if discount_code is not None:
        payload["discount_code"] = discount_code
    return payload


def valid_checkout_payload() -> dict[str, Any]:
    return build_checkout_payload()


def multi_item_payload() -> dict[str, Any]:
    return build_checkout_payload(
        items=build_cart_items(
            (PRODUCT_IDS["headphones"], 1),
            (PRODUCT_IDS["mug"], 2),
        )
    )


def bulk_quantity_payload(quantity: int = 50) -> dict[str, Any]:
    return build_checkout_payload(
        items=build_cart_items((PRODUCT_IDS["mug"], quantity))
    )


def discount_validate_payload(code: str, subtotal: float) -> dict[str, Any]:
    return {"code": code, "subtotal": subtotal}
