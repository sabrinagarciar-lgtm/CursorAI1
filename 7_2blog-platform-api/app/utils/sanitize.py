"""Strip dangerous markup from text fields stored and returned via the API."""

from __future__ import annotations

import bleach


def sanitize_plain_text(value: str | None) -> str | None:
    """Remove HTML tags and normalize whitespace; suitable for titles and prose bodies."""
    if value is None:
        return None
    stripped = bleach.clean(value, tags=[], strip=True)
    return stripped.strip()
