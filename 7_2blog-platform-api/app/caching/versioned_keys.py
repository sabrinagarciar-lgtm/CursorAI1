"""Versioned Redis keys — bump one counter to logically invalidate hot post payloads."""

from __future__ import annotations

import logging

from flask_caching import Cache

LOG = logging.getLogger(__name__)

# Long TTL avoids Redis evicting the generation needle; bumped on every mutation.
_VERSION_TTL_SECONDS = int(365.25 * 24 * 3600)
_VERSION_KEY = "blog:posts:cache_gen"


def posts_cache_version(cache: Cache) -> int:
    raw = cache.get(_VERSION_KEY)
    if raw is None:
        cache.set(_VERSION_KEY, 1, timeout=_VERSION_TTL_SECONDS)
        return 1
    try:
        return int(raw)
    except (TypeError, ValueError):
        LOG.warning("Resetting malformed posts cache generation key.")
        cache.set(_VERSION_KEY, 1, timeout=_VERSION_TTL_SECONDS)
        return 1


def invalidate_posts_generation(cache: Cache) -> int:
    """Increment generation so all prefixed keys effectively miss without SCAN/DELETE."""

    gen = posts_cache_version(cache)
    cache.set(_VERSION_KEY, gen + 1, timeout=_VERSION_TTL_SECONDS)
    return gen + 1


def post_list_cache_key(gen: int, *, scope: str, page: int, per_page: int, viewer_id: int | None) -> str:
    """Feed listing: distinguish ``mine`` by viewer id."""

    uid = viewer_id if scope == "mine" else "_"
    return f"blog:posts:g{gen}:list:{scope}:p{page}:pp{per_page}:uid{uid}"


def post_detail_cache_key(
    gen: int,
    *,
    slug: str,
    tier: str,
) -> str:
    """
    ``tier`` is ``published`` when any client sees the same published JSON, otherwise
    includes the viewer discriminator (draft/author overlays).
    """

    assert tier in {"published", "draft"}
    return f"blog:posts:g{gen}:detail:{tier}:{slug}"
