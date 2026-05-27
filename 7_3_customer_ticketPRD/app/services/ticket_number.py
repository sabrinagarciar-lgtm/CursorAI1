"""Unique ticket numbering (FR-002: TICK-YYYYMMDD-XXXX)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select

from app.extensions import db
from app.models.ticket import Ticket


def generate_next_ticket_number() -> str:
    prefix = datetime.utcnow().strftime("TICK-%Y%m%d-")
    last = db.session.scalar(
        select(Ticket.ticket_number).where(Ticket.ticket_number.like(f"{prefix}%")).order_by(Ticket.id.desc()).limit(1)
    )
    if not last:
        seq = 1
    else:
        try:
            seq = int(last.split("-")[-1]) + 1
        except (ValueError, IndexError):  # pragma: no cover
            seq = 1
    return f"{prefix}{seq:04d}"
