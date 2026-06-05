from __future__ import annotations

from app.extensions import db
from app.models.platform import SocialComment, SocialPost
from app.utils.security import sanitize_text


class SocialError(Exception):
    pass


def list_posts(page: int = 1, per_page: int = 10) -> dict:
    query = SocialPost.query.order_by(SocialPost.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "posts": [p.to_dict() for p in pagination.items],
        "page": page,
        "totalPages": pagination.pages or 1,
        "hasMore": pagination.has_next,
    }


def create_post(payload: dict) -> dict:
    content = sanitize_text(str(payload.get("content", "")), max_length=2000)
    if not content.strip():
        raise SocialError("Content is required.")
    post = SocialPost(
        author_name=sanitize_text(str(payload.get("authorName") or "Anonymous"), max_length=100),
        author_username=sanitize_text(str(payload.get("authorUsername") or "user"), max_length=100),
        content=content,
        image_url=payload.get("imageUrl"),
    )
    db.session.add(post)
    db.session.commit()
    return post.to_dict()


def like_post(post_id: int) -> dict:
    post = db.session.get(SocialPost, post_id)
    if post is None:
        raise SocialError("Post not found.")
    post.likes += 1
    db.session.commit()
    return post.to_dict()


def add_comment(post_id: int, payload: dict) -> dict:
    post = db.session.get(SocialPost, post_id)
    if post is None:
        raise SocialError("Post not found.")
    content = sanitize_text(str(payload.get("content", "")), max_length=1000)
    if not content.strip():
        raise SocialError("Comment content is required.")
    comment = SocialComment(
        post_id=post_id,
        author_name=sanitize_text(str(payload.get("authorName") or "Anonymous"), max_length=100),
        content=content,
    )
    db.session.add(comment)
    db.session.commit()
    return comment.to_dict()
