"""SLA email hooks (FR-035)."""

from __future__ import annotations

from sqlalchemy import select

from app.extensions import db
from app.models import User
from app.models.user import UserRole
from app.services.notifications import notify_sla_nearing


def maybe_notify_sla_pressure(app, ticket, sla_payload: dict) -> None:
    if not sla_payload.get("first_response_approaching") and not sla_payload.get("resolution_approaching"):
        return

    admin_emails = tuple(
        e
        for e in db.session.scalars(select(User.email).where(User.role == UserRole.admin.value)).all()
        if e
    )
    agent_email = ticket.assigned_to.email if ticket.assigned_to else None
    if not agent_email and not admin_emails:
        return

    headline = []
    if sla_payload.get("first_response_approaching"):
        headline.append("first response SLA window")
    if sla_payload.get("resolution_approaching"):
        headline.append("resolution SLA window")
    notify_sla_nearing(
        app,
        agent_email=agent_email or admin_emails[0],
        admin_emails=admin_emails,
        ticket_number=ticket.ticket_number,
        headline=" & ".join(headline),
    )
