"""Centralized RBAC helpers (FR-032, FR-033)."""

from __future__ import annotations

from app.models import Ticket, User
from app.models.ticket import TicketStatus
from app.models.user import UserRole


ACTIVE_QUEUE_STATUSES = {TicketStatus.open.value}


def owns_ticket(actor: User, ticket: Ticket) -> bool:
    if ticket.creator_user_id and actor.id == ticket.creator_user_id:
        return True
    email = getattr(actor, "email", "").lower()
    owner_email = getattr(ticket, "customer_email", "").lower()
    return bool(email and owner_email and email == owner_email)


def can_view_ticket(actor: User, ticket: Ticket) -> bool:
    if actor.role == UserRole.admin.value:
        return True
    if actor.role == UserRole.customer.value:
        return owns_ticket(actor, ticket)
    if actor.role == UserRole.agent.value:
        if ticket.assigned_to_id == actor.id:
            return True
        if ticket.assigned_to_id is None and ticket.status in ACTIVE_QUEUE_STATUSES:
            return True
        # Allow agents to collaborate on reopened/waiting if previously assigned —
        # keep strict: agents only assigned + queue.
        return False
    return False


def can_create_ticket(actor: User) -> bool:
    # PRD permits any authenticated role — customers typically, but admins/agents ok.
    return actor is not None


def can_modify_status(actor: User, ticket: Ticket) -> bool:
    if actor.role == UserRole.admin.value:
        return True
    if actor.role == UserRole.agent.value:
        return ticket.assigned_to_id == actor.id
    return False


def can_assign(actor: User) -> bool:
    return actor.role == UserRole.admin.value


def can_delete_ticket(actor: User) -> bool:
    return actor.role == UserRole.admin.value


def can_change_priority(actor: User, ticket: Ticket) -> bool:
    if actor.role == UserRole.admin.value:
        return True
    if actor.role == UserRole.agent.value and can_view_ticket(actor, ticket):
        return True
    return False


def can_comment(actor: User, ticket: Ticket, *, internal: bool) -> bool:
    if actor.role == UserRole.admin.value:
        return can_view_ticket(actor, ticket)
    if actor.role == UserRole.agent.value and can_view_ticket(actor, ticket):
        return True
    if actor.role == UserRole.customer.value and owns_ticket(actor, ticket):
        return internal is False
    return False


def should_redact_internal_comment(actor: User, is_internal: bool) -> bool:
    """Customers must not retrieve internal discussions."""
    return is_internal and actor.role == UserRole.customer.value
