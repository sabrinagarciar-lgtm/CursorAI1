"""bcrypt password hashing (NFR-005, min cost 12)."""

from __future__ import annotations

import bcrypt


def hash_password(plain: str, *, cost: int = 12) -> str:
    if cost < 12:
        cost = 12
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=cost)).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False
