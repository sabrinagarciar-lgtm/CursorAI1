"""Authorization API tests — role-based access control."""

import pytest

from tests.conftest import auth_headers
from tests.helpers.test_data import build_product_payload, build_user_payload


@pytest.mark.authorization
class TestAuthorization:
    def test_customer_cannot_list_users(self, client, customer_token):
        response = client.get("/api/users", headers=auth_headers(customer_token))
        assert response.status_code == 403

    def test_admin_can_list_users(self, client, admin_token):
        response = client.get("/api/users", headers=auth_headers(admin_token))
        assert response.status_code == 200
        assert len(response.get_json()) >= 2

    def test_customer_cannot_create_product(self, client, customer_token):
        response = client.post(
            "/api/products",
            json=build_product_payload(),
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 403

    def test_admin_can_create_product(self, client, admin_token):
        response = client.post(
            "/api/products",
            json=build_product_payload(product_id="auth99"),
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 201

    def test_customer_can_read_own_profile(self, client, customer_token):
        me = client.get("/api/auth/me", headers=auth_headers(customer_token)).get_json()
        response = client.get(
            f"/api/users/{me['id']}", headers=auth_headers(customer_token)
        )
        assert response.status_code == 200

    def test_customer_cannot_read_other_user(self, client, customer_token, admin_token):
        admin = client.get("/api/auth/me", headers=auth_headers(admin_token)).get_json()
        response = client.get(
            f"/api/users/{admin['id']}", headers=auth_headers(customer_token)
        )
        assert response.status_code == 403

    def test_admin_can_delete_order(self, client, admin_token, customer_token):
        order_resp = client.post(
            "/api/orders",
            json={
                "customer_name": "Auth Test",
                "customer_email": "auth@example.com",
                "items": [{"product_id": "1", "quantity": 1}],
            },
            headers=auth_headers(customer_token),
        )
        order_id = order_resp.get_json()["order_id"]
        response = client.delete(
            f"/api/orders/{order_id}", headers=auth_headers(admin_token)
        )
        assert response.status_code == 204

    def test_customer_cannot_delete_order(self, client, customer_token):
        order_resp = client.post(
            "/api/orders",
            json={
                "customer_name": "Auth Test",
                "customer_email": "auth@example.com",
                "items": [{"product_id": "1", "quantity": 1}],
            },
            headers=auth_headers(customer_token),
        )
        order_id = order_resp.get_json()["order_id"]
        response = client.delete(
            f"/api/orders/{order_id}", headers=auth_headers(customer_token)
        )
        assert response.status_code == 403

    def test_admin_can_create_user(self, client, admin_token):
        response = client.post(
            "/api/users",
            json=build_user_payload(email="staff@example.com", role="customer"),
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 201

    def test_unauthenticated_cannot_create_user(self, client):
        response = client.post(
            "/api/users",
            json=build_user_payload(email="anon@example.com"),
        )
        assert response.status_code == 401

    def test_customer_cannot_get_other_customers_order(
        self, client, customer_token, admin_token
    ):
        other = client.post(
            "/api/users",
            json=build_user_payload(email="peer@example.com"),
            headers=auth_headers(admin_token),
        ).get_json()
        peer_token = client.post(
            "/api/auth/login",
            json={"email": "peer@example.com", "password": "securepass1"},
        ).get_json()["token"]

        order_id = client.post(
            "/api/orders",
            json={
                "customer_name": "Peer",
                "customer_email": "peer@example.com",
                "items": [{"product_id": "1", "quantity": 1}],
            },
            headers=auth_headers(peer_token),
        ).get_json()["order_id"]

        response = client.get(
            f"/api/orders/{order_id}", headers=auth_headers(customer_token)
        )
        assert response.status_code == 403
        assert other["id"] != client.get(
            "/api/auth/me", headers=auth_headers(customer_token)
        ).get_json()["id"]
