"""PRD field validation helpers."""

from __future__ import annotations

import re

# Subject: alphanumeric + common punctuation (ASCII)
SUBJECT_PATTERN = re.compile(r"^[\w\s\.,!?@#$%^&*()_+\-=:\;'\"/]+$", re.ASCII)
