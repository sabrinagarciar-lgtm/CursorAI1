"""Authentication API tests — valid and invalid tokens."""

import time

import jwt
import pytest

from tests.conftest import auth_headers
from tests.helpers.test_data import CUSTOMER_CREDENTIALS, build_user_payload


@pytest.mark.auth
class TestAuthentication:
    def test_login_valid_credentials_returns_token(self, client):
        response = client.post(
            "/api/auth/login",
            json={
                "email": CUSTOMER_CREDENTIALS["email"],
                "password": CUSTOMER_CREDENTIALS["password"],
            },
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["email"] == CUSTOMER_CREDENTIALS["email"]

    def test_login_invalid_password_returns_401(self, client):
        response = client.post(
            "/api/auth/login",
            json={
                "email": CUSTOMER_CREDENTIALS["email"],
                "password": "wrong-password",
            },
        )
        assert response.status_code == 401
        assert "message" in response.get_json()

    def test_login_invalid_email_returns_401(self, client):
        response = client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "anypass12"},
        )
        assert response.status_code == 401

    def test_register_valid_user_returns_201_and_token(self, client):
        response = client.post(
            "/api/auth/register",
            json=build_user_payload(email="fresh@example.com"),
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["user"]["email"] == "fresh@example.com"
        assert "token" in data

    def test_register_duplicate_email_returns_400(self, client):
        payload = build_user_payload(email="dup@example.com")
        assert client.post("/api/auth/register", json=payload).status_code == 201
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 400

    def test_me_with_valid_token_returns_profile(self, client, customer_token):
        response = client.get(
            "/api/auth/me", headers=auth_headers(customer_token)
        )
        assert response.status_code == 200
        assert response.get_json()["email"] == CUSTOMER_CREDENTIALS["email"]

    def test_me_without_token_returns_401(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_me_with_malformed_token_returns_401(self, client):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer not-a-real-jwt"},
        )
        assert response.status_code == 401

    def test_me_with_expired_token_returns_401(self, client, app):
        token = jwt.encode(
            {
                "sub": 1,
                "email": CUSTOMER_CREDENTIALS["email"],
                "role": "customer",
                "iat": int(time.time()) - 7200,
                "exp": int(time.time()) - 3600,
            },
            app.config["JWT_SECRET"],
            algorithm="HS256",
        )
        response = client.get("/api/auth/me", headers=auth_headers(token))
        assert response.status_code == 401

    def test_protected_route_with_invalid_signature_returns_401(self, client, app):
        token = jwt.encode(
            {"sub": 1, "email": "x@y.com", "role": "admin", "exp": int(time.time()) + 3600},
            "wrong-secret",
            algorithm="HS256",
        )
        response = client.get("/api/users", headers=auth_headers(token))
        assert response.status_code == 401
