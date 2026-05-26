from app.utils.sanitize import sanitize_plain_text


def test_sanitize_removes_markup():
    txt = sanitize_plain_text("Hello<script>evil()</script>World")
    assert "<script>" not in (txt or "")
    assert "Hello" in txt and "World" in txt


def test_sanitize_none_roundtrip():
    assert sanitize_plain_text(None) is None
