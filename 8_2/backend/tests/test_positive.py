import pytest

from tests.helpers.test_data import (
    DISCOUNT_CODES,
    PRODUCT_IDS,
    build_cart_items,
    build_checkout_payload,
    discount_validate_payload,
    multi_item_payload,
    valid_checkout_payload,
)


@pytest.mark.positive
class TestPositiveCheckoutFlow:
    def test_tc_p01_list_products_returns_catalog(self, client):
        response = client.get("/api/products")
        assert response.status_code == 200
        products = response.get_json()
        assert len(products) >= 6
        assert all(key in products[0] for key in ("id", "title", "price", "imageUrl"))

    def test_tc_p02_single_item_checkout_success(self, client):
        response = client.post("/api/checkout", json=valid_checkout_payload())
        assert response.status_code == 201
        body = response.get_json()
        assert body["success"] is True
        assert body["order"]["status"] == "confirmed"
        assert body["order"]["total"] == body["order"]["subtotal"]

    def test_tc_p03_multi_item_checkout_success(self, client):
        response = client.post("/api/checkout", json=multi_item_payload())
        assert response.status_code == 201
        order = response.get_json()["order"]
        assert len(order["items"]) == 2
        assert order["subtotal"] > 0

    @pytest.mark.parametrize(
        "code,product_id,qty",
        [
            (DISCOUNT_CODES["save10"], PRODUCT_IDS["headphones"], 1),
            (DISCOUNT_CODES["welcome20"], PRODUCT_IDS["shoes"], 1),
            (DISCOUNT_CODES["flat15"], PRODUCT_IDS["shoes"], 1),
        ],
        ids=["save10", "welcome20", "flat15"],
    )
    def test_tc_p04_checkout_with_valid_discount_codes(self, client, code, product_id, qty):
        payload = build_checkout_payload(
            items=build_cart_items((product_id, qty)),
            discount_code=code,
        )
        response = client.post("/api/checkout", json=payload)
        assert response.status_code == 201
        order = response.get_json()["order"]
        assert order["discount_code"] == code
        assert order["discount_amount"] > 0
        assert order["total"] < order["subtotal"]

    def test_tc_p05_discount_validation_returns_amount(self, client):
        response = client.post(
            "/api/discounts/validate",
            json=discount_validate_payload(DISCOUNT_CODES["save10"], 149.99),
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["valid"] is True
        assert body["discount_amount"] == pytest.approx(15.0, abs=0.01)

    def test_tc_p06_order_confirmation_retrievable_by_id(self, client):
        checkout = client.post("/api/checkout", json=valid_checkout_payload())
        order_id = checkout.get_json()["order"]["order_id"]
        response = client.get(f"/api/orders/{order_id}")
        assert response.status_code == 200
        assert response.get_json()["order_id"] == order_id

    def test_tc_p07_email_notification_logged_on_success(self, client, read_email_log):
        client.post("/api/checkout", json=valid_checkout_payload())
        emails = read_email_log()
        assert len(emails) == 1
        assert emails[0]["to"] == "jane@example.com"

    def test_tc_p08_email_contains_order_summary(self, client, read_email_log):
        checkout = client.post("/api/checkout", json=valid_checkout_payload())
        order_id = checkout.get_json()["order"]["order_id"]
        email = read_email_log()[0]
        assert order_id in email["subject"]
        assert "Wireless Bluetooth Headphones" in email["body"]

    def test_tc_p09_payment_stores_only_last_four_digits(self, client):
        response = client.post("/api/checkout", json=valid_checkout_payload())
        order = response.get_json()["order"]
        assert order["payment_last4"] == "1111"
        assert "4111111111111111" not in str(order)

    def test_tc_p10_checkout_without_discount_code(self, client):
        payload = valid_checkout_payload()
        response = client.post("/api/checkout", json=payload)
        order = response.get_json()["order"]
        assert order["discount_code"] is None
        assert order["discount_amount"] == 0
