"""CRUD API tests — GET, POST, PUT, DELETE for users, products, orders."""

import pytest

from tests.conftest import auth_headers
from tests.helpers.test_data import (
    PRODUCT_IDS,
    build_order_payload,
    build_product_payload,
    build_user_payload,
)


@pytest.mark.crud
class TestProductCrud:
    def test_get_products_list(self, client):
        response = client.get("/api/products")
        assert response.status_code == 200
        assert len(response.get_json()["items"]) >= 6

    def test_get_product_by_id(self, client):
        response = client.get(f"/api/products/{PRODUCT_IDS['mug']}")
        assert response.status_code == 200
        assert response.get_json()["id"] == PRODUCT_IDS["mug"]

    def test_post_product(self, client, admin_token):
        response = client.post(
            "/api/products",
            json=build_product_payload(product_id="crud01"),
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 201
        assert response.get_json()["title"] == "API Test Gadget"

    def test_put_product(self, client, admin_token):
        client.post(
            "/api/products",
            json=build_product_payload(product_id="crud02"),
            headers=auth_headers(admin_token),
        )
        response = client.put(
            "/api/products/crud02",
            json={"title": "Updated Gadget", "price": 29.99},
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 200
        assert response.get_json()["title"] == "Updated Gadget"

    def test_delete_product(self, client, admin_token):
        client.post(
            "/api/products",
            json=build_product_payload(product_id="crud03"),
            headers=auth_headers(admin_token),
        )
        response = client.delete(
            "/api/products/crud03", headers=auth_headers(admin_token)
        )
        assert response.status_code == 204
        assert client.get("/api/products/crud03").status_code == 404


@pytest.mark.crud
class TestUserCrud:
    def test_get_users_as_admin(self, client, admin_token):
        response = client.get("/api/users", headers=auth_headers(admin_token))
        assert response.status_code == 200

    def test_post_user_as_admin(self, client, admin_token):
        response = client.post(
            "/api/users",
            json=build_user_payload(email="crud.user@example.com"),
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 201

    def test_put_user_profile(self, client, customer_token):
        me = client.get("/api/auth/me", headers=auth_headers(customer_token)).get_json()
        response = client.put(
            f"/api/users/{me['id']}",
            json={"name": "Renamed Customer"},
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 200
        assert response.get_json()["name"] == "Renamed Customer"

    def test_delete_user_as_admin(self, client, admin_token):
        create = client.post(
            "/api/users",
            json=build_user_payload(email="todelete@example.com"),
            headers=auth_headers(admin_token),
        )
        user_id = create.get_json()["id"]
        response = client.delete(
            f"/api/users/{user_id}", headers=auth_headers(admin_token)
        )
        assert response.status_code == 204


@pytest.mark.crud
class TestOrderCrud:
    def test_get_orders_requires_auth(self, client):
        assert client.get("/api/orders").status_code == 401

    def test_post_order_as_customer(self, client, customer_token):
        response = client.post(
            "/api/orders",
            json=build_order_payload(),
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 201
        assert response.get_json()["status"] == "pending"

    def test_get_orders_list(self, client, customer_token):
        client.post(
            "/api/orders",
            json=build_order_payload(),
            headers=auth_headers(customer_token),
        )
        response = client.get(
            "/api/orders", headers=auth_headers(customer_token)
        )
        assert response.status_code == 200
        assert len(response.get_json()) >= 1

    def test_put_order_status_as_admin(self, client, admin_token, customer_token):
        created = client.post(
            "/api/orders",
            json=build_order_payload(),
            headers=auth_headers(customer_token),
        ).get_json()
        response = client.put(
            f"/api/orders/{created['order_id']}",
            json={"status": "shipped"},
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 200
        assert response.get_json()["status"] == "shipped"

    def test_get_order_by_id(self, client, customer_token):
        created = client.post(
            "/api/orders",
            json=build_order_payload(),
            headers=auth_headers(customer_token),
        ).get_json()
        order_id = created["order_id"]
        response = client.get(
            f"/api/orders/{order_id}",
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 200
        assert response.get_json()["order_id"] == order_id
