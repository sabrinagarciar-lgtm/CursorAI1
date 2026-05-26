"""Shared Marshmallow query / envelope schemas."""

import math

from marshmallow import Schema, fields, validate


class PaginationQuerySchema(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=20, validate=validate.Range(min=1, max=100))


class PostsListQuerySchema(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=20, validate=validate.Range(min=1, max=100))
    scope = fields.String(
        load_default="published",
        validate=validate.OneOf(["published", "mine"]),
    )


class CategoriesListQuerySchema(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=50, validate=validate.Range(min=1, max=200))


class CommentsListQuerySchema(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=30, validate=validate.Range(min=1, max=100))


class SearchQuerySchema(Schema):
    """PostgreSQL FTS search aligns with DDL."""

    q = fields.String(required=True, validate=validate.Length(min=1, max=200))
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=20, validate=validate.Range(min=1, max=50))


class PaginatedMetaSchema(Schema):
    page = fields.Int()
    per_page = fields.Int()
    total = fields.Int()
    pages = fields.Int()
    next_page = fields.Int(allow_none=True)
    prev_page = fields.Int(allow_none=True)


def pagination_meta(query_pagination) -> dict:
    return {
        "page": query_pagination.page,
        "per_page": query_pagination.per_page,
        "total": query_pagination.total,
        "pages": query_pagination.pages,
        "next_page": query_pagination.next_num if query_pagination.has_next else None,
        "prev_page": query_pagination.prev_num if query_pagination.has_prev else None,
    }


def manual_pagination_meta(*, total: int, page: int, per_page: int, **extra: object) -> dict:
    pages = math.ceil(total / per_page) if total and per_page else 0

    next_page = page + 1 if page < pages else None
    prev_page = page - 1 if page > 1 else None

    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "next_page": next_page,
        "prev_page": prev_page,
    }
    meta.update(extra)
    return meta
