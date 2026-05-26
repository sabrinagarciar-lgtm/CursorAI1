"""Slug-keyed PostgreSQL post CRUD, categories/tags M2M, threaded comments."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from flask import current_app
from flask.views import MethodView
from flask_jwt_extended import verify_jwt_in_request
from flask_smorest import Blueprint
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, selectinload
from werkzeug.exceptions import Forbidden, NotFound, Unauthorized, UnprocessableEntity

from app import cache, db
from app.caching import (
    invalidate_posts_generation,
    post_detail_cache_key,
    post_list_cache_key,
    posts_cache_version,
    serialized_post_detail,
    serialized_post_feed,
)
from app.models import Category, Comment, Post, Tag, User
from app.routes.helpers import (
    can_manage_post,
    can_view_post,
    load_actor,
    normalized_enum,
    resolve_optional_viewer,
    user_is_admin,
)
from app.schemas.comment import (
    CommentCreateSchema,
    CommentCreatedEnvelopeSchema,
    PaginatedCommentsResponseSchema,
)
from app.schemas.common import CommentsListQuerySchema, PostsListQuerySchema, pagination_meta
from app.schemas.post import (
    PaginatedPostsResponseSchema,
    PostCreateUpdateSchema,
    PostEnvelopeSchema,
)
from app.utils.post_slug import unique_post_slug
from app.utils.sanitize import sanitize_plain_text

blp = Blueprint("Posts", __name__)


def _posts_cache_reads_enabled() -> bool:
    if not current_app.config.get("CACHE_POSTS_ENABLED", True):
        return False
    disabled = str(current_app.config.get("CACHE_DISABLED") or "").lower()
    return disabled not in {"1", "true", "yes"}


def _safe_posts_cache_set(gen_start: int, cache_key: str, payload: dict, ttl: int) -> None:
    if not _posts_cache_reads_enabled():
        return
    try:
        if posts_cache_version(cache) != gen_start:
            return
        cache.set(cache_key, payload, timeout=ttl)
    except Exception:
        current_app.logger.warning("posts cache SET failed", exc_info=True)


def _invalidate_post_payload_caches() -> None:
    try:
        invalidate_posts_generation(cache)
    except Exception:
        current_app.logger.warning("posts cache invalidate failed", exc_info=True)


def _categories(ids):
    out = []
    for cid in ids:
        cat = db.session.get(Category, cid)
        if cat is None:
            raise UnprocessableEntity(description=f"Unknown category {cid}.")
        out.append(cat)
    return out


def _tags(ids):
    out = []
    for tid in ids:
        tag = db.session.get(Tag, tid)
        if tag is None:
            raise UnprocessableEntity(description=f"Unknown tag {tid}.")
        out.append(tag)


def _set_status(post: Post, status_val: str | None):
    if not status_val:
        return
    canon = normalized_enum(status_val)
    post.status = canon
    if canon == "published" and post.published_at is None:
        post.published_at = datetime.now(UTC)




def _comments_visible_query(hub: Post, spectator: User | None):
    chatter = Comment.query.options(joinedload(Comment.author)).filter(
        Comment.post_id == hub.id,
    )
    if spectator is None:
        return chatter.filter(Comment.is_approved.is_(True))
    if user_is_admin(spectator) or spectator.id == hub.author_id:
        return chatter
    return chatter.filter(or_(Comment.is_approved.is_(True), Comment.user_id == spectator.id))


def _readable(slug: str) -> tuple[Post, User | None]:
    guest = resolve_optional_viewer()

    row = (
        Post.query.options(
            joinedload(Post.author),
            selectinload(Post.categories),
            selectinload(Post.tags),
        )
        .filter(Post.slug == slug)
        .one_or_none()
    )

    if row is None:
        raise NotFound(description="Post not found.")
    if not can_view_post(row, guest):
        raise Forbidden(description="Insufficient permissions.")

    return row, guest


@blp.route("")
class Feed(MethodView):
    @blp.arguments(PostsListQuerySchema, location="query")
    @blp.response(200, PaginatedPostsResponseSchema)
    def get(self, q):
        verify_jwt_in_request(optional=True)
        viewer = resolve_optional_viewer()

        cache_on = _posts_cache_reads_enabled()
        gen_start: int | None = posts_cache_version(cache) if cache_on else None
        cache_key: str | None = None

        if cache_on and gen_start is not None:
            vid = viewer.id if viewer and q["scope"] == "mine" else None
            cache_key = post_list_cache_key(
                gen_start,
                scope=q["scope"],
                page=q["page"],
                per_page=q["per_page"],
                viewer_id=vid,
            )
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

        if q["scope"] == "mine":
            if viewer is None:
                raise Unauthorized(description="scope=mine requires authentication.")
            pager = (
                Post.query.options(
                    joinedload(Post.author),
                    selectinload(Post.categories),
                    selectinload(Post.tags),
                )
                .filter(Post.author_id == viewer.id)
                .order_by(Post.updated_at.desc())
                .paginate(page=q["page"], per_page=q["per_page"], error_out=False)
            )
        else:
            pager = (
                Post.query.options(
                    joinedload(Post.author),
                    selectinload(Post.categories),
                    selectinload(Post.tags),
                )
                .filter(Post.status == "published")
                .order_by(Post.published_at.desc().nullslast(), Post.created_at.desc())
                .paginate(page=q["page"], per_page=q["per_page"], error_out=False)
            )

        payload = serialized_post_feed(pager)
        ttl = current_app.config.get("CACHE_POSTS_LIST_TTL", 60)

        if cache_on and cache_key is not None and gen_start is not None:
            _safe_posts_cache_set(gen_start, cache_key, payload, ttl)
        return payload

    @blp.arguments(PostCreateUpdateSchema)
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(201, PostEnvelopeSchema)
    def post(self, body):
        verify_jwt_in_request()

        me = load_actor()

        title_clean = sanitize_plain_text(body["title"]) or body["title"].strip()
        summary_clean = sanitize_plain_text(body.get("summary")) if body.get("summary") else None
        content_clean = sanitize_plain_text(body["content"]) or body["content"].strip()

        slug = unique_post_slug(title=title_clean, explicit_slug=body.get("slug"))

        row = Post(
            title=title_clean,
            slug=slug,
            summary=summary_clean,
            content=content_clean,
            author_id=me.id,
        )

        _set_status(row, body.get("status"))

        db.session.add(row)

        db.session.flush()

        cats = body.get("category_ids") or []

        tg = body.get("tag_ids") or []

        if cats:
            row.categories = _categories(cats)

        if tg:
            row.tags = _tags(tg)

        db.session.commit()
        _invalidate_post_payload_caches()

        node, _spectator = _readable(row.slug)
        return serialized_post_detail(node)


@blp.route("/<string:slug>")
class Slug(MethodView):
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, PostEnvelopeSchema)
    def get(self, slug):
        verify_jwt_in_request(optional=True)

        cache_on = _posts_cache_reads_enabled()
        gen_start: int | None = posts_cache_version(cache) if cache_on else None

        # Fast path — published bodies are identical for anonymous and authenticated readers.
        if cache_on and gen_start is not None:
            pub_key = post_detail_cache_key(gen_start, slug=slug, tier="published")
            cached_pub = cache.get(pub_key)
            if cached_pub is not None:
                return cached_pub

        node, _spectator = _readable(slug)
        tier = "published" if normalized_enum(node.status) == "published" else "draft"

        if cache_on and gen_start is not None and tier == "draft":
            draft_key = post_detail_cache_key(gen_start, slug=slug, tier="draft")
            cached_draft = cache.get(draft_key)
            if cached_draft is not None:
                return cached_draft

        payload = serialized_post_detail(node)
        ttl = current_app.config.get("CACHE_POSTS_DETAIL_TTL", 120)

        if cache_on and gen_start is not None:
            key = post_detail_cache_key(gen_start, slug=slug, tier=tier)
            _safe_posts_cache_set(gen_start, key, payload, ttl)

        return payload

    @blp.arguments(PostCreateUpdateSchema)
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, PostEnvelopeSchema)
    def put(self, body, slug):
        verify_jwt_in_request()

        me = load_actor()

        row = Post.query.filter(Post.slug == slug).one_or_none()

        if row is None:
            raise NotFound(description="Post not found.")

        if not can_manage_post(row, me):
            raise Forbidden(description="Insufficient permissions.")

        slug_override = body.get("slug")

        title_clean = sanitize_plain_text(body["title"]) or body["title"].strip()
        summary_clean = sanitize_plain_text(body.get("summary")) if body.get("summary") else None
        content_clean = sanitize_plain_text(body["content"]) or body["content"].strip()

        if slug_override:
            row.slug = unique_post_slug(
                title=title_clean,
                explicit_slug=slug_override,
                exclude_post_id=row.id,
            )

        row.title = title_clean
        row.summary = summary_clean
        row.content = content_clean

        _set_status(row, body.get("status"))

        if body.get("category_ids") is not None:
            row.categories = _categories(body["category_ids"])

        if body.get("tag_ids") is not None:
            row.tags = _tags(body["tag_ids"])

        db.session.commit()
        _invalidate_post_payload_caches()

        refreshed, _spectator = _readable(row.slug)
        return serialized_post_detail(refreshed)

    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(204)
    def delete(self, slug):
        verify_jwt_in_request()

        actor = load_actor()

        row = Post.query.filter(Post.slug == slug).one_or_none()

        if row is None:
            raise NotFound(description="Post not found.")

        if not can_manage_post(row, actor):
            raise Forbidden(description="Insufficient permissions.")

        db.session.delete(row)

        db.session.commit()
        _invalidate_post_payload_caches()

        return None


@blp.route("/<string:slug>/comments")
class Threads(MethodView):
    @blp.arguments(CommentsListQuerySchema, location="query")
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(200, PaginatedCommentsResponseSchema)
    def get(self, q, slug):
        verify_jwt_in_request(optional=True)

        node, spectator = _readable(slug)

        chatter = _comments_visible_query(node, spectator)

        pager = chatter.order_by(Comment.created_at.asc()).paginate(
            page=q["page"], per_page=q["per_page"], error_out=False
        )

        return {"data": pager.items or [], "meta": pagination_meta(pager)}

    @blp.arguments(CommentCreateSchema)
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(201, CommentCreatedEnvelopeSchema)
    def post(self, payload, slug):
        verify_jwt_in_request()

        poster = load_actor()

        node, _ = _readable(slug)

        parent_anchor = payload.get("parent_comment_id")

        ancestor = None

        if parent_anchor:
            ancestor = db.session.get(Comment, parent_anchor)
            if ancestor is None or ancestor.post_id != node.id:
                raise UnprocessableEntity(description="Invalid parent_comment_id.")

        body_plain = sanitize_plain_text(payload["content"]) or ""

        if not body_plain.strip():
            raise UnprocessableEntity(description="Comment content cannot be empty after sanitization.")

        reply = Comment(
            post_id=node.id,
            user_id=poster.id,
            content=body_plain.strip(),
            parent_id=parent_anchor,
        )

        db.session.add(reply)

        db.session.commit()

        out = Comment.query.options(joinedload(Comment.author)).filter_by(id=reply.id).one()

        return {"data": out, "meta": None}


@blp.route("/<string:slug>/comments/<uuid:reply_id>")
class ThreadReply(MethodView):
    @blp.doc(security=[{"BearerAuth": []}])
    @blp.response(204)
    def delete(self, slug, reply_id: UUID):
        verify_jwt_in_request()

        actor = load_actor()

        hub, _ = _readable(slug)

        chatter = Comment.query.filter_by(post_id=hub.id, id=reply_id).one_or_none()
        if chatter is None:
            raise NotFound(description="Reply not found.")

        authorised = chatter.user_id == actor.id
        authorised = authorised or hub.author_id == actor.id
        authorised = authorised or user_is_admin(actor)

        if not authorised:
            raise Forbidden(description="Cannot delete this reply.")

        db.session.delete(chatter)

        db.session.commit()

        return None
