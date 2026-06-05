"""Tests for integrated platform modules: analytics, kanban, social, tickets, settings."""

import pytest

from tests.conftest import auth_headers, login


@pytest.mark.platform
class TestAnalyticsApi:
    def test_dashboard_metrics(self, client):
        response = client.get("/api/analytics/dashboard")
        assert response.status_code == 200
        body = response.get_json()
        assert "kpis" in body
        assert "transactions" in body
        assert "revenue" in body["kpis"]


@pytest.mark.platform
class TestKanbanApi:
    def test_list_and_create_task(self, client):
        response = client.get("/api/kanban/tasks")
        assert response.status_code == 200
        assert len(response.get_json()) >= 1

        create = client.post(
            "/api/kanban/tasks",
            json={"title": "New task", "columnId": "todo", "priority": "high"},
        )
        assert create.status_code == 201
        task_id = int(create.get_json()["id"])

        update = client.put(
            f"/api/kanban/tasks/{task_id}",
            json={"columnId": "done"},
        )
        assert update.status_code == 200
        assert update.get_json()["columnId"] == "done"

        delete = client.delete(f"/api/kanban/tasks/{task_id}")
        assert delete.status_code == 204

    def test_create_task_validation(self, client):
        response = client.post("/api/kanban/tasks", json={"title": ""})
        assert response.status_code == 400


@pytest.mark.platform
class TestSocialApi:
    def test_list_and_create_posts(self, client):
        response = client.get("/api/social/posts")
        assert response.status_code == 200
        body = response.get_json()
        assert "posts" in body

        create = client.post(
            "/api/social/posts",
            json={"content": "Hello from test", "authorName": "Tester"},
        )
        assert create.status_code == 201
        post_id = int(create.get_json()["id"])

        like = client.post(f"/api/social/posts/{post_id}/like")
        assert like.status_code == 200

        comment = client.post(
            f"/api/social/posts/{post_id}/comments",
            json={"content": "Nice post!", "authorName": "Commenter"},
        )
        assert comment.status_code == 201


@pytest.mark.platform
class TestTicketsApi:
    def test_create_ticket_public(self, client):
        response = client.post(
            "/api/tickets",
            json={
                "title": "Login issue",
                "description": "Cannot sign in",
                "customerEmail": "test@example.com",
            },
        )
        assert response.status_code == 201
        assert response.get_json()["status"] == "open"

    def test_list_tickets_requires_auth(self, client):
        response = client.get("/api/tickets")
        assert response.status_code == 401

    def test_list_tickets_authenticated(self, client, customer_token):
        response = client.get("/api/tickets", headers=auth_headers(customer_token))
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_update_ticket_admin_only(self, client, customer_token, admin_token):
        create = client.post(
            "/api/tickets",
            json={
                "title": "Billing",
                "description": "Overcharged",
                "customerEmail": "bill@example.com",
            },
        )
        ticket_id = create.get_json()["id"]

        denied = client.patch(
            f"/api/tickets/{ticket_id}",
            json={"status": "resolved"},
            headers=auth_headers(customer_token),
        )
        assert denied.status_code == 403

        allowed = client.patch(
            f"/api/tickets/{ticket_id}",
            json={"status": "resolved"},
            headers=auth_headers(admin_token),
        )
        assert allowed.status_code == 200


@pytest.mark.platform
class TestSettingsApi:
    def test_settings_crud(self, client, customer_token):
        headers = auth_headers(customer_token)
        get_resp = client.get("/api/settings", headers=headers)
        assert get_resp.status_code == 200
        assert "profile" in get_resp.get_json()

        put_resp = client.put(
            "/api/settings",
            headers=headers,
            json={"appearance": {"theme": "dark", "density": "compact", "reducedMotion": True}},
        )
        assert put_resp.status_code == 200
        assert put_resp.get_json()["appearance"]["theme"] == "dark"


@pytest.mark.platform
class TestProductSearch:
    def test_product_search_filters(self, client):
        response = client.get("/api/products?search=headphones")
        assert response.status_code == 200
        body = response.get_json()
        assert "items" in body
        assert body["total"] >= 1

    def test_product_category_filter(self, client):
        response = client.get("/api/products?category=electronics")
        assert response.status_code == 200
        items = response.get_json()["items"]
        assert all(i.get("category") == "electronics" for i in items)

    def test_product_price_and_sort_filters(self, client):
        response = client.get("/api/products?minPrice=100&sort=price-desc&page=1&perPage=2")
        assert response.status_code == 200
        body = response.get_json()
        assert body["perPage"] == 2


@pytest.mark.platform
class TestPlatformErrorPaths:
    def test_kanban_invalid_column(self, client):
        response = client.post(
            "/api/kanban/tasks",
            json={"title": "Bad", "columnId": "invalid"},
        )
        assert response.status_code == 400

    def test_kanban_not_found(self, client):
        response = client.put("/api/kanban/tasks/99999", json={"title": "X"})
        assert response.status_code == 404

    def test_social_empty_post(self, client):
        response = client.post("/api/social/posts", json={"content": "  "})
        assert response.status_code == 400

    def test_social_like_not_found(self, client):
        response = client.post("/api/social/posts/99999/like")
        assert response.status_code == 404

    def test_ticket_missing_fields(self, client):
        response = client.post("/api/tickets", json={"title": ""})
        assert response.status_code == 400

    def test_ticket_get_not_found(self, client, customer_token):
        response = client.get(
            "/api/tickets/99999",
            headers=auth_headers(customer_token),
        )
        assert response.status_code == 404

    def test_health_endpoint(self, client):
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.get_json()["service"] == "cursorhub-platform"
