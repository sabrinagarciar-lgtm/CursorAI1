"""Manual assignment audit trail."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class TicketAssignment(db.Model):
    __tablename__ = "ticket_assignments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(db.ForeignKey("tickets.id"), nullable=False, index=True)
    assigned_to_id: Mapped[int] = mapped_column(db.ForeignKey("users.id"), nullable=False)
    assigned_by_id: Mapped[int | None] = mapped_column(db.ForeignKey("users.id"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(db.DateTime, default=lambda: datetime.utcnow())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="assignments_history")
