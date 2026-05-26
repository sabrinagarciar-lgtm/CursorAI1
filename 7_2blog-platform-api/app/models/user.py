from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Identity, Integer, text

import bcrypt
from sqlalchemy.dialects.postgresql import JSONB
from werkzeug.security import check_password_hash

from app import db
from app.models.pg_types import availability_status_enum, user_role_enum


class User(db.Model):
    """Authentication & profile persistence aligned with the PostgreSQL DDL."""

    __tablename__ = "users"

    id = db.Column(Integer, Identity(always=False), primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)

    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(
        user_role_enum,
        nullable=False,
        server_default=text("'customer'::user_role"),
    )
    availability_status = db.Column(
        availability_status_enum,
        nullable=False,
        server_default=text("'offline'::availability_status_type"),
    )

    expertise_areas = db.Column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        onupdate=lambda: datetime.now(UTC),
    )

    posts = db.relationship("Post", back_populates="author", lazy="dynamic")
    comments = db.relationship("Comment", back_populates="author", lazy="dynamic")
    refresh_tokens = db.relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="dynamic",
    )

    def set_password(self, password: str) -> None:
        """Store a bcrypt hash (new accounts and password updates)."""
        digest = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
        self.password_hash = digest.decode("utf-8")

    def check_password(self, password: str) -> bool:
        """Verify bcrypt; fall back to legacy Werkzeug hashes (pbkdf2/scrypt) for old rows."""
        if not self.password_hash:
            return False
        stored = self.password_hash
        if stored.startswith(("pbkdf2:", "scrypt:")):
            return check_password_hash(stored, password)
        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored.encode("utf-8"))
        except (ValueError, TypeError):
            return False
