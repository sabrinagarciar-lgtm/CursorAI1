from marshmallow import Schema, fields, validate

from app.schemas.common import PaginatedMetaSchema


class CommentAuthorBriefSchema(Schema):
    id = fields.Int()
    name = fields.Str()


class CommentSchema(Schema):
    class Meta:
        name = "Comment"

    id = fields.UUID(dump_only=True)
    post_id = fields.UUID(dump_only=True)
    parent_id = fields.UUID(allow_none=True, dump_only=True)
    content = fields.String(required=True, validate=validate.Length(min=1, max=16000))
    is_approved = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    author = fields.Nested(CommentAuthorBriefSchema(), dump_only=True)


class CommentCreateSchema(Schema):
    content = fields.String(required=True, validate=validate.Length(min=1, max=16000))
    parent_comment_id = fields.UUID(required=False, allow_none=True)


class CommentEmbeddedSchema(Schema):
    class Meta:
        name = "CommentEmbedded"

    id = fields.UUID(dump_only=True)
    parent_id = fields.UUID(allow_none=True, dump_only=True)
    content = fields.String(required=True)
    is_approved = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    author = fields.Nested(CommentAuthorBriefSchema(), dump_only=True)


class PaginatedCommentsResponseSchema(Schema):
    class Meta:
        name = "PaginatedComments"

    data = fields.Nested(CommentEmbeddedSchema, many=True)
    meta = fields.Nested(PaginatedMetaSchema)


class CommentCreatedEnvelopeSchema(Schema):
    data = fields.Nested(CommentSchema())
    meta = fields.Raw(allow_none=True, dump_default=None)
