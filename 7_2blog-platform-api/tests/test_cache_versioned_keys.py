from app import create_app, cache
from app.caching.versioned_keys import (
    invalidate_posts_generation,
    post_detail_cache_key,
    post_list_cache_key,
    posts_cache_version,
)


def test_posts_cache_generation_monotonic():
    flask_app = create_app("testing")
    with flask_app.app_context():
        v1 = posts_cache_version(cache)
        v2 = invalidate_posts_generation(cache)
        assert v2 == v1 + 1


def test_post_list_cache_key_published():
    key = post_list_cache_key(5, scope="published", page=2, per_page=10, viewer_id=None)
    assert "published" in key and "p2" in key and "pp10" in key


def test_post_list_cache_key_mine_includes_uid():
    key = post_list_cache_key(1, scope="mine", page=1, per_page=5, viewer_id=99)
    assert "mine" in key and "uid99" in key


def test_post_detail_cache_keys_differ_by_tier():
    pub = post_detail_cache_key(2, slug="alpha", tier="published")
    dr = post_detail_cache_key(2, slug="alpha", tier="draft")
    assert ":detail:published:" in pub
    assert ":detail:draft:" in dr
