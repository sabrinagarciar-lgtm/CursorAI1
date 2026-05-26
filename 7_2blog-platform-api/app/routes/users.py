"""User registration (plural resource: ``/api/users``)."""

from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint
from werkzeug.exceptions import Conflict

from app import db, limiter
from app.models import User
from app.schemas.auth import RegisterSchema, UserCreatedEnvelopeSchema
from app.utils.sanitize import sanitize_plain_text

blp = Blueprint("Users", __name__, description="Create and manage user accounts")


def _auth_rate_limit() -> str:
    return current_app.config.get("RATELIMIT_AUTH", "20 per minute")


@blp.route("")
class UsersCollection(MethodView):
    """Register a lowercase-email account."""

    decorators = [limiter.limit(_auth_rate_limit)]

    @blp.arguments(RegisterSchema)
    @blp.response(201, UserCreatedEnvelopeSchema)
    def post(self, data):
        email = data["email"]
        if User.query.filter(User.email == email).one_or_none() is not None:
            raise Conflict(description="Email is already registered.")

        user = User(
            name=sanitize_plain_text(data["name"]) or data["name"].strip(),
            email=email,
        )

        availability = data.get("availability_status")
        if availability:
            user.availability_status = availability

        user.expertise_areas = list(data.get("expertise_areas") or [])
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        return {"data": user, "meta": None}
