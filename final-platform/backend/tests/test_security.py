import pytest

from tests.helpers.test_data import (
    PRODUCT_IDS,
    SQL_INJECTION_PAYLOADS,
    VALID_CARDS,
    build_cart_items,
    build_checkout_payload,
    build_payment,
    valid_checkout_payload,
)


@pytest.mark.security
class TestSecurityScenarios:
    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS[:2])
    def test_tc_s01_sql_injection_in_discount_code_blocked(self, client, payload):
        response = client.post(
            "/api/discounts/validate",
            json={"code": payload, "subtotal": 100},
        )
        assert response.status_code == 400
        assert "unsafe" in response.get_json()["message"].lower() or response.get_json()["valid"] is False

    def test_tc_s02_sql_injection_in_customer_name_blocked(self, client):
        payload = build_checkout_payload(customer_name=SQL_INJECTION_PAYLOADS[1])
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
        assert "unsafe" in response.get_json()["message"].lower()

    def test_tc_s03_sql_injection_in_email_blocked(self, client):
        payload = build_checkout_payload(customer_email=SQL_INJECTION_PAYLOADS[2])
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400

    def test_tc_s04_union_injection_in_cardholder_name_blocked(self, client):
        payload = build_checkout_payload(
            payment=build_payment(cardholder_name=SQL_INJECTION_PAYLOADS[3])
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400

    def test_tc_s05_database_intact_after_injection_attempts(self, client):
        client.post(
            "/api/checkout",
            json=build_checkout_payload(customer_name=SQL_INJECTION_PAYLOADS[1]),
        )
        products = client.get("/api/products")
        assert products.status_code == 200
        assert len(products.get_json()["items"]) >= 1

    def test_tc_s06_oversized_customer_name_rejected(self, client):
        payload = build_checkout_payload(customer_name="A" * 101)
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400

    def test_tc_s07_sql_payload_in_card_number_rejected(self, client):
        payload = build_checkout_payload(
            payment=build_payment(card_number="4111'; DROP TABLE orders;--")
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400

    def test_tc_s08_full_pan_not_in_order_response(self, client):
        response = client.post("/api/checkout", json=valid_checkout_payload())
        assert VALID_CARDS["visa_success"] not in response.get_data(as_text=True)

    def test_tc_s09_full_pan_not_in_email_log(self, client, read_email_log):
        client.post("/api/checkout", json=valid_checkout_payload())
        log_text = str(read_email_log())
        assert VALID_CARDS["visa_success"] not in log_text
        assert "1111" in log_text or "Total charged" in log_text

    def test_tc_s10_order_lookup_uses_parameterized_query(self, client):
        checkout = client.post("/api/checkout", json=valid_checkout_payload())
        order_id = checkout.get_json()["order"]["order_id"]
        malicious = f"{order_id}' OR '1'='1"
        response = client.get(f"/api/orders/{malicious}")
        assert response.status_code == 404

    def test_tc_s11_successful_order_does_not_persist_full_card(self, client):
        response = client.post("/api/checkout", json=valid_checkout_payload())
        order = response.get_json()["order"]
        assert len(order["payment_last4"]) == 4

    def test_tc_s12_delete_injection_in_product_id_rejected(self, client):
        payload = build_checkout_payload(
            items=build_cart_items(("1; DELETE FROM products", 1))
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 400
