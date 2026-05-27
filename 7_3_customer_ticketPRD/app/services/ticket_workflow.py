"""Ticket assignment + status helpers."""

from __future__ import annotations

from datetime import datetime

from werkzeug.exceptions import BadRequest, Forbidden

from app.extensions import db
from app.models import Ticket, TicketAssignment, TicketStatusHistory, User
from app.models.ticket import TicketStatus
from app.models.user import UserRole
from app.services import notifications
from app.services.access_control import can_assign
from app.services.sla import mark_first_response_if_needed
from app.services.transitions import validate_transition


def apply_assignment(
    *,
    app,
    ticket: Ticket,
    agent: User,
    acting_user: User | None,
    send_notifications: bool = True,
) -> None:
    if agent.role != UserRole.agent.value:
        raise BadRequest(description="Target user is not an agent.")

    if acting_user and not can_assign(acting_user):
        raise Forbidden(description="Only administrators may assign tickets.")

    prior_status = ticket.status

    if ticket.status == TicketStatus.open.value:
        validate_transition(ticket.status, TicketStatus.assigned.value, closed_at=ticket.closed_at)
        ticket.status = TicketStatus.assigned.value

    ticket.assigned_to_id = agent.id
    ticket.updated_at = datetime.utcnow()

    if ticket.status != prior_status:
        db.session.add(
            TicketStatusHistory(
                ticket_id=ticket.id,
                from_status=prior_status,
                to_status=ticket.status,
                changed_by_id=acting_user.id if acting_user else None,
                note="assignment",
            )
        )

    history = TicketAssignment(
        ticket_id=ticket.id,
        assigned_to_id=agent.id,
        assigned_by_id=acting_user.id if acting_user else None,
    )
    db.session.add(history)

    if send_notifications and ticket.status != prior_status:
        notifications.notify_status_change(
            app,
            customer_email=ticket.customer_email,
            agent_email=agent.email,
            ticket_number=ticket.ticket_number,
            from_status=prior_status,
            to_status=ticket.status,
        )

    if send_notifications:
        notifications.notify_ticket_assigned(
            app,
            agent_email=agent.email,
            ticket_number=ticket.ticket_number,
            subject=ticket.subject,
        )


def apply_status_change(
    *,
    app,
    ticket: Ticket,
    actor: User,
    new_status: str,
    note: str | None = None,
) -> None:
    old = ticket.status
    validate_transition(old, new_status, closed_at=ticket.closed_at)

    now = datetime.utcnow()
    if new_status == TicketStatus.resolved.value:
        ticket.resolved_at = now
    if new_status == TicketStatus.closed.value:
        ticket.closed_at = now
    if old == TicketStatus.closed.value and new_status == TicketStatus.reopened.value:
        ticket.closed_at = None

    ticket.status = new_status
    ticket.updated_at = now

    db.session.add(
        TicketStatusHistory(
            ticket_id=ticket.id,
            from_status=old,
            to_status=new_status,
            changed_by_id=actor.id,
            note=note,
        )
    )

    if actor.role in {UserRole.agent.value, UserRole.admin.value}:
        mark_first_response_if_needed(db.session, ticket)

    notifications.notify_status_change(
        app,
        customer_email=ticket.customer_email,
        agent_email=ticket.assigned_to.email if ticket.assigned_to else None,
        ticket_number=ticket.ticket_number,
        from_status=old,
        to_status=new_status,
    )
