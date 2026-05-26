"""PostgreSQL native ENUM wrappers (created once via ``MetaData.create_all``)."""

from sqlalchemy.dialects.postgresql import ENUM

availability_status_enum = ENUM(
    "available",
    "busy",
    "offline",
    name="availability_status_type",
    create_constraint=True,
    validate_strings=True,
)

post_status_enum = ENUM(
    "draft",
    "published",
    "archived",
    name="post_status",
    create_constraint=True,
    validate_strings=True,
)

user_role_enum = ENUM(
    "customer",
    "agent",
    "admin",
    name="user_role",
    create_constraint=True,
    validate_strings=True,
)
