"""User model."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class UserRole(str, Enum):
    customer = "customer"
    agent = "agent"
    admin = "admin"


class AvailabilityStatus(str, Enum):
    available = "available"
    busy = "busy"
    offline = "offline"


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(200), nullable=False)
    email: Mapped[str] = mapped_column(db.String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(db.String(255), nullable=False)
    role: Mapped[str] = mapped_column(db.String(16), nullable=False, default=UserRole.customer.value)
    availability_status: Mapped[str] = mapped_column(
        db.String(16), nullable=False, default=AvailabilityStatus.available.value
    )
    expertise_areas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=lambda: datetime.utcnow())

    assigned_tickets: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        back_populates="assigned_to",
        foreign_keys="Ticket.assigned_to_id",
    )

    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="user")
