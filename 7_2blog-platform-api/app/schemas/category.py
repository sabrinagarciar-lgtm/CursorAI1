from marshmallow import Schema, fields, validate

from app.schemas.common import PaginatedMetaSchema


class CategoryBriefSchema(Schema):
    class Meta:
        name = "CategoryBrief"

    id = fields.UUID(dump_only=True)
    name = fields.Str(dump_only=True)
    slug = fields.Str(dump_only=True)
    description = fields.Str(allow_none=True, dump_only=True)
    parent_id = fields.UUID(allow_none=True, dump_only=True)


class CategorySchema(Schema):
    class Meta:
        name = "Category"

    id = fields.UUID(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    slug = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String(required=False)
    parent_id = fields.UUID(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PaginatedCategoriesResponseSchema(Schema):
    class Meta:
        name = "PaginatedCategories"

    data = fields.Nested(CategorySchema, many=True)
    meta = fields.Nested(PaginatedMetaSchema)
