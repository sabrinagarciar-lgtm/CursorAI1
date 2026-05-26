from types import SimpleNamespace

from app.routes.helpers import (
    can_manage_post,
    can_view_post,
    comment_visible,
    normalized_enum,
    user_is_admin,
)


def test_normalized_enum_from_string_uppercase():
    assert normalized_enum("PUBLISHED") == "published"


def test_normalized_enum_passes_through_lowercase_literal():
    assert normalized_enum("draft") == "draft"


def test_user_is_admin_flag():
    admin = SimpleNamespace(role="admin")
    customer = SimpleNamespace(role="customer")
    assert user_is_admin(admin) is True
    assert user_is_admin(customer) is False


def test_can_view_post_published_for_anonymous():
    post = SimpleNamespace(status="published", author_id=1)
    assert can_view_post(post, None)


def test_can_view_draft_blocks_anonymous():
    post = SimpleNamespace(status="draft", author_id=1)
    assert can_view_post(post, None) is False


def test_can_view_own_draft_via_author_scope():
    post = SimpleNamespace(status="draft", author_id=42)
    author = SimpleNamespace(id=42, role="customer")
    assert can_view_post(post, author)


def test_can_manage_post_author_or_similar():
    post = SimpleNamespace(author_id=7)
    author = SimpleNamespace(id=7)
    stranger = SimpleNamespace(id=88, role="customer")
    assert can_manage_post(post, author)
    assert can_manage_post(post, stranger) is False


def test_can_manage_post_admin_even_if_not_author():
    post = SimpleNamespace(author_id=33)
    admin = SimpleNamespace(id=999, role="admin")
    assert can_manage_post(post, admin)


def test_comment_visible_approved_without_viewer():
    comment = SimpleNamespace(is_approved=True, user_id=5)
    post = SimpleNamespace(author_id=1)
    assert comment_visible(comment, None, post)


def test_comment_visible_pending_hidden_from_anonymous():
    comment = SimpleNamespace(is_approved=False, user_id=5)
    post = SimpleNamespace(author_id=1)
    assert comment_visible(comment, None, post) is False


def test_comment_visible_pending_visible_to_author():
    comment = SimpleNamespace(is_approved=False, user_id=66)
    post = SimpleNamespace(author_id=1)
    viewer = SimpleNamespace(id=66, role="customer")
    assert comment_visible(comment, viewer, post)
