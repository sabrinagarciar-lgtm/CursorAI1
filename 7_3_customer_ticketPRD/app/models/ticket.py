"""Ticket model."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class TicketStatus(str, Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    waiting = "waiting"
    resolved = "resolved"
    closed = "closed"
    reopened = "reopened"


class PriorityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TicketCategory(str, Enum):
    technical = "technical"
    billing = "billing"
    general = "general"
    feature_request = "feature_request"


class Ticket(db.Model):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_number: Mapped[str] = mapped_column(db.String(32), unique=True, nullable=False, index=True)
    subject: Mapped[str] = mapped_column(db.String(200), nullable=False)
    description: Mapped[str] = mapped_column(db.Text, nullable=False)
    status: Mapped[str] = mapped_column(db.String(32), nullable=False, default=TicketStatus.open.value)
    priority: Mapped[str] = mapped_column(db.String(16), nullable=False)
    category: Mapped[str] = mapped_column(db.String(32), nullable=False)
    customer_email: Mapped[str] = mapped_column(db.String(320), nullable=False, index=True)
    creator_user_id: Mapped[int | None] = mapped_column(db.ForeignKey("users.id"), nullable=True)
    assigned_to_id: Mapped[int | None] = mapped_column(db.ForeignKey("users.id"), nullable=True)
    first_response_at: Mapped[datetime | None] = mapped_column(db.DateTime, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(db.DateTime, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(db.DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow()
    )

    assigned_to = relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_tickets",
    )
    creator = relationship("User", foreign_keys=[creator_user_id])
    comments: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="ticket", order_by="Comment.created_at", cascade="all, delete-orphan"
    )
    assignments_history: Mapped[list["TicketAssignment"]] = relationship(
        "TicketAssignment", back_populates="ticket", cascade="all, delete-orphan"
    )
    status_history: Mapped[list["TicketStatusHistory"]] = relationship(
        "TicketStatusHistory", back_populates="ticket", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="ticket", cascade="all, delete-orphan"
    )
