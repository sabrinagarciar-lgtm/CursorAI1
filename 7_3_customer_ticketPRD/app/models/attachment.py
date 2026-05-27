"""File attachments for tickets (and optionally comments)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class Attachment(db.Model):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(db.ForeignKey("tickets.id"), nullable=False, index=True)
    comment_id: Mapped[int | None] = mapped_column(db.ForeignKey("comments.id"), nullable=True)
    filename: Mapped[str] = mapped_column(db.String(260), nullable=False)
    stored_name: Mapped[str] = mapped_column(db.String(260), nullable=False)
    file_path: Mapped[str] = mapped_column(db.String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(db.Integer, nullable=False)
    file_type: Mapped[str] = mapped_column(db.String(128), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(db.DateTime, default=lambda: datetime.utcnow())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="attachments")
