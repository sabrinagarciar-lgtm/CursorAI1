"""Pytest fixtures — HTTP client tests need PostgreSQL; pure unit tests rely on ``app`` only."""

from __future__ import annotations

import os

import pytest
from sqlalchemy.exc import OperationalError

from app import create_app, db


@pytest.fixture()
def app():
    os.environ.setdefault("FLASK_ENV", "testing")
    return create_app("testing")


@pytest.fixture()
def web_client(app):
    """Flask test client without touching the database (cheap smoke tests)."""

    return app.test_client()


@pytest.fixture()
def client(app):
    with app.app_context():
        try:
            db.drop_all()
            db.create_all()
        except OperationalError:
            pytest.skip(
                "PostgreSQL unreachable — start `docker compose up -d postgres` "
                "or point TEST_DATABASE_URL / DATABASE_URL at a reachable instance."
            )

    tc = app.test_client()
    yield tc

    with app.app_context():
        db.session.remove()
        try:
            db.drop_all()
        except OperationalError:
            pass
