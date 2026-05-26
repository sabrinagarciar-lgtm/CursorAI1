"""Lightweight factories (no Postgres required)."""

from app import create_app


def test_production_builder(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@localhost:5999/sample")
    app = create_app("production")
    assert app.config["PREFERRED_URL_SCHEME"] == "https"


def test_testing_builder_uses_simple_cache(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL", "postgresql+psycopg://u:p@localhost:5998/blog_platform_test"
    )
    flask_app = create_app("testing")
    assert flask_app.config["CACHE_TYPE"].lower().startswith("simple")


def test_explicit_database_url_wins(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://explicit:pwd@127.0.0.1:5544/mydb")
    monkeypatch.delenv("CLOUD_SQL_CONNECT_MODE", raising=False)

    from config import build_sqlalchemy_database_uri

    assert "explicit" in build_sqlalchemy_database_uri()
    assert ":5544" in build_sqlalchemy_database_uri()

