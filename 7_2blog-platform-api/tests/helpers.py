"""HTTP helpers reused by pytest cases."""

from __future__ import annotations

import uuid

from werkzeug.test import TestResponse


def register_user(client, *, password: str = "Str0ngPw!demo") -> tuple[str, str]:
    """Return ``(email, password)`` for a freshly registered account."""

    email = f"t_{uuid.uuid4().hex[:12]}@example.com"
    r = client.post(
        "/api/users",
        json={"name": "Test User", "email": email, "password": password},
    )
    assert r.status_code == 201, r.get_json()
    return email, password


def login_token(client, email: str, password: str) -> str:
    r = client.post("/api/sessions", json={"email": email, "password": password})
    assert r.status_code == 200
    payload = r.get_json()
    return payload["data"]["access_token"]


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def assert_json_envelope_posts(response: TestResponse):
    payload = response.get_json()
    assert response.status_code == 200
    assert "data" in payload and "meta" in payload
    assert isinstance(payload["data"], list)
