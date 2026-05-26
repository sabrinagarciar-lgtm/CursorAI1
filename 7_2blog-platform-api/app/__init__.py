from __future__ import annotations

import importlib
import os

from dotenv import load_dotenv
from flask_caching import Cache
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_smorest import Api
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

from config import DevelopmentConfig, build_sqlalchemy_database_uri, config_by_name

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()
api = Api()
limiter = Limiter(key_func=get_remote_address)
cache = Cache()


def create_app(config_name: str | None = None):
    """Application factory using ``FLASK_ENV`` / ``config.config_by_name``."""
    load_dotenv()

    app = Flask(__name__)
    env = config_name or os.getenv("FLASK_ENV", "development")
    cfg = config_by_name.get(env, DevelopmentConfig)
    app.config.from_object(cfg)
    if env == "testing":
        testing_uri = (
            os.getenv("TEST_DATABASE_URL")
            or os.getenv("DATABASE_URL")
            or "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/blog_platform_test"
        ).strip()
        app.config["SQLALCHEMY_DATABASE_URI"] = testing_uri
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = build_sqlalchemy_database_uri()

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    api.init_app(app)

    limiter.init_app(app)
    cache.init_app(app)

    if app.config.get("TRUST_PROXY_HEADERS"):
        from werkzeug.middleware.proxy_fix import ProxyFix

        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    if env == "production":
        from flask_talisman import Talisman

        Talisman(
            app,
            force_https=bool(app.config.get("TALISMAN_FORCE_HTTPS", False)),
            strict_transport_security=True,
            strict_transport_security_max_age=31_536_000,
            content_security_policy={
                "default-src": "'self'",
                "script-src": ["'self'", "https://cdn.jsdelivr.net"],
                "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                "img-src": ["'self'", "data:", "blob:"],
                "font-src": ["'self'", "https://cdn.jsdelivr.net"],
            },
        )

    api.spec.components.security_scheme(
        "BearerAuth",
        {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        },
    )

    importlib.import_module("app.models")

    from app.routes.errors import register_error_handlers, register_jwt_callbacks

    register_error_handlers(app)
    register_jwt_callbacks()

    from app.routes import register_blueprints

    register_blueprints(app)

    _register_shell_and_cli(app)

    return app


def _register_shell_and_cli(flask_app: Flask) -> None:
    from app.models import Category, Comment, Post, RefreshToken, Tag, User

    from app.utils.slug import slugify

    @flask_app.shell_context_processor
    def _shell_context():
        return {
            "db": db,
            "User": User,
            "Category": Category,
            "Post": Post,
            "Comment": Comment,
            "Tag": Tag,
            "RefreshToken": RefreshToken,
            "slugify": slugify,
        }

    @flask_app.cli.command("init-db")
    def _init_db():
        """Create PostgreSQL database if missing, then create all ORM tables."""
        from app.db_bootstrap import ensure_postgres_database

        database_url = flask_app.config["SQLALCHEMY_DATABASE_URI"]

        with flask_app.app_context():
            new_db = ensure_postgres_database(database_url)
            if new_db:
                print(f"PostgreSQL database {new_db!r} created.")

            db.create_all()

        print("Database tables initialized.")

    @flask_app.cli.command("seed-categories")
    def _seed_categories():
        """Upsert starter categories using slug-friendly names."""

        predefined = ["General", "Tutorials", "Announcements"]

        inserted = 0
        with flask_app.app_context():
            for name in predefined:
                slug = slugify(name)
                existing = Category.query.filter_by(slug=slug).one_or_none()
                if existing:
                    continue
                db.session.add(Category(name=name, slug=slug))
                inserted += 1

            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
                raise

        print(f"Seed complete: inserted {inserted} new categories.")

    @flask_app.cli.command("seed-demo")
    def _seed_demo():
        """Upsert demo users, taxonomy, published posts + draft, threaded comments."""

        from app.seed_demo import seed_demo_workspace

        with flask_app.app_context():
            stats = seed_demo_workspace()

        summary = ", ".join(f"{k}={v}" for k, v in stats.items())

        print(f"Demo workspace ready ({summary}).")
