import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.middleware.rate_limit import reset_rate_limit_store  # noqa: E402
from tests.helpers.test_data import (  # noqa: E402
    ADMIN_CREDENTIALS,
    CUSTOMER_CREDENTIALS,
    valid_checkout_payload,
)


@pytest.fixture()
def app():
    import tempfile

    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    email_dir = tempfile.mkdtemp()
    from app import create_app

    application = create_app(
        {
            "TESTING": True,
            "DATABASE": db_path,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "EMAIL_LOG_DIR": email_dir,
            "RATE_LIMIT_ENABLED": False,
            "ALLOW_TEST_ERROR_ROUTE": True,
            "CACHE_TYPE": "NullCache",
        }
    )
    application.config["_TEST_EMAIL_DIR"] = email_dir
    yield application
    Path(db_path).unlink(missing_ok=True)


@pytest.fixture()
def rate_limited_app():
    import tempfile

    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    email_dir = tempfile.mkdtemp()
    from app import create_app

    reset_rate_limit_store()
    application = create_app(
        {
            "TESTING": True,
            "DATABASE": db_path,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "EMAIL_LOG_DIR": email_dir,
            "RATE_LIMIT_ENABLED": True,
            "RATE_LIMIT_REQUESTS": 5,
            "RATE_LIMIT_WINDOW_SECONDS": 60,
            "ALLOW_TEST_ERROR_ROUTE": True,
            "CACHE_TYPE": "NullCache",
        }
    )
    yield application
    reset_rate_limit_store()
    Path(db_path).unlink(missing_ok=True)


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def rate_limited_client(rate_limited_app):
    return rate_limited_app.test_client()


@pytest.fixture()
def email_log_path(app):
    return Path(app.config["EMAIL_LOG_DIR"]) / "email_notifications.jsonl"


@pytest.fixture()
def read_email_log(email_log_path):
    def _read():
        if not email_log_path.exists():
            return []
        return [
            json.loads(line)
            for line in email_log_path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

    return _read


@pytest.fixture()
def checkout_payload():
    return valid_checkout_payload()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login(client, email: str, password: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.get_json()["token"]


@pytest.fixture()
def admin_token(client):
    return login(client, ADMIN_CREDENTIALS["email"], ADMIN_CREDENTIALS["password"])


@pytest.fixture()
def customer_token(client):
    return login(
        client, CUSTOMER_CREDENTIALS["email"], CUSTOMER_CREDENTIALS["password"]
    )


def post_checkout(client, payload=None, headers=None, **overrides):
    from tests.helpers.test_data import build_checkout_payload

    body = build_checkout_payload(**overrides) if payload is None else payload
    if overrides and payload is not None:
        body = {**payload, **overrides}
    kwargs = {"json": body}
    if headers:
        kwargs["headers"] = headers
    return client.post("/api/checkout", **kwargs)
