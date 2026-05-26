import secrets
import uuid
from datetime import UTC, datetime, timedelta

from flask import current_app
from sqlalchemy.dialects.postgresql import UUID

from app import db


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    token = db.Column(db.String(512), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
    )

    user = db.relationship("User", back_populates="refresh_tokens")

    @staticmethod
    def mint_for_user(user_id: int):
        ttl_days = getattr(
            current_app.config,
            "REFRESH_TOKEN_DAYS",
            14,
        )
        plaintext = secrets.token_urlsafe(64)
        instance = RefreshToken(
            user_id=user_id,
            token=plaintext,
            expires_at=datetime.now(UTC) + timedelta(days=ttl_days),
            revoked=False,
        )
        return instance, plaintext
