"""Ticket payloads for REST responses."""

from __future__ import annotations

from app.models import Comment, Ticket, User
from app.services import access_control
from app.services.sla import build_sla_payload
from app.utils.sanitize import sanitize_text


def serialize_user_minimal(user: User | None) -> dict | None:
    if not user:
        return None
    return {"id": user.id, "name": user.name, "email": user.email.lower(), "role": user.role}


def serialize_ticket(ticket: Ticket, *, actor: User, app=None) -> dict:
    _ = actor  # reserved for future field-level redaction
    sla = build_sla_payload(ticket, app_config=app.config if app else None)
    assigned = getattr(ticket, "assigned_to", None)
    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "category": ticket.category,
        "customer_email": ticket.customer_email.lower(),
        "creator_user_id": ticket.creator_user_id,
        "assigned_to": serialize_user_minimal(assigned),
        "sla": sla,
        "timestamps": {
            "created_at": ticket.created_at.isoformat() + "Z",
            "updated_at": ticket.updated_at.isoformat() + "Z" if ticket.updated_at else None,
            "resolved_at": ticket.resolved_at.isoformat() + "Z" if ticket.resolved_at else None,
            "closed_at": ticket.closed_at.isoformat() + "Z" if ticket.closed_at else None,
            "first_response_at": ticket.first_response_at.isoformat() + "Z" if ticket.first_response_at else None,
        },
    }


def serialize_comment(comment: Comment, *, actor: User, ticket: Ticket) -> dict:
    _ = ticket
    redacted = access_control.should_redact_internal_comment(actor, comment.is_internal)
    body = "***internal***" if redacted else sanitize_text(comment.content, strip=False)
    return {
        "id": comment.id,
        "ticket_id": comment.ticket_id,
        "author": serialize_user_minimal(comment.user),
        "content": body,
        "is_internal": False if redacted else comment.is_internal,
        "mentions": comment.mentions or [],
        "created_at": comment.created_at.isoformat() + "Z",
    }
