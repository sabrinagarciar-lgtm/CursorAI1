"""URL-safe slugification for categories."""

from __future__ import annotations

import re
import unicodedata


_slug_re = re.compile(r"[^\w\s-]", re.UNICODE)


def slugify(text: str) -> str:
    """Turn ``text`` into a lowercase hyphenated slug."""
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = _slug_re.sub("", ascii_text).strip().lower()
    ascii_text = re.sub(r"[\s_-]+", "-", ascii_text)
    return ascii_text.strip("-")
