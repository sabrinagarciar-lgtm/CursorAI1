"""Bootstrap demo users, taxonomy, posts, and threaded comments (idempotent)."""

from __future__ import annotations

from datetime import UTC, datetime

from app import db
from app.models import Category, Comment, Post, Tag, User


def seed_demo_workspace() -> dict[str, int]:
    stats = {"users": 0, "categories": 0, "tags": 0, "posts": 0, "comments": 0}

    alex = User.query.filter(User.email == "alex@demo.example.com").one_or_none()
    if alex is None:
        alex = User(
            name="Alex Rivera",
            email="alex@demo.example.com",
            availability_status="available",
            expertise_areas=["react", "postgresql", "flask"],
        )
        alex.set_password("DemoPass123!")
        db.session.add(alex)
        stats["users"] += 1

    casey = User.query.filter(User.email == "casey@demo.example.com").one_or_none()
    if casey is None:
        casey = User(
            name="Casey Lee",
            email="casey@demo.example.com",
            availability_status="busy",
            expertise_areas=["technical-writing", "devops"],
        )
        casey.set_password("DemoPass123!")
        db.session.add(casey)
        stats["users"] += 1

    db.session.flush()

    cat_general = Category.query.filter_by(slug="general").one_or_none()
    if cat_general is None:
        cat_general = Category(
            name="General",
            slug="general",
            description="Platform updates & broader engineering notes",
        )
        db.session.add(cat_general)
        stats["categories"] += 1

    db.session.flush()

    cat_deep = Category.query.filter_by(slug="postgresql-internals").one_or_none()
    if cat_deep is None:
        cat_deep = Category(
            name="PostgreSQL internals",
            slug="postgresql-internals",
            description="Indexing, FTS, and planner trivia",
            parent_id=cat_general.id,
        )
        db.session.add(cat_deep)
        stats["categories"] += 1

    tag_pg = Tag.query.filter_by(slug="postgres").one_or_none()
    if tag_pg is None:
        tag_pg = Tag(name="PostgreSQL", slug="postgres")
        db.session.add(tag_pg)
        stats["tags"] += 1

    tag_fts = Tag.query.filter_by(slug="full-text-search").one_or_none()
    if tag_fts is None:
        tag_fts = Tag(name="Full Text Search", slug="full-text-search")
        db.session.add(tag_fts)
        stats["tags"] += 1

    db.session.flush()

    slug_a = "getting-started-with-postgresql"
    post_a = Post.query.filter_by(slug=slug_a).one_or_none()
    if post_a is None:
        post_a = Post(
            title="Getting Started with PostgreSQL",
            slug=slug_a,
            summary="A whirlwind tour of relational basics for API builders.",
            content=(
                "PostgreSQL mixes rock-solid transactional semantics with modern JSON "
                "and full-text primitives. Combine it with SQLAlchemy to prototype "
                "quickly, then tighten with DDL from docs/postgresql_schema.sql."
            ),
            author_id=alex.id,
            status="published",
            published_at=datetime.now(UTC),
        )
        db.session.add(post_a)
        db.session.flush()
        post_a.categories = [cat_general, cat_deep]
        post_a.tags = [tag_pg, tag_fts]
        stats["posts"] += 1

    slug_b = "database-scalability-patterns"
    post_b = Post.query.filter_by(slug=slug_b).one_or_none()
    if post_b is None:
        post_b = Post(
            title="Database Scalability Playbook",
            slug=slug_b,
            summary="Instrument before you shard—connection pools beat heroics.",
            content=(
                "Connection pooling stabilizes Flask APIs under bursty workloads. Tune "
                "autovacuum, lean on generated tsvectors for lexical search, and only "
                "partition datasets once dashboards prove hotspots."
            ),
            author_id=alex.id,
            status="published",
            published_at=datetime.now(UTC),
        )
        db.session.add(post_b)
        db.session.flush()
        post_b.categories = [cat_general]
        post_b.tags = [tag_pg]
        stats["posts"] += 1

    slug_c = "draft-auth-rfc"
    post_c = Post.query.filter_by(slug=slug_c).one_or_none()
    if post_c is None:
        post_c = Post(
            title="JWT + refresh tokens RFC draft",
            slug=slug_c,
            summary=None,
            content=(
                "Draft content for Casey: wire additional claims once mobile clients "
                "ship. Use scope=mine to verify draft visibility stays author-only."
            ),
            author_id=casey.id,
            status="draft",
        )
        db.session.add(post_c)
        db.session.flush()
        post_c.categories = [cat_general]
        stats["posts"] += 1

    db.session.flush()

    post_a_row = Post.query.filter_by(slug=slug_a).one()
    roots = Comment.query.filter_by(post_id=post_a_row.id, parent_id=None).count()
    if roots == 0:
        root = Comment(
            post_id=post_a_row.id,
            user_id=alex.id,
            content=(
                "This is a great starting guide — especially the FTS callouts tying "
                "back to postgres search_vector indexing."
            ),
            is_approved=True,
        )
        db.session.add(root)
        db.session.flush()

        reply = Comment(
            post_id=post_a_row.id,
            user_id=casey.id,
            parent_id=root.id,
            content="Agreed, especially the pragmatic SQLAlchemy + DDL split.",
            is_approved=True,
        )
        db.session.add(reply)
        stats["comments"] += 2

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()


        raise

    return stats
