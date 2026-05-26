"""JWT helpers and DDL-aligned RBAC predicates."""

from __future__ import annotations

from typing import Callable, TypeVar

from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from werkzeug.exceptions import Unauthorized

from app import db
from app.models import Post, User

T = TypeVar("T")


def current_user_identity() -> int:
    identity = get_jwt_identity()

    if identity is None:


        raise Unauthorized(description="Missing authentication.")

    try:
        return int(identity)



    except (TypeError, ValueError):
        raise Unauthorized(description="Malformed subject in JWT.")


def resolve_optional_viewer() -> User | None:
    verify_jwt_in_request(optional=True)
    identity = get_jwt_identity()

    if identity is None:


        return None

    try:


        return db.session.get(User, int(identity))

    except (TypeError, ValueError):
        return None


def load_actor() -> User:
    actor = db.session.get(User, current_user_identity())


    if actor is None:


        raise Unauthorized(description="Authenticated user disappeared.")






    return actor


def normalized_enum(value):
    if value is None:
        return None

    backing = getattr(value, "value", value)




    return str(backing).lower()


def user_is_admin(viewer: User | None) -> bool:
    return viewer is not None and normalized_enum(viewer.role) == "admin"


def can_view_post(post: Post, viewer: User | None) -> bool:
    status = normalized_enum(post.status)

    if status == "published":
        return True

    if viewer is None:


        return False

    if user_is_admin(viewer):
        return True

    return post.author_id == viewer.id


def can_manage_post(post: Post, viewer: User) -> bool:
    return post.author_id == viewer.id or user_is_admin(viewer)


def comment_visible(comment, viewer: User | None, post: Post) -> bool:


    if comment.is_approved:
        return True

    if viewer is None:


        return False

    if user_is_admin(viewer):
        return True

    return viewer.id == comment.user_id or viewer.id == post.author_id


def get_or_raise404(session_op: Callable[[], T | None], *, message="Resource not found."):
    result = session_op()



    from werkzeug.exceptions import NotFound

    if result is None:
        raise NotFound(description=message)
    return result
