import uuid

from datetime import UTC, datetime
from sqlalchemy import ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app import db


class Comment(db.Model):
    __tablename__ = "comments"

    __table_args__ = (Index("idx_comments_post_created_at", "post_id", "created_at"),)
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = db.Column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = db.Column(
        db.Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    parent_id = db.Column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
    )

    content = db.Column(db.Text, nullable=False)
    is_approved = db.Column(db.Boolean, nullable=False, default=True)

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

    post = db.relationship("Post", back_populates="comments")
    author = db.relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="comments",
    )

