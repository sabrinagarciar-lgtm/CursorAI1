"""Blueprint registration aggregator."""

from __future__ import annotations

from flask import Flask

from app.routes import agents, auth, tickets, users

API_PREFIX = "/api"


def register_blueprints(flask_app: Flask) -> None:
    flask_app.register_blueprint(auth.auth_bp, url_prefix=f"{API_PREFIX}/auth")
    flask_app.register_blueprint(tickets.tickets_bp, url_prefix=f"{API_PREFIX}/tickets")
    flask_app.register_blueprint(agents.agents_bp, url_prefix=f"{API_PREFIX}/agents")
    flask_app.register_blueprint(users.users_bp, url_prefix=f"{API_PREFIX}/users")
