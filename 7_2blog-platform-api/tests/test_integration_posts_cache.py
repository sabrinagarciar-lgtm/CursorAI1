from app import cache
from app.caching.versioned_keys import posts_cache_version
from app.routes import posts as posts_routes

from tests.helpers import assert_json_envelope_posts, bearer, login_token, register_user


def test_health_probe(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json().get("status") == "ok"


def test_published_feed_requires_no_auth(client):
    r = client.get("/api/posts?scope=published")
    assert_json_envelope_posts(r)


def test_scope_mine_without_token_is_401(client):
    r = client.get("/api/posts?scope=mine")
    assert r.status_code == 401


def test_sessions_rejects_unknown_user(client):
    r = client.post(
        "/api/sessions",
        json={"email": "ghost@example.com", "password": "Str0ngPw!zzz"},
    )
    assert r.status_code == 401


def test_register_conflict_on_duplicate_email(client):
    email, pwd = register_user(client)
    dup = client.post(
        "/api/users",
        json={"name": "Other", "email": email, "password": "OtherStr0ng!2"},
    )
    assert dup.status_code == 409


def test_create_post_then_list_cache_second_hit_skips_feed_serializer(monkeypatch, client):
    calls: list[int] = []

    def spy_feed(pager):
        calls.append(1)
        return posts_routes.serialized_post_feed(pager)

    monkeypatch.setattr(posts_routes, "serialized_post_feed", spy_feed)

    email, pwd = register_user(client)
    token = login_token(client, email, pwd)
    post_body = {
        "title": "Cacheable Published Title XYZ",
        "content": "a" * 25,
        "status": "published",
    }

    cre = client.post("/api/posts", json=post_body, headers=bearer(token))
    assert cre.status_code == 201

    slug = cre.get_json()["data"]["slug"]

    calls.clear()

    fa = client.get("/api/posts?scope=published&page=1&per_page=20")
    fb = client.get("/api/posts?scope=published&page=1&per_page=20")
    assert fa.status_code == fb.status_code == 200

    import json

    fa_json = json.loads(fa.get_data(as_text=True))
    fb_json = json.loads(fb.get_data(as_text=True))
    assert fa_json == fb_json

    assert len(calls) == 1


def test_published_detail_second_hit_skips_detail_serializer(monkeypatch, client):
    spy: list[int] = []

    def spy_detail(post_model):
        spy.append(1)
        return posts_routes.serialized_post_detail(post_model)

    monkeypatch.setattr(posts_routes, "serialized_post_detail", spy_detail)

    email, pwd = register_user(client)
    token = login_token(client, email, pwd)

    slug = (
        client.post(
            "/api/posts",
            json={
                "title": "Slug Detail Perf Title",
                "content": "b" * 30,
                "status": "published",
            },
            headers=bearer(token),
        )
        .get_json()["data"]["slug"]
    )

    spy.clear()
    ua = client.get(f"/api/posts/{slug}")
    ub = client.get(f"/api/posts/{slug}")

    assert ua.status_code == ub.status_code == 200

    ua_json = ua.get_json()
    assert ua_json == ub.get_json()

    assert len(spy) == 1


def test_openapi_json_available(client):
    r = client.get("/api-docs.json")
    assert r.status_code == 200
    spec = r.get_json()
    assert spec.get("openapi") == "3.0.3"
    paths = spec.get("paths") or {}
    assert any("/posts" in path for path in paths)


def test_writing_posts_advances_generation(client, app):
    email, pwd = register_user(client)
    token = login_token(client, email, pwd)

    with app.app_context():
        before = posts_cache_version(cache)

    r = client.post(
        "/api/posts",
        json={"title": "Another Title XX", "content": "d" * 40, "status": "published"},
        headers=bearer(token),
    )

    assert r.status_code == 201

    with app.app_context():
        after = posts_cache_version(cache)

    assert after > before
