"""Performance API tests — response time under 500ms."""

import time

import pytest

from tests.conftest import auth_headers

MAX_RESPONSE_MS = 500


def _elapsed_ms(start: float) -> float:
    return (time.perf_counter() - start) * 1000


@pytest.mark.performance
class TestPerformance:
    def test_get_products_under_500ms(self, client):
        start = time.perf_counter()
        response = client.get("/api/products")
        elapsed = _elapsed_ms(start)
        assert response.status_code == 200
        assert elapsed < MAX_RESPONSE_MS, f"GET /api/products took {elapsed:.1f}ms"

    def test_get_product_by_id_under_500ms(self, client):
        start = time.perf_counter()
        response = client.get("/api/products/1")
        elapsed = _elapsed_ms(start)
        assert response.status_code == 200
        assert elapsed < MAX_RESPONSE_MS

    def test_auth_login_under_500ms(self, client):
        from tests.helpers.test_data import CUSTOMER_CREDENTIALS

        start = time.perf_counter()
        response = client.post(
            "/api/auth/login",
            json={
                "email": CUSTOMER_CREDENTIALS["email"],
                "password": CUSTOMER_CREDENTIALS["password"],
            },
        )
        elapsed = _elapsed_ms(start)
        assert response.status_code == 200
        assert elapsed < MAX_RESPONSE_MS

    def test_get_orders_under_500ms(self, client, customer_token):
        start = time.perf_counter()
        response = client.get(
            "/api/orders", headers=auth_headers(customer_token)
        )
        elapsed = _elapsed_ms(start)
        assert response.status_code == 200
        assert elapsed < MAX_RESPONSE_MS

    def test_post_order_under_500ms(self, client, customer_token):
        from tests.helpers.test_data import build_order_payload

        start = time.perf_counter()
        response = client.post(
            "/api/orders",
            json=build_order_payload(),
            headers=auth_headers(customer_token),
        )
        elapsed = _elapsed_ms(start)
        assert response.status_code == 201
        assert elapsed < MAX_RESPONSE_MS

    def test_admin_list_orders_under_500ms(self, client, admin_token, customer_token):
        from tests.helpers.test_data import build_order_payload

        client.post(
            "/api/orders",
            json=build_order_payload(),
            headers=auth_headers(customer_token),
        )
        start = time.perf_counter()
        response = client.get("/api/orders", headers=auth_headers(admin_token))
        elapsed = _elapsed_ms(start)
        assert response.status_code == 200
        assert elapsed < MAX_RESPONSE_MS
