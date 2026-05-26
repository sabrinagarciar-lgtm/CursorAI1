import uuid

from sqlalchemy.dialects.postgresql import UUID

from app import db


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False, unique=True)
    slug = db.Column(db.String(50), nullable=False, unique=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
    )

    posts = db.relationship(
        "Post",
        secondary="post_tags",
        back_populates="tags",
    )
