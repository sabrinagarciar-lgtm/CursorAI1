"""Orders API tests — role-based list/detail access (My Orders / All Orders UI)."""

import pytest

from tests.conftest import auth_headers, post_checkout
from tests.helpers.test_data import build_order_payload, build_user_payload

ORDER_LIST_FIELDS = {
    "order_id",
    "status",
    "customer_name",
    "customer_email",
    "subtotal",
    "discount_amount",
    "total",
    "payment_last4",
    "created_at",
    "items",
    "user_id",
}


@pytest.fixture()
def second_customer_token(client):
    payload = build_user_payload(
        email="second.customer@example.com",
        password="securepass2",
        name="Second Customer",
    )
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    return response.get_json()["token"]


def _create_order(client, token: str, *, email_suffix: str = "") -> dict:
    payload = build_order_payload(
        customer_email=f"buyer{email_suffix}@example.com",
        customer_name=f"Buyer {email_suffix or 'A'}",
    )
    response = client.post(
        "/api/orders",
        json=payload,
        headers=auth_headers(token),
    )
    assert response.status_code == 201
    return response.get_json()


@pytest.mark.orders
class TestOrderListing:
    def test_list_orders_requires_authentication(self, client):
        response = client.get("/api/orders")
        assert response.status_code == 401

    def test_customer_sees_only_own_orders(self, client, customer_token, second_customer_token):
        order_a = _create_order(client, customer_token, email_suffix="-a")
        order_b = _create_order(client, second_customer_token, email_suffix="-b")

        response = client.get("/api/orders", headers=auth_headers(customer_token))
        assert response.status_code == 200
        orders = response.get_json()
        order_ids = {o["order_id"] for o in orders}

        assert order_a["order_id"] in order_ids
        assert order_b["order_id"] not in order_ids
        assert all(o.get("user_id") == order_a["user_id"] for o in orders)

    def test_second_customer_sees_only_their_orders(
        self, client, customer_token, second_customer_token
    ):
        order_a = _create_order(client, customer_token, email_suffix="-a2")
        order_b = _create_order(client, second_customer_token, email_suffix="-b2")

        response = client.get(
            "/api/orders", headers=auth_headers(second_customer_token)
        )
        order_ids = {o["order_id"] for o in response.get_json()}

        assert order_b["order_id"] in order_ids
        assert order_a["order_id"] not in order_ids

    def test_admin_sees_all_customer_orders(
        self, client, admin_token, customer_token, second_customer_token
    ):
        order_a = _create_order(client, customer_token, email_suffix="-admin-a")
        order_b = _create_order(client, second_customer_token, email_suffix="-admin-b")

        response = client.get("/api/orders", headers=auth_headers(admin_token))
        assert response.status_code == 200
        order_ids = {o["order_id"] for o in response.get_json()}

        assert order_a["order_id"] in order_ids
        assert order_b["order_id"] in order_ids

    def test_customer_empty_list_when_no_orders(self, client, second_customer_token):
        response = client.get(
            "/api/orders", headers=auth_headers(second_customer_token)
        )
        assert response.status_code == 200
        assert response.get_json() == []

    def test_list_response_includes_frontend_fields(self, client, customer_token):
        _create_order(client, customer_token)
        order = client.get(
            "/api/orders", headers=auth_headers(customer_token)
        ).get_json()[0]

        assert ORDER_LIST_FIELDS.issubset(order.keys())
        assert isinstance(order["items"], list)
        assert len(order["items"]) >= 1
        item = order["items"][0]
        assert {"product_id", "title", "quantity", "unit_price"}.issubset(item.keys())


@pytest.mark.orders
class TestOrderDetailAccess:
    def test_customer_can_get_own_order(self, client, customer_token):
        created = _create_order(client, customer_token)
        response = client.get(
            f"/api/orders/{created['order_id']}",
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 200
        assert response.get_json()["order_id"] == created["order_id"]

    def test_customer_cannot_get_other_customers_order(
        self, client, customer_token, second_customer_token
    ):
        other = _create_order(client, second_customer_token, email_suffix="-other")
        response = client.get(
            f"/api/orders/{other['order_id']}",
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 403

    def test_admin_can_get_any_customers_order(
        self, client, admin_token, customer_token
    ):
        created = _create_order(client, customer_token, email_suffix="-admin-view")
        response = client.get(
            f"/api/orders/{created['order_id']}",
            headers=auth_headers(admin_token),
        )
        assert response.status_code == 200
        assert response.get_json()["customer_email"] == created["customer_email"]

    def test_owned_order_requires_auth_when_user_id_set(
        self, client, customer_token
    ):
        created = _create_order(client, customer_token)
        response = client.get(f"/api/orders/{created['order_id']}")
        assert response.status_code == 401

    def test_guest_checkout_order_readable_without_auth(self, client):
        checkout = post_checkout(client)
        assert checkout.status_code == 201
        order_id = checkout.get_json()["order"]["order_id"]

        response = client.get(f"/api/orders/{order_id}")
        assert response.status_code == 200
        body = response.get_json()
        assert body["order_id"] == order_id
        assert body.get("user_id") is None

    def test_guest_checkout_not_in_customer_order_list(
        self, client, customer_token
    ):
        guest_checkout = post_checkout(client)
        guest_id = guest_checkout.get_json()["order"]["order_id"]

        listed = client.get(
            "/api/orders", headers=auth_headers(customer_token)
        ).get_json()
        assert guest_id not in {o["order_id"] for o in listed}

    def test_authenticated_checkout_appears_in_customer_list(
        self, client, customer_token
    ):
        checkout = post_checkout(client, headers=auth_headers(customer_token))
        order_id = checkout.get_json()["order"]["order_id"]

        listed = client.get(
            "/api/orders", headers=auth_headers(customer_token)
        ).get_json()
        match = next(o for o in listed if o["order_id"] == order_id)
        assert match.get("user_id") is not None


@pytest.mark.orders
class TestCheckoutOrderOwnership:
    def test_checkout_while_signed_in_links_user_id(
        self, client, customer_token
    ):
        me = client.get("/api/auth/me", headers=auth_headers(customer_token)).get_json()
        checkout = post_checkout(client, headers=auth_headers(customer_token))
        assert checkout.status_code == 201
        order = checkout.get_json()["order"]

        assert order.get("user_id") == me["id"]

        listed = client.get(
            "/api/orders", headers=auth_headers(customer_token)
        ).get_json()
        assert any(o["order_id"] == order["order_id"] for o in listed)

    def test_checkout_guest_does_not_link_user_id(self, client):
        checkout = post_checkout(client)
        order = checkout.get_json()["order"]
        assert order.get("user_id") is None
