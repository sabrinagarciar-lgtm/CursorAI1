"""Ticket comment."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class Comment(db.Model):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(db.ForeignKey("tickets.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(db.ForeignKey("users.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(db.Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(default=False)
    mentions: Mapped[list | None] = mapped_column(JSON, nullable=True)  # normalized emails/user ids strings
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=lambda: datetime.utcnow())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="comments")
    user: Mapped["User"] = relationship("User", back_populates="comments")
