"""Unique slug derivation for PostgreSQL ``posts.slug`` uniqueness constraint."""

from __future__ import annotations

import uuid as uuid_pkg

from app.utils.slug import slugify


def unique_post_slug(
    *,
    title: str,
    explicit_slug: str | None = None,
    exclude_post_id=None,
) -> str:
    from app.models.post import Post

    base = slugify(explicit_slug or title)

    if not base:
        base = uuid_pkg.uuid4().hex[:12]

    candidate = base[:255]
    iteration = 0

    while True:

        clash = Post.query.filter(Post.slug == candidate)



        if exclude_post_id:


            clash = clash.filter(Post.id != exclude_post_id)


        if clash.first() is None:


            break

        iteration += 1




        suffix = uuid_pkg.uuid4().hex[:6]




        trimmed = base[:230]






        candidate = f"{trimmed}-{suffix}-{iteration}"[:255]


    return candidate
