from marshmallow import Schema, fields, validate

from app.schemas.category import CategoryBriefSchema
from app.schemas.comment import CommentEmbeddedSchema
from app.schemas.common import PaginatedMetaSchema
from app.schemas.tag import TagBriefSchema


class PostAuthorBriefSchema(Schema):
    id = fields.Int()
    name = fields.Str()


def excerpt_preview(summary: str | None, content: str, *, length: int = 200) -> str:
    payload = ""
    if summary:
        payload = summary.strip()
    if not payload:
        payload = content.replace("\r", " ").replace("\n", " ").strip()
    if len(payload) <= length:
        return payload
    return payload[: length - 3].rstrip() + "..."


class PostSummarySchema(Schema):
    id = fields.UUID(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    slug = fields.Str(dump_only=True)
    excerpt = fields.Method("_excerpt", dump_only=True)
    summary = fields.Str(allow_none=True, dump_only=True)
    status = fields.Str(dump_only=True)
    published_at = fields.DateTime(allow_none=True, dump_only=True)
    categories = fields.Nested(CategoryBriefSchema, many=True, dump_only=True)
    tags = fields.Nested(TagBriefSchema, many=True, dump_only=True)
    author = fields.Nested(PostAuthorBriefSchema, dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def _excerpt(self, post):
        return excerpt_preview(post.summary, post.content)


class PostSearchSummarySchema(PostSummarySchema):
    rank = fields.Method("_fts_rank", dump_only=True)

    def _fts_rank(self, obj):
        return float(getattr(obj, "search_rank", 0.0))


class PostDetailSchema(Schema):
    id = fields.UUID(dump_only=True)
    title = fields.Str(required=True)
    slug = fields.Str(required=True)
    summary = fields.Str(allow_none=True)
    content = fields.Str(required=True)
    status = fields.Str(required=True)
    published_at = fields.DateTime(allow_none=True)
    categories = fields.Nested(CategoryBriefSchema, many=True)
    tags = fields.Nested(TagBriefSchema, many=True)
    comments = fields.Nested(CommentEmbeddedSchema, many=True)
    author = fields.Nested(PostAuthorBriefSchema)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PostEnvelopeSchema(Schema):
    data = fields.Nested(PostDetailSchema())
    meta = fields.Raw(allow_none=True, dump_default=None)


class PostCreateUpdateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=3, max=255))
    slug = fields.String(
        required=False,
        validate=validate.Length(min=1, max=255),
        allow_none=True,
    )
    summary = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))
    content = fields.String(required=True, validate=validate.Length(min=10, max=512_000))
    status = fields.String(
        load_default=None,
        validate=validate.OneOf(["draft", "published", "archived"]),
        allow_none=True,
    )
    category_ids = fields.List(fields.UUID(), load_default=list)
    tag_ids = fields.List(fields.UUID(), load_default=list)


class PaginatedPostsResponseSchema(Schema):
    data = fields.Nested(PostSummarySchema, many=True)
    meta = fields.Nested(PaginatedMetaSchema)


class PaginatedMetaWithKeywordSchema(PaginatedMetaSchema):
    keyword = fields.Str()


class PaginatedSearchResponseSchema(Schema):
    data = fields.Nested(PostSearchSummarySchema, many=True)
    meta = fields.Nested(PaginatedMetaWithKeywordSchema)
