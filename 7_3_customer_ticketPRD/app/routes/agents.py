"""Agent directory + availability helpers."""

from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from werkzeug.exceptions import Forbidden, NotFound

from app.auth_context import get_current_user
from app.extensions import db
from app.http_helpers import success_response
from app.models.user import User, UserRole
from app.routes.auth import serialize_user_public
from app.schemas.api import AgentAvailabilitySchema

agents_bp = Blueprint("agents", __name__, url_prefix="/agents")


@agents_bp.route("", methods=["GET"])
@jwt_required()
def list_agents():
    actor = get_current_user(strict=True)
    if actor.role not in {UserRole.admin.value, UserRole.agent.value}:
        raise Forbidden(description="Insufficient permissions.")

    rows = db.session.scalars(select(User).where(User.role == UserRole.agent.value).order_by(User.id)).all()
    return success_response([serialize_user_public(u) for u in rows])


@agents_bp.route("/<int:agent_id>/availability", methods=["PUT"])
@jwt_required()
def update_agent_availability(agent_id: int):
    actor = get_current_user(strict=True)

    payload = AgentAvailabilitySchema().load(request.get_json(silent=True) or {})
    target = db.session.get(User, agent_id)
    if not target or target.role != UserRole.agent.value:
        raise NotFound(description="Agent not found.")

    if actor.role == UserRole.admin.value or actor.id == agent_id:
        pass
    else:
        raise Forbidden(description="Agents may update only themselves unless admin.")

    target.availability_status = payload["availability_status"]
    target.expertise_areas = payload.get("expertise_areas") or []
    db.session.commit()
    return success_response(serialize_user_public(target))
