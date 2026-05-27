"""XSS mitigation: strip/neutralize user-generated HTML/text (NFR-008/015)."""

from __future__ import annotations

import bleach


def sanitize_text(content: str, *, strip: bool = True) -> str:
    """Bleach escapes tags; keep plain text safe for JSON clients."""
    if content is None:
        return ""
    cleaned = bleach.clean(content, tags=[], attributes={}, strip=strip)
    return cleaned.strip()
