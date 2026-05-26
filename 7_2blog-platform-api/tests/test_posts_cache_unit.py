"""Branch coverage on post caching helpers without a database."""

from __future__ import annotations

import pytest

from app import cache
from app.routes import posts as posts_routes


def test_posts_cache_reads_disabled_when_posts_flag_off(app):
    app.config["CACHE_POSTS_ENABLED"] = False
    with app.app_context():
        assert posts_routes._posts_cache_reads_enabled() is False


def test_posts_cache_reads_disabled_when_CACHE_DISABLED_truthy(app):
    app.config["CACHE_POSTS_ENABLED"] = True
    app.config["CACHE_DISABLED"] = "true"
    with app.app_context():
        assert posts_routes._posts_cache_reads_enabled() is False


def test_safe_posts_cache_skips_when_current_generation_changed(app, monkeypatch):
    """If ``gen_start`` is stale vs live counter, refuse to ``SET`` (precludes stale writes)."""

    stored: list[str] = []

    def capture_set(key, payload, *, timeout=None):
        stored.append(key)

    monkeypatch.setattr(cache, "set", capture_set)

    monkeypatch.setattr(posts_routes, "posts_cache_version", lambda _unused: 99)

    with app.app_context():
        app.config["CACHE_POSTS_ENABLED"] = True
        app.config.pop("CACHE_DISABLED", None)
        posts_routes._safe_posts_cache_set(
            gen_start=44,
            cache_key="obsolete",
            payload={"unit": True},
            ttl=30,
        )

    assert stored == []


def test_safe_posts_cache_set_on_match(app, monkeypatch):
    stored: dict[str, object] = {}

    def capture_set(key, payload, *, timeout=None):
        stored["key"], stored["payload"], stored["ttl"] = key, payload, timeout

    monkeypatch.setattr(cache, "set", capture_set)
    monkeypatch.setattr(posts_routes, "posts_cache_version", lambda _unused: 7)

    with app.app_context():
        app.config["CACHE_POSTS_ENABLED"] = True
        payload = {"data": [], "meta": {"page": 1}}
        posts_routes._safe_posts_cache_set(7, "match-key", payload, ttl=88)

    assert stored.get("ttl") == 88
    assert stored.get("payload") == payload


def test_posts_cache_writes_suppressed_when_posts_disabled(app, monkeypatch):
    calls: list[str] = []

    monkeypatch.setattr(cache, "set", lambda *a, **k: calls.append("nope"))

    with app.app_context():
        app.config["CACHE_POSTS_ENABLED"] = False
        posts_routes._safe_posts_cache_set(5, "k", {}, ttl=60)

    assert calls == []
