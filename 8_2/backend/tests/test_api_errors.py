"""Error handling API tests — 404, 400, 500."""

import pytest


@pytest.mark.errors
class TestErrorHandling:
    def test_get_unknown_product_returns_404(self, client):
        response = client.get("/api/products/does-not-exist")
        assert response.status_code == 404
        assert "message" in response.get_json()

    def test_get_unknown_user_returns_404(self, client, admin_token):
        from tests.conftest import auth_headers

        response = client.get(
            "/api/users/99999", headers=auth_headers(admin_token)
        )
        assert response.status_code == 404

    def test_get_unknown_order_returns_404(self, client):
        response = client.get("/api/orders/ZZZZNOTFOUND")
        assert response.status_code == 404

    def test_delete_unknown_user_returns_404(self, client, admin_token):
        from tests.conftest import auth_headers

        response = client.delete(
            "/api/users/99999", headers=auth_headers(admin_token)
        )
        assert response.status_code == 404

    def test_checkout_empty_cart_returns_400(self, client):
        response = client.post(
            "/api/checkout",
            json={
                "customer_name": "Test",
                "customer_email": "test@example.com",
                "items": [],
                "payment": {
                    "card_number": "4111111111111111",
                    "expiry": "12/30",
                    "cvv": "123",
                    "cardholder_name": "Test",
                },
            },
        )
        assert response.status_code == 400

    def test_unknown_api_route_returns_404(self, client):
        response = client.get("/api/unknown-route-xyz")
        assert response.status_code == 404

    def test_simulated_server_error_returns_500(self, client):
        response = client.get("/api/test/trigger-error")
        assert response.status_code == 500
        assert response.get_json()["message"] == "Internal server error."
