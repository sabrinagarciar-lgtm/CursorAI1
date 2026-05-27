"""Flask application factory."""

from __future__ import annotations

import importlib
import os
import sqlite3
from pathlib import Path

import click
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from sqlalchemy import event, select
from sqlalchemy.engine import Engine

from app.extensions import db, limiter
from app.routes import register_blueprints
from app.routes.errors import jwt_manager, register_error_handlers, register_jwt_handlers

_ROOT = Path(__file__).resolve().parents[1]


def _sqlite_enable_foreign_keys(dbapi_connection, _connection_record=None) -> None:
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_app(config_name: str | None = None) -> Flask:
    load_dotenv()
    flask_env = config_name or os.getenv("FLASK_ENV", "development")

    tmpl_dir = str(Path(__file__).parent / "templates")
    app = Flask(__name__, template_folder=tmpl_dir)

    from config import config_by_name, ensure_directories

    cfg = config_by_name.get(flask_env, config_by_name["development"])
    ensure_directories(cfg)
    app.config.from_object(cfg)

    forced_db = os.getenv("DATABASE_URL_OVERRIDE")
    if forced_db:
        app.config["SQLALCHEMY_DATABASE_URI"] = forced_db

    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    register_jwt_handlers(app)
    jwt_manager.init_app(app)
    app.config.setdefault("JWT_TOKEN_LOCATION", ["headers"])
    app.config.setdefault("JWT_ALGORITHM", "HS256")

    db.init_app(app)
    limiter.init_app(app)

    testing_mode = flask_env == "testing" or os.getenv("PYTEST_CURRENT_TEST") is not None or app.testing
    if testing_mode:
        limiter.enabled = False
    elif os.getenv("DISABLE_RATE_LIMIT", "").lower() in {"1", "true", "yes"}:
        limiter.enabled = False

    register_error_handlers(app)
    event.listen(Engine, "connect", _sqlite_enable_foreign_keys)

    importlib.import_module("app.models")
    register_blueprints(app)

    cors_origins = app.config.get("CORS_ORIGINS")
    if cors_origins:
        from flask_cors import CORS

        CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    @app.route("/healthz")
    def health():  # pragma: no cover
        return jsonify({"status": "ok"})

    openapi_path = _ROOT / "docs" / "openapi.yaml"
    if openapi_path.exists():

        @app.route("/docs/openapi.yaml")
        def openapi_spec():
            return send_from_directory(str(openapi_path.parent.resolve()), openapi_path.name)

        @app.route("/docs/")
        def swagger_console():
            from flask import render_template

            return render_template("swagger.html")

    register_cli(app)
    return app


def register_cli(flask_app: Flask) -> None:
    """Lightweight helpers for provisioning dev/test environments."""

    @flask_app.cli.command("init-db")
    def init_db_command():
        with flask_app.app_context():
            db.drop_all()
            db.create_all()
            click.echo("Database recreated.")

    @flask_app.cli.command("seed-users")
    @click.option("--admin-email", default="admin@example.com")
    @click.option("--admin-password", default="AdminSecure!234")
    @click.option("--agent-email", default="agent@example.com")
    def seed_demo_users(admin_email: str, admin_password: str, agent_email: str):
        """Insert a demo admin + technician (idempotent-ish)."""

        from app.models.user import AvailabilityStatus, User, UserRole
        from app.utils.passwords import hash_password

        with flask_app.app_context():
            db.create_all()

            normalized_admin = admin_email.strip().lower()
            if db.session.scalar(select(User.id).where(User.email == normalized_admin)):
                click.echo("Users already seeded — aborting.")
                return

            admins = User(
                name="Support Administrator",
                email=normalized_admin,
                password_hash=hash_password(admin_password, cost=int(flask_app.config.get("BCRYPT_COST", 12))),
                role=UserRole.admin.value,
                availability_status=AvailabilityStatus.available.value,
                expertise_areas=["general", "billing", "technical"],
            )
            agent = User(
                name="Default Agent",
                email=agent_email.strip().lower(),
                password_hash=hash_password("AgentSecure!234", cost=int(flask_app.config.get("BCRYPT_COST", 12))),
                role=UserRole.agent.value,
                availability_status=AvailabilityStatus.available.value,
                expertise_areas=["technical", "general"],
            )
            db.session.add_all([admins, agent])
            db.session.commit()
            click.echo("Seeded admin + agent accounts.")
