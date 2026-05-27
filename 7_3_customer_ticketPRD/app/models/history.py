"""Ticket status audit trail (FR-013)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class TicketStatusHistory(db.Model):
    __tablename__ = "ticket_status_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(db.ForeignKey("tickets.id"), nullable=False, index=True)
    from_status: Mapped[str | None] = mapped_column(db.String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(db.String(32), nullable=False)
    changed_by_id: Mapped[int | None] = mapped_column(db.ForeignKey("users.id"), nullable=True)
    note: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=lambda: datetime.utcnow())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="status_history")
