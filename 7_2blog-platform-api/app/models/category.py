import uuid

from datetime import UTC, datetime
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255))

    parent_id = db.Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
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

    parent = db.relationship(
        "Category",
        remote_side="Category.id",
        backref=db.backref("children", lazy="dynamic"),
    )

    posts = db.relationship(
        "Post",
        secondary="post_categories",
        back_populates="categories",
    )
