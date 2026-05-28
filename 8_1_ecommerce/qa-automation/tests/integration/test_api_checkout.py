"""Integration tests: checkout and order retrieval API."""
import pytest

from tests.helpers.test_data import valid_checkout_payload


@pytest.mark.integration
class TestCheckoutAPI:
    def test_checkout_creates_confirmed_order(self, client):
        response = client.post("/api/checkout", json=valid_checkout_payload())
        assert response.status_code == 201
        body = response.get_json()
        assert body["success"] is True
        order = body["order"]
        assert order["status"] == "confirmed"
        order_id = order["order_id"]

        get_resp = client.get(f"/api/orders/{order_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.get_json()
        assert fetched["order_id"] == order_id

    def test_checkout_rejects_empty_cart(self, client):
        payload = valid_checkout_payload()
        payload["items"] = []
        response = client.post("/api/checkout", json=payload)
        assert response.status_code in (400, 422)
