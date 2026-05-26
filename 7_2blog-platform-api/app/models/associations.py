"""Join tables wired through SQLAlchemy's declarative registry."""

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app import db

_UUID = UUID(as_uuid=True)

post_categories = db.Table(
    "post_categories",
    db.Column(
        "post_id",
        _UUID,
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "category_id",
        _UUID,
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

post_tags = db.Table(
    "post_tags",
    db.Column(
        "post_id",
        _UUID,
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "tag_id",
        _UUID,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
