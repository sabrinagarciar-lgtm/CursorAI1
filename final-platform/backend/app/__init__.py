import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

from app.db import init_db, seed_platform_data
from app.extensions import cache, celery_app, db
from app.middleware.rate_limit import init_rate_limiter
from app.routes.analytics import analytics_bp
from app.routes.auth import auth_bp
from app.routes.checkout import checkout_bp
from app.routes.discounts import discounts_bp
from app.routes.kanban import kanban_bp
from app.routes.orders import orders_bp
from app.routes.products import products_bp
from app.routes.settings import settings_bp
from app.routes.social import social_bp
from app.routes.tickets import tickets_bp
from app.routes.users import users_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-platform-secret"),
        DATABASE=str(Path(__file__).resolve().parent.parent / "platform.db"),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL",
            f"sqlite:///{Path(__file__).resolve().parent.parent / 'platform.db'}",
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        EMAIL_LOG_DIR=str(Path(__file__).resolve().parent.parent / "logs"),
        JWT_SECRET=os.environ.get(
            "JWT_SECRET", "dev-jwt-secret-change-in-production-32b"
        ),
        JWT_EXPIRY_SECONDS=int(os.environ.get("JWT_EXPIRY_SECONDS", "3600")),
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_REQUESTS=100,
        RATE_LIMIT_WINDOW_SECONDS=60,
        CACHE_TYPE=os.environ.get("CACHE_TYPE", "SimpleCache"),
        CACHE_REDIS_URL=os.environ.get("REDIS_URL", "redis://localhost:6379/2"),
        CACHE_DEFAULT_TIMEOUT=120,
    )
    if test_config:
        app.config.update(test_config)
        if test_config.get("TESTING"):
            app.config["CACHE_TYPE"] = "NullCache"

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    cache.init_app(app)
    celery_app.conf.update(
        task_always_eager=app.config.get("TESTING", False),
        task_eager_propagates=True,
    )

    init_db(app)
    init_rate_limiter(app)

    with app.app_context():
        db.create_all()
        seed_platform_data()

    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")
    app.register_blueprint(orders_bp, url_prefix="/api")
    app.register_blueprint(discounts_bp, url_prefix="/api")
    app.register_blueprint(checkout_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(kanban_bp, url_prefix="/api")
    app.register_blueprint(social_bp, url_prefix="/api")
    app.register_blueprint(tickets_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")

    @app.get("/healthz")
    def health():
        return jsonify({"status": "ok", "service": "cursorhub-platform"})

    @app.errorhandler(404)
    def not_found(_exc):
        return jsonify({"message": "Resource not found."}), 404

    @app.errorhandler(500)
    def internal_error(_exc):
        return jsonify({"message": "Internal server error."}), 500

    if app.config.get("TESTING"):
        @app.get("/api/test/trigger-error")
        def trigger_error():
            if not app.config.get("ALLOW_TEST_ERROR_ROUTE"):
                return jsonify({"message": "Not found."}), 404
            return jsonify({"message": "Internal server error."}), 500

    return app
