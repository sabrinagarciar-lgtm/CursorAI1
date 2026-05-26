import uuid

from datetime import UTC, datetime

from sqlalchemy import Computed, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID

from app import db
from app.models.associations import post_categories, post_tags
from app.models.pg_types import post_status_enum

_SEARCH_VECTOR_EXPRESSION = (
    "setweight(to_tsvector('english', coalesce(title, '')), 'A') "
    "|| setweight(to_tsvector('english', coalesce(summary, '')), 'B') "
    "|| setweight(to_tsvector('english', coalesce(content, '')), 'C')"
)


class Post(db.Model):
    __tablename__ = "posts"

    __table_args__ = (
        Index("idx_posts_author_status_updated", "author_id", "status", "updated_at"),
        Index("idx_posts_status_published_catalog", "status", "published_at", "created_at"),
    )
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    author_id = db.Column(
        db.Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), nullable=False, unique=True, index=True)
    summary = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)

    status = db.Column(
        post_status_enum,
        nullable=False,
        server_default=text("'draft'::post_status"),
    )

    published_at = db.Column(db.DateTime(timezone=True))

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

    search_vector = db.Column(
        TSVECTOR,
        Computed(_SEARCH_VECTOR_EXPRESSION, persisted=True),
    )

    author = db.relationship("User", back_populates="posts")
    categories = db.relationship(
        "Category",
        secondary=post_categories,
        back_populates="posts",
        lazy="selectin",
    )
    tags = db.relationship(
        "Tag",
        secondary=post_tags,
        back_populates="posts",
        lazy="selectin",
    )
    comments = db.relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
        order_by="Comment.created_at",
    )
