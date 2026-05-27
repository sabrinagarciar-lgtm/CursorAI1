from __future__ import annotations

from app.auth import hash_password, verify_password
from app.db import get_db
from app.utils.security import sanitize_text, validate_email


class UserError(Exception):
    pass


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "role": row["role"],
        "active": bool(row["active"]),
        "created_at": row["created_at"],
    }


def get_user_by_id(user_id: int) -> dict | None:
    db = get_db()
    row = db.execute(
        "SELECT id, email, name, role, active, created_at FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    return _row_to_dict(row) if row else None


def get_user_by_email(email: str) -> dict | None:
    db = get_db()
    row = db.execute(
        "SELECT id, email, password_hash, name, role, active, created_at FROM users WHERE email = ?",
        (email.lower(),),
    ).fetchone()
    if row is None:
        return None
    data = _row_to_dict(row)
    data["password_hash"] = row["password_hash"]
    return data


def list_users() -> list[dict]:
    db = get_db()
    rows = db.execute(
        "SELECT id, email, name, role, active, created_at FROM users ORDER BY id"
    ).fetchall()
    return [_row_to_dict(row) for row in rows]


def create_user(
    email: str,
    password: str,
    name: str,
    role: str = "customer",
) -> dict:
    cleaned_email = validate_email(email)
    cleaned_name = sanitize_text(name, max_length=100)
    if role not in ("admin", "customer"):
        raise UserError("Role must be 'admin' or 'customer'.")
    if len(password) < 8:
        raise UserError("Password must be at least 8 characters.")

    db = get_db()
    existing = db.execute(
        "SELECT id FROM users WHERE email = ?", (cleaned_email,)
    ).fetchone()
    if existing:
        raise UserError("Email already registered.")

    cursor = db.execute(
        """
        INSERT INTO users (email, password_hash, name, role, active)
        VALUES (?, ?, ?, ?, 1)
        """,
        (cleaned_email, hash_password(password), cleaned_name, role),
    )
    db.commit()
    return get_user_by_id(cursor.lastrowid)  # type: ignore[arg-type]


def update_user(user_id: int, payload: dict, *, is_admin: bool) -> dict:
    user = get_user_by_id(user_id)
    if user is None:
        raise UserError("User not found.")

    updates: list[str] = []
    values: list = []

    if "name" in payload and payload["name"] is not None:
        updates.append("name = ?")
        values.append(sanitize_text(str(payload["name"]), max_length=100))

    if is_admin:
        if "role" in payload and payload["role"] is not None:
            role = str(payload["role"])
            if role not in ("admin", "customer"):
                raise UserError("Role must be 'admin' or 'customer'.")
            updates.append("role = ?")
            values.append(role)
        if "active" in payload and payload["active"] is not None:
            updates.append("active = ?")
            values.append(1 if payload["active"] else 0)

    if "password" in payload and payload["password"]:
        if len(str(payload["password"])) < 8:
            raise UserError("Password must be at least 8 characters.")
        updates.append("password_hash = ?")
        values.append(hash_password(str(payload["password"])))

    if not updates:
        return user

    values.append(user_id)
    db = get_db()
    db.execute(
        f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
        values,
    )
    db.commit()
    return get_user_by_id(user_id)  # type: ignore[return-value]


def delete_user(user_id: int) -> None:
    db = get_db()
    row = db.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise UserError("User not found.")
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()


def authenticate_user(email: str, password: str) -> dict:
    cleaned_email = validate_email(email)
    user = get_user_by_email(cleaned_email)
    if user is None or not verify_password(user["password_hash"], password):
        raise UserError("Invalid email or password.")
    if not user["active"]:
        raise UserError("Account is disabled.")
    return {k: v for k, v in user.items() if k != "password_hash"}
