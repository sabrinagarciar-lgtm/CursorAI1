"""Login and refresh token exchange at ``/api/sessions`` (session = issued tokens)."""

from datetime import UTC, datetime

from flask import current_app
from flask.views import MethodView
from flask_jwt_extended import create_access_token
from flask_smorest import Blueprint
from werkzeug.exceptions import Unauthorized

from app import db, limiter
from app.models import RefreshToken, User
from app.schemas.auth import (
    LoginSchema,
    RefreshRequestSchema,
    TokensEnvelopeSchema,
)

blp = Blueprint("Sessions", __name__, description="Create and rotate authenticated sessions (JWT + refresh)")


def _auth_rate_limit() -> str:
    return current_app.config.get("RATELIMIT_AUTH", "20 per minute")


def _access_ttl_seconds() -> int:
    return int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())


def _issue_token_pair(user: User) -> dict:
    access = create_access_token(identity=str(user.id))
    refresh_entity, plaintext = RefreshToken.mint_for_user(user.id)
    db.session.add(refresh_entity)
    db.session.commit()

    return {
        "access_token": access,
        "refresh_token": plaintext,
        "token_type": "Bearer",
        "expires_in": _access_ttl_seconds(),
    }


@blp.route("")
class SessionCreate(MethodView):
    """Authenticate with email/password and mint short-lived JWT + opaque refresh token."""

    decorators = [limiter.limit(_auth_rate_limit)]

    @blp.arguments(LoginSchema)
    @blp.response(200, TokensEnvelopeSchema)
    def post(self, data):
        email = data["email"].strip().lower()
        user = User.query.filter(User.email == email).one_or_none()

        if user is None or not user.check_password(data["password"]):
            raise Unauthorized(description="Invalid email or password.")

        tokens = _issue_token_pair(user)
        return {"data": tokens, "meta": None}


@blp.route("/refresh")
class SessionRefresh(MethodView):
    """Rotate refresh token rows and mint a new access JWT."""

    decorators = [limiter.limit(_auth_rate_limit)]

    @blp.arguments(RefreshRequestSchema)
    @blp.response(200, TokensEnvelopeSchema)
    def post(self, body):
        plaintext = body["refresh_token"].strip()

        refresh = RefreshToken.query.filter_by(
            token=plaintext,
            revoked=False,
        ).first()

        now = datetime.now(UTC)

        if refresh is None or refresh.expires_at < now:
            raise Unauthorized(description="Refresh token expired or unrecognized.")

        refresh.revoked = True
        actor = refresh.user
        tokens = _issue_token_pair(actor)
        return {"data": tokens, "meta": None}
