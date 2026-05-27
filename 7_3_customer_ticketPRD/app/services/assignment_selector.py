"""Auto-assignment heuristic (FR-006)."""

from __future__ import annotations

from sqlalchemy import func, select

from app.extensions import db
from app.models import Ticket, User
from app.models.user import AvailabilityStatus, UserRole


ACTIVE_STATUSES = ("open", "assigned", "in_progress", "waiting", "reopened")


def select_auto_assign_agent(ticket_category: str) -> User | None:
    """Prefer available agents matching category expertise; fallback to smallest workload."""
    agents = db.session.scalars(select(User).where(User.role == UserRole.agent.value)).all()

    ranked: list[tuple[int, User]] = []

    for agent in agents:
        if agent.availability_status != AvailabilityStatus.available.value:
            continue
        workload = db.session.scalar(
            select(func.count(Ticket.id)).where(
                Ticket.assigned_to_id == agent.id,
                Ticket.status.in_(ACTIVE_STATUSES),
            )
        )
        if workload is None:
            workload = 0
        score = workload * 1000 + _expert_bonus(agent.expertise_areas or [], ticket_category)
        ranked.append((score, agent))

    if not ranked:
        return None
    ranked.sort(key=lambda tup: tup[0])
    return ranked[0][1]


def _expert_bonus(areas: list, category: str) -> int:
    if isinstance(areas, list) and category in areas:
        return 0
    if isinstance(areas, list) and "general" in areas:
        return 5
    return 25
