"""Marshmallow envelope serialization shared by HTTP handlers and caches."""

from __future__ import annotations


def serialized_post_feed(pager: object) -> dict:
    from app.schemas.post import PaginatedPostsResponseSchema
    from app.schemas.common import pagination_meta

    envelope = {"data": getattr(pager, "items") or [], "meta": pagination_meta(pager)}
    return PaginatedPostsResponseSchema().dump(envelope)


def serialized_post_detail(post_model) -> dict:
    from app.schemas.post import PostEnvelopeSchema

    setattr(post_model, "comments", [])
    envelope = {"data": post_model, "meta": None}
    return PostEnvelopeSchema().dump(envelope)
