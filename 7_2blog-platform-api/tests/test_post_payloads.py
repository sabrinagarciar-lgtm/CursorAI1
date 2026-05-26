from types import SimpleNamespace

from app.caching.post_payloads import serialized_post_feed


def _fake_pager(*, items, total=0, page=1, per_page=10):
    pages = (total + per_page - 1) // per_page if per_page else 0

    return SimpleNamespace(
        items=items,
        page=page,
        per_page=per_page,
        total=total,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
        next_num=page + 1 if page < pages else None,
        prev_num=page - 1 if page > 1 else None,
    )


def test_serialized_post_feed_empty():
    body = serialized_post_feed(_fake_pager(items=[]))
    assert body["data"] == []
    assert body["meta"]["total"] == 0


def test_serialized_post_detail_roundtrip():
    from uuid import uuid4

    from app.caching.post_payloads import serialized_post_detail

    pid = uuid4()
    node = SimpleNamespace(
        id=pid,
        title="Tit",
        slug="tit-slug",
        summary=None,
        content="x" * 20,
        status="published",
        published_at=None,
        categories=[],
        tags=[],
        author=SimpleNamespace(id=1, name="A"),
        created_at=None,
        updated_at=None,
    )
    out = serialized_post_detail(node)
    assert out["data"]["slug"] == "tit-slug"
    assert out["meta"] is None
