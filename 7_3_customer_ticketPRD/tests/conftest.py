"""Pytest scaffolding backed by ephemeral SQLite datasets."""

from __future__ import annotations

import pytest

from app import create_app
from app.extensions import db
from app.models.user import AvailabilityStatus, User, UserRole
from app.utils.passwords import hash_password

SHARED_SECRET = "UltraSecurePass-42"


@pytest.fixture
def app(tmp_path):
    sqlite_url = f"sqlite:///{tmp_path}/support.sqlite3"
    flask_app = create_app("testing")
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = sqlite_url
    flask_app.config["TESTING"] = True

    ctx = flask_app.app_context()
    ctx.push()

    db.drop_all()
    db.create_all()

    yield flask_app

    db.session.remove()
    db.drop_all()
    db.engine.dispose()
    ctx.pop()


@pytest.fixture
def client(app):
    """HTTP surface with emptied notification sinks."""

    app.config["_NOTIFICATIONS"] = []
    return app.test_client()


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture
def seeded_users(app):
    with app.app_context():
        hashed = hash_password(SHARED_SECRET, cost=int(app.config["BCRYPT_COST"]))
        customer = User(
            name="Casey Customer",
            email="customer@example.com",
            password_hash=hashed,
            role=UserRole.customer.value,
            availability_status=AvailabilityStatus.available.value,
            expertise_areas=[],
        )
        technician = User(
            name="Alex Agent",
            email="agent@example.com",
            password_hash=hashed,
            role=UserRole.agent.value,
            availability_status=AvailabilityStatus.available.value,
            expertise_areas=["technical", "general"],
        )
        administrator = User(
            name="Dana Admin",
            email="admin@example.com",
            password_hash=hashed,
            role=UserRole.admin.value,
            availability_status=AvailabilityStatus.available.value,
            expertise_areas=["general"],
        )
        db.session.add_all([customer, technician, administrator])
        db.session.commit()


@pytest.fixture
def token_customer(client, seeded_users):
    rv = client.post("/api/auth/login", json={"email": "customer@example.com", "password": SHARED_SECRET})
    return rv.get_json()["data"]["access_token"]


@pytest.fixture
def token_agent(client, seeded_users):
    rv = client.post("/api/auth/login", json={"email": "agent@example.com", "password": SHARED_SECRET})
    return rv.get_json()["data"]["access_token"]


@pytest.fixture
def token_admin(client, seeded_users):
    rv = client.post("/api/auth/login", json={"email": "admin@example.com", "password": SHARED_SECRET})
    return rv.get_json()["data"]["access_token"]
