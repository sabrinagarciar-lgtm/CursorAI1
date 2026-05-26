"""One-off Postgres admin helpers (outside normal ORM routing)."""

from __future__ import annotations

import os
import re

from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url


def ensure_postgres_database(database_url: str | None) -> str | None:
    """
    If ``database_url`` targets PostgreSQL and the database name does not exist yet,
    connect to the maintenance DB and ``CREATE DATABASE`` (needs CREATEDB or superuser).

    Returns the database name created, or ``None`` if nothing was created (already
    exists or not PostgreSQL).

    Raises if the URL is PostgreSQL without a database component, if the DB name is
    unsafe for identifiers, or if creation fails for permissions/other reasons.
    """
    if not database_url:
        raise RuntimeError("SQLALCHEMY_DATABASE_URI is not set.")

    url = make_url(database_url)

    if not url.drivername.startswith("postgresql"):
        return None

    dbname = url.database
    if not dbname:
        raise RuntimeError("PostgreSQL URL must include a database name segment.")

    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,62}", dbname):
        raise RuntimeError(
            f"Refusing CREATE DATABASE with non-simple identifier name: {dbname!r}"
        )

    maint = (os.getenv("POSTGRES_MAINTENANCE_DATABASE") or "postgres").strip()
    if not maint:
        raise RuntimeError("POSTGRES_MAINTENANCE_DATABASE, if set, cannot be empty.")

    admin_url = url.set(database=maint)

    admin_engine = create_engine(
        admin_url,
        isolation_level="AUTOCOMMIT",
    )

    preparer = admin_engine.dialect.identifier_preparer
    quoted = preparer.quote(dbname)

    created: str | None = None

    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :n"),
                {"n": dbname},
            ).scalar()
            if not exists:
                conn.execute(text(f"CREATE DATABASE {quoted}"))
                created = dbname
    finally:
        admin_engine.dispose()

    return created
