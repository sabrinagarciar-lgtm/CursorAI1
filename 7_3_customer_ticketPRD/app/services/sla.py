"""SLA rules (FR-020) and nearing-deadline flags (FR-021)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any


@dataclass(frozen=True)
class SlaRules:
    first_response: timedelta
    resolution: timedelta


SLA_TABLE: dict[str, SlaRules] = {
    "urgent": SlaRules(timedelta(hours=2), timedelta(hours=24)),
    "high": SlaRules(timedelta(hours=4), timedelta(hours=48)),
    "medium": SlaRules(timedelta(hours=8), timedelta(days=5)),
    "low": SlaRules(timedelta(hours=24), timedelta(days=10)),
}


def _approaching_fraction(app_config) -> float:
    raw = getattr(app_config, "SLA_APPROACHING_FRACTION", 0.8)
    try:
        v = float(raw)
    except (TypeError, ValueError):
        v = 0.8  # pragma: no cover
    return min(max(v, 0.0), 1.0)


def build_sla_payload(ticket_like, *, ref_time: datetime | None = None, app_config=None) -> dict[str, Any]:
    """Expose SLA milestones and booleans derived from timestamps + priority."""
    ref = ref_time or datetime.utcnow()
    rules = SLA_TABLE.get(ticket_like.priority)
    created = getattr(ticket_like, "created_at")
    resolved_at = getattr(ticket_like, "resolved_at")
    closed_at = getattr(ticket_like, "closed_at")
    first_response_at = getattr(ticket_like, "first_response_at")

    payload: dict[str, Any] = {
        "first_response_hours": None,
        "resolution_hours": None,
        "first_response_due_at": None,
        "resolution_due_at": None,
        "first_response_met": False,
        "resolution_met": False,
        "first_response_approaching": False,
        "resolution_approaching": False,
    }
    if not rules or created is None:
        return payload

    payload["first_response_hours"] = rules.first_response.total_seconds() / 3600
    payload["resolution_hours"] = rules.resolution.total_seconds() / 3600

    first_due = created + rules.first_response
    resolve_due = created + rules.resolution
    payload["first_response_due_at"] = first_due.isoformat() + "Z"
    payload["resolution_due_at"] = resolve_due.isoformat() + "Z"

    if first_response_at is not None:
        payload["first_response_met"] = first_response_at <= first_due
    else:
        payload["first_response_met"] = False

    milestone = resolved_at or closed_at
    if milestone is not None:
        payload["resolution_met"] = milestone <= resolve_due

    frac = _approaching_fraction(app_config)

    # FR-021: highlight when nearing deadline window (fraction of SLA elapsed since creation)
    if first_response_at is None and rules.first_response.total_seconds() > 0:
        elapsed = ref - created
        if elapsed >= frac * rules.first_response and ref <= first_due:
            payload["first_response_approaching"] = True

    terminal = ticket_like.status in {"resolved", "closed"}
    if not terminal and rules.resolution.total_seconds() > 0:
        elapsed_res = ref - created
        if elapsed_res >= frac * rules.resolution and ref <= resolve_due:
            payload["resolution_approaching"] = True

    return payload


def mark_first_response_if_needed(db_session, ticket) -> None:
    """Agents/admins implicitly hit first-response SLA via status changes/comments handled in routes."""
    from datetime import datetime as dt

    if ticket.first_response_at is None:
        ticket.first_response_at = dt.utcnow()
