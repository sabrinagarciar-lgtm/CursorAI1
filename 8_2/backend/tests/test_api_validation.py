"""Input validation API tests."""

import pytest

from tests.conftest import auth_headers
from tests.helpers.test_data import build_product_payload, build_user_payload


@pytest.mark.validation
class TestInputValidation:
    def test_register_short_password_rejected(self, client):
        response = client.post(
            "/api/auth/register",
            json=build_user_payload(password="short"),
        )
        assert response.status_code == 400

    def test_register_invalid_email_rejected(self, client):
        response = client.post(
            "/api/auth/register",
            json=build_user_payload(email="not-an-email"),
        )
        assert response.status_code == 400

    def test_create_product_missing_title_rejected(self, client, admin_token):
        payload = build_product_payload()
        del payload["title"]
        response = client.post(
            "/api/products",
            json=payload,
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 400

    def test_create_product_negative_price_rejected(self, client, admin_token):
        response = client.post(
            "/api/products",
            json=build_product_payload(price=-5),
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 400

    def test_create_order_empty_items_rejected(self, client, customer_token):
        response = client.post(
            "/api/orders",
            json={"customer_name": "X", "customer_email": "x@example.com", "items": []},
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 400

    def test_create_order_unknown_product_rejected(self, client, customer_token):
        response = client.post(
            "/api/orders",
            json={
                "customer_name": "X",
                "customer_email": "x@example.com",
                "items": [{"product_id": "99999", "quantity": 1}],
            },
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 400

    def test_create_user_invalid_role_rejected(self, client, admin_token):
        response = client.post(
            "/api/users",
            json=build_user_payload(email="badrole@example.com", role="superuser"),
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 400

    def test_update_order_invalid_status_rejected(self, client, admin_token, customer_token):
        created = client.post(
            "/api/orders",
            json={
                "customer_name": "Val",
                "customer_email": "val@example.com",
                "items": [{"product_id": "1", "quantity": 1}],
            },
            headers=auth_headers(customer_token),
        ).get_json()
        response = client.put(
            f"/api/orders/{created['order_id']}",
            json={"status": "invalid-status"},
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 400
