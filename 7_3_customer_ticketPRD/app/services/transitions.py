"""Valid status transitions (FR-011, FR-012)."""

from __future__ import annotations

from datetime import datetime, timedelta

from werkzeug.exceptions import BadRequest


ALLOWED: dict[str, tuple[str, ...]] = {
    "open": ("assigned", "closed"),
    "assigned": ("in_progress", "closed"),
    "in_progress": ("waiting", "resolved", "closed"),
    "waiting": ("in_progress",),
    "resolved": ("closed", "reopened"),
    "closed": ("reopened",),
    "reopened": ("in_progress",),
}


def validate_transition(from_status: str | None, to_status: str, *, closed_at: datetime | None) -> None:
    if from_status is None:
        from_status = "open"

    targets = ALLOWED.get(from_status, ())
    if to_status == from_status:
        return

    if to_status not in targets:
        raise BadRequest(
            description=(
                f"Illegal status transition {from_status!r} -> {to_status!r}. Allowed: "
                + ", ".join(targets or ("(none)",))
            )
        )

    if from_status == "closed" and to_status == "reopened":
        if closed_at is None:
            raise BadRequest(description="Closed timestamp missing for reopen eligibility.")
        if datetime.utcnow() - closed_at > timedelta(days=7):
            raise BadRequest(description="Ticket can only be reopened within 7 days of closure.")
