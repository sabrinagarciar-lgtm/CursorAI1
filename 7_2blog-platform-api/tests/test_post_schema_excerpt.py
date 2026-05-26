from app.schemas.post import excerpt_preview


def test_excerpt_prefers_summary():
    excerpt = excerpt_preview("Short blurb.", "fallback long content " * 20)
    assert excerpt == "Short blurb."


def test_excerpt_truncates_fallback_from_content():
    long_body = ("word_" * 200).strip()
    excerpt = excerpt_preview(None, long_body, length=50)
    assert len(excerpt) <= 50
    assert excerpt.endswith("...")
