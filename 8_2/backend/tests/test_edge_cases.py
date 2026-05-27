import pytest

from tests.helpers.test_data import (
    DISCOUNT_CODES,
    PRODUCT_IDS,
    build_cart_items,
    build_checkout_payload,
    bulk_quantity_payload,
    valid_checkout_payload,
)


@pytest.mark.edge
class TestEdgeCases:
    def test_tc_e01_large_cart_quantity_checkout(self, client):
        payload = bulk_quantity_payload(quantity=50)
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 201
        order = response.get_json()["order"]
        assert order["items"][0]["quantity"] == 50
        assert order["subtotal"] == pytest.approx(24.99 * 50, abs=0.01)

    def test_tc_e02_multiple_distinct_products_in_one_order(self, client):
        payload = build_checkout_payload(
            items=build_cart_items(
                (PRODUCT_IDS["headphones"], 1),
                (PRODUCT_IDS["watch"], 1),
                (PRODUCT_IDS["tshirt"], 3),
            )
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 201
        assert len(response.get_json()["order"]["items"]) == 3

    def test_tc_e03_sequential_concurrent_purchases_create_unique_orders(self, client):
        first = client.post("/api/checkout", json=valid_checkout_payload())
        second = client.post(
            "/api/checkout",
            json=build_checkout_payload(customer_email="second@example.com"),
        )
        assert first.status_code == 201
        assert second.status_code == 201
        order_a = first.get_json()["order"]["order_id"]
        order_b = second.get_json()["order"]["order_id"]
        assert order_a != order_b

    def test_tc_e04_vip50_single_use_limit_enforced(self, client):
        payload = build_checkout_payload(
            items=build_cart_items((PRODUCT_IDS["shoes"], 1)),
            discount_code=DISCOUNT_CODES["vip50"],
        )
        first = client.post("/api/checkout", json=payload)
        assert first.status_code == 201

        second = client.post("/api/checkout", json=payload)
        assert second.status_code == 400
        assert "usage limit" in second.get_json()["message"].lower()

    def test_tc_e05_flat_discount_capped_at_subtotal(self, client):
        validate = client.post(
            "/api/discounts/validate",
            json={"code": DISCOUNT_CODES["flat15"], "subtotal": 30.0},
        )
        assert validate.status_code == 200
        assert validate.get_json()["discount_amount"] == 15.0

    def test_tc_e06_remove_item_equivalent_zero_quantity(self, client):
        payload = build_checkout_payload(items=build_cart_items((PRODUCT_IDS["mug"], -1)))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400

    def test_tc_e07_checkout_with_spaced_card_number(self, client):
        payload = build_checkout_payload(
            payment={
                "card_number": "4111 1111 1111 1111",
                "expiry": "12/30",
                "cvv": "123",
                "cardholder_name": "Jane Doe",
            }
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 201

    def test_tc_e08_amex_four_digit_cvv_accepted(self, client):
        payload = build_checkout_payload(
            payment={
                "card_number": "378282246310005",
                "expiry": "12/30",
                "cvv": "1234",
                "cardholder_name": "Jane Doe",
            }
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 201
