import pytest

from tests.helpers.test_data import (
    DISCOUNT_CODES,
    INVALID_CARDS,
    PRODUCT_IDS,
    build_cart_items,
    build_checkout_payload,
    build_payment,
    discount_validate_payload,
    valid_checkout_payload,
)


@pytest.mark.negative
class TestNegativeCheckoutFlow:
    def test_tc_n01_empty_cart_rejected(self, client):
        payload = build_checkout_payload(items=[])
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "empty" in response.get_json()["message"].lower()

    def test_tc_n02_invalid_discount_code_rejected(self, client):
        response = client.post(
            "/api/discounts/validate",
            json=discount_validate_payload(DISCOUNT_CODES["invalid"], 100),
        )
        assert response.status_code == 400
        assert response.get_json()["valid"] is False

    def test_tc_n03_expired_discount_code_rejected(self, client):
        response = client.post(
            "/api/discounts/validate",
            json=discount_validate_payload(DISCOUNT_CODES["expired"], 100),
        )
        assert response.status_code == 400
        assert "expired" in response.get_json()["message"].lower()

    def test_tc_n04_discount_below_minimum_order(self, client):
        response = client.post(
            "/api/discounts/validate",
            json=discount_validate_payload(DISCOUNT_CODES["welcome20"], 34.99),
        )
        assert response.status_code == 400
        assert "minimum" in response.get_json()["message"].lower()

    def test_tc_n05_invalid_luhn_card_rejected(self, client):
        payload = build_checkout_payload(payment=build_payment(card_number=INVALID_CARDS["luhn_fail"]))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "invalid" in response.get_json()["message"].lower()

    def test_tc_n06_declined_card_rejected(self, client):
        payload = build_checkout_payload(payment=build_payment(card_number=INVALID_CARDS["declined"]))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "declined" in response.get_json()["message"].lower()

    @pytest.mark.parametrize("cvv", ["12", "12345"])
    def test_tc_n07_invalid_cvv_rejected(self, client, cvv):
        payload = build_checkout_payload(payment=build_payment(cvv=cvv))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "cvv" in response.get_json()["message"].lower()

    def test_tc_n08_expired_card_rejected(self, client):
        payload = build_checkout_payload(payment=build_payment(expiry="01/20"))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "expired" in response.get_json()["message"].lower()

    def test_tc_n09_invalid_expiry_format_rejected(self, client):
        payload = build_checkout_payload(payment=build_payment(expiry="2026-12"))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "expiry" in response.get_json()["message"].lower()

    def test_tc_n10_invalid_email_rejected(self, client):
        payload = build_checkout_payload(customer_email="not-an-email")
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "email" in response.get_json()["message"].lower()

    def test_tc_n11_unknown_product_rejected(self, client):
        payload = build_checkout_payload(items=build_cart_items(("999", 1)))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "not found" in response.get_json()["message"].lower()

    def test_tc_n12_zero_quantity_rejected(self, client):
        payload = build_checkout_payload(items=build_cart_items((PRODUCT_IDS["mug"], 0)))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "quantity" in response.get_json()["message"].lower()

    def test_tc_n13_order_not_found_returns_404(self, client):
        response = client.get("/api/orders/DOESNOTEXIST")
        assert response.status_code == 404

    def test_tc_n14_empty_discount_code_rejected(self, client):
        response = client.post(
            "/api/discounts/validate",
            json=discount_validate_payload("", 100),
        )
        assert response.status_code == 400

    def test_tc_n15_short_card_number_rejected(self, client):
        payload = build_checkout_payload(payment=build_payment(card_number=INVALID_CARDS["too_short"]))
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
