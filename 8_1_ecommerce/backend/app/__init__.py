import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS

from app.db import init_db
from app.routes.checkout import checkout_bp
from app.routes.discounts import discounts_bp
from app.routes.health import health_bp
from app.routes.orders import orders_bp
from app.routes.products import products_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-ecommerce-secret"),
        DATABASE=str(Path(__file__).resolve().parent.parent / "ecommerce.db"),
        EMAIL_LOG_DIR=str(Path(__file__).resolve().parent.parent / "logs"),
    )
    if test_config:
        app.config.update(test_config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    init_db(app)
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(discounts_bp, url_prefix="/api")
    app.register_blueprint(checkout_bp, url_prefix="/api")
    app.register_blueprint(orders_bp, url_prefix="/api")

    return app
