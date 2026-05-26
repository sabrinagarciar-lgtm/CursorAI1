from marshmallow import Schema, fields, post_load, pre_load, validates, validates_schema, validate


class LoginSchema(Schema):
    """Authenticate with email + password (PostgreSQL DDL lookup pattern)."""

    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)

    @pre_load
    def normalize_email(self, data, **_kwargs):
        if isinstance(data, dict) and isinstance(data.get("email"), str):
            data["email"] = data["email"].strip().lower()
        return data


class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        load_only=True,
        validate=[
            validate.Length(min=8, max=128),
            validate.Regexp(
                r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
                error="Password must include at least one uppercase letter, one lowercase letter, and one digit.",
            ),
        ],
    )
    availability_status = fields.String(
        required=False,
        validate=validate.OneOf(["available", "busy", "offline"]),
        load_default=None,
    )
    expertise_areas = fields.List(
        fields.String(validate=validate.Length(min=1, max=64)),
        load_default=list,
        validate=validate.Length(max=50),
    )

    @pre_load
    def normalize_email_register(self, data, **_kwargs):
        if isinstance(data, dict) and isinstance(data.get("email"), str):
            data["email"] = data["email"].strip().lower()
        return data

    @post_load
    def finalize_name(self, data, **_kwargs):
        raw = data.get("name") or ""
        stripped = raw.strip()
        if len(stripped) < 2:
            raise validate.ValidationError({"name": ["Name is too short after trimming whitespace."]})
        data["name"] = stripped
        return data

    @validates_schema
    def strip_expertise(self, data, **_kwargs):
        areas = data.get("expertise_areas") or []
        data["expertise_areas"] = [str(a).strip().lower() for a in areas if str(a).strip()]


class UserSchema(Schema):
    """Profile representation without credentials."""

    id = fields.Int(dump_only=True)
    name = fields.String(required=True)
    email = fields.Email(required=True)
    role = fields.String(dump_only=True)
    availability_status = fields.String(dump_only=True)
    expertise_areas = fields.Raw(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class RefreshRequestSchema(Schema):
    refresh_token = fields.String(required=True, validate=validate.Length(min=1, max=1024))


class TokenPairPayloadSchema(Schema):
    access_token = fields.String()
    refresh_token = fields.String()
    token_type = fields.String()
    expires_in = fields.Int(metadata={"description": "Access token TTL in seconds"})


class TokensEnvelopeSchema(Schema):
    """Consistent success wrapper for issued JWT + refresh pair."""

    data = fields.Nested(TokenPairPayloadSchema())
    meta = fields.Raw(
        allow_none=True,
        dump_default=None,
        metadata={"description": "Unused for tokens; reserved for pagination-style metadata"},
    )


class UserCreatedEnvelopeSchema(Schema):
    data = fields.Nested(UserSchema())
    meta = fields.Raw(allow_none=True, dump_default=None)
