from marshmallow import Schema, fields, validate


class TagBriefSchema(Schema):
    class Meta:
        name = "TagBrief"

    id = fields.UUID(dump_only=True)
    name = fields.Str()
    slug = fields.Str()


class TagSchema(Schema):
    class Meta:
        name = "Tag"

    id = fields.UUID(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    slug = fields.String(required=True, validate=validate.Length(min=1, max=50))
    created_at = fields.DateTime(dump_only=True)
