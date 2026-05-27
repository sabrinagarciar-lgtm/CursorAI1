"""User administration endpoints."""

from __future__ import annotations

from flask import Blueprint
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from werkzeug.exceptions import Forbidden

from app.auth_context import get_current_user
from app.extensions import db
from app.http_helpers import success_response
from app.models.user import User, UserRole
from app.routes.auth import serialize_user_public

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.route("", methods=["GET"])
@jwt_required()
def list_users():
    actor = get_current_user(strict=True)
    if actor.role != UserRole.admin.value:
        raise Forbidden(description="Administrators only.")

    rows = db.session.scalars(select(User).order_by(User.id)).all()
    return success_response([serialize_user_public(u) for u in rows])
