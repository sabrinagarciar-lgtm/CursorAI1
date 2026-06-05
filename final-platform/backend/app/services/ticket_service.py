from __future__ import annotations

from app.extensions import db
from app.models.platform import SupportTicket
from app.utils.security import sanitize_text


class TicketError(Exception):
    pass

VALID_STATUSES = {"open", "in_progress", "resolved", "closed"}
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


def list_tickets(status: str | None = None) -> list[dict]:
    query = SupportTicket.query.order_by(SupportTicket.created_at.desc())
    if status:
        query = query.filter_by(status=status)
    return [t.to_dict() for t in query.all()]


def get_ticket(ticket_id: int) -> dict | None:
    ticket = db.session.get(SupportTicket, ticket_id)
    return ticket.to_dict() if ticket else None


def create_ticket(payload: dict) -> dict:
    title = sanitize_text(str(payload.get("title", "")), max_length=200)
    description = sanitize_text(str(payload.get("description", "")), max_length=5000)
    email = sanitize_text(str(payload.get("customerEmail", "")), max_length=200)
    if not title or not description or not email:
        raise TicketError("Title, description, and customer email are required.")
    priority = str(payload.get("priority") or "medium")
    if priority not in VALID_PRIORITIES:
        raise TicketError("Invalid priority.")
    ticket = SupportTicket(
        title=title,
        description=description,
        customer_email=email,
        priority=priority,
        category=sanitize_text(str(payload.get("category") or "general"), max_length=64),
        status="open",
    )
    db.session.add(ticket)
    db.session.commit()
    return ticket.to_dict()


def update_ticket(ticket_id: int, payload: dict) -> dict:
    ticket = db.session.get(SupportTicket, ticket_id)
    if ticket is None:
        raise TicketError("Ticket not found.")
    if "status" in payload:
        status = str(payload["status"])
        if status not in VALID_STATUSES:
            raise TicketError("Invalid status.")
        ticket.status = status
    if "priority" in payload:
        if str(payload["priority"]) not in VALID_PRIORITIES:
            raise TicketError("Invalid priority.")
        ticket.priority = str(payload["priority"])
    if "assignee" in payload:
        ticket.assignee = sanitize_text(str(payload["assignee"]), max_length=100)
    db.session.commit()
    return ticket.to_dict()
