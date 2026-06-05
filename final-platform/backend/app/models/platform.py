from __future__ import annotations

from datetime import datetime, timezone

from app.extensions import db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class KanbanTask(db.Model):
    __tablename__ = "kanban_tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    column_id = db.Column(db.String(32), nullable=False, default="todo")
    assignee = db.Column(db.String(100), default="Unassigned")
    priority = db.Column(db.String(16), default="medium")
    due_date = db.Column(db.String(10), nullable=True)
    position = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description or "",
            "columnId": self.column_id,
            "assignee": self.assignee,
            "priority": self.priority,
            "dueDate": self.due_date,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class SocialPost(db.Model):
    __tablename__ = "social_posts"

    id = db.Column(db.Integer, primary_key=True)
    author_name = db.Column(db.String(100), nullable=False)
    author_username = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    likes = db.Column(db.Integer, default=0)
    shares = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=_utcnow)

    comments = db.relationship("SocialComment", backref="post", lazy=True, cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user": {
                "id": f"u{self.id}",
                "name": self.author_name,
                "username": self.author_username,
                "avatarColor": "#6366f1",
            },
            "content": self.content,
            "imageUrl": self.image_url,
            "timestamp": self._relative_time(),
            "likes": self.likes,
            "likedByMe": False,
            "shares": self.shares,
            "bookmarked": False,
            "comments": [c.to_dict() for c in self.comments],
        }

    def _relative_time(self) -> str:
        if not self.created_at:
            return "just now"
        delta = _utcnow() - self.created_at.replace(tzinfo=timezone.utc)
        hours = int(delta.total_seconds() // 3600)
        if hours < 1:
            return "just now"
        if hours < 24:
            return f"{hours}h ago"
        return f"{hours // 24}d ago"


class SocialComment(db.Model):
    __tablename__ = "social_comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("social_posts.id"), nullable=False)
    author_name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user": {"id": f"c{self.id}", "name": self.author_name, "username": self.author_name.lower().replace(" ", "_"), "avatarColor": "#10b981"},
            "content": self.content,
            "timestamp": "recently",
            "likes": self.likes,
            "likedByMe": False,
        }


class SupportTicket(db.Model):
    __tablename__ = "support_tickets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(32), default="open")
    priority = db.Column(db.String(16), default="medium")
    category = db.Column(db.String(64), default="general")
    customer_email = db.Column(db.String(200), nullable=False)
    assignee = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=_utcnow)
    updated_at = db.Column(db.DateTime, default=_utcnow, onupdate=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "category": self.category,
            "customerEmail": self.customer_email,
            "assignee": self.assignee,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserSettings(db.Model):
    __tablename__ = "user_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, unique=True, nullable=False)
    settings_json = db.Column(db.Text, nullable=False, default="{}")
    updated_at = db.Column(db.DateTime, default=_utcnow, onupdate=_utcnow)
