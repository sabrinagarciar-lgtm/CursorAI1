"""Marshmallow schemas."""

from marshmallow import EXCLUDE, Schema, ValidationError, fields, validate

from app.utils.validation_regex import SUBJECT_PATTERN


def _priorities():
    return ("low", "medium", "high", "urgent")


def _categories():
    return ("technical", "billing", "general", "feature_request")


def _statuses():
    return (
        "open",
        "assigned",
        "in_progress",
        "waiting",
        "resolved",
        "closed",
        "reopened",
    )


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.String(required=True)


class TicketCreateJsonSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    subject = fields.String(
        required=True,
        validate=[
            validate.Length(min=5, max=200),
            validate.Regexp(SUBJECT_PATTERN, error="Subject contains disallowed characters."),
        ],
    )
    description = fields.String(required=True, validate=validate.Length(min=20, max=5000))
    priority = fields.String(required=True, validate=validate.OneOf(_priorities()))
    category = fields.String(required=True, validate=validate.OneOf(_categories()))
    customer_email = fields.Email(required=True)
    auto_assign = fields.Boolean(load_default=False)


class TicketPatchSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    subject = fields.String(
        validate=[
            validate.Length(min=5, max=200),
            validate.Regexp(SUBJECT_PATTERN, error="Subject contains disallowed characters."),
        ]
    )
    description = fields.String(validate=validate.Length(min=20, max=5000))
    customer_email = fields.Email()


class AssignSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    assigned_to_user_id = fields.Integer(load_default=None)
    auto_assign = fields.Boolean(load_default=False)


class StatusSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    status = fields.String(required=True, validate=validate.OneOf(_statuses()))
    note = fields.String(required=False, allow_none=True, validate=validate.Length(max=2000))


class PrioritySchema(Schema):
    class Meta:
        unknown = EXCLUDE

    priority = fields.String(required=True, validate=validate.OneOf(_priorities()))
    reason = fields.String(required=True, validate=validate.Length(min=5, max=2000))


class CommentSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    content = fields.String(required=True, validate=validate.Length(min=1, max=8000))
    is_internal = fields.Boolean(load_default=False)
    mentions = fields.List(fields.String(), load_default=list)


class AgentAvailabilitySchema(Schema):
    class Meta:
        unknown = EXCLUDE

    availability_status = fields.String(required=True, validate=validate.OneOf(("available", "busy", "offline")))
    expertise_areas = fields.List(fields.String(), load_default=list)
