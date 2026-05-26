"""Centralized JSON error/constraint responses for the API surface."""

from flask import Flask, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import Conflict, HTTPException

from app import db, jwt


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(IntegrityError)
    def handle_integrity(_: IntegrityError):
        db.session.rollback()
        exc = Conflict(description="A record with the same unique value already exists.")
        return jsonify(
            {
                "code": exc.code,
                "error": "conflict",
                "message": exc.description,
            }
        ), exc.code

    @app.errorhandler(HTTPException)
    def handle_http(exc: HTTPException):
        payload = {
            "code": exc.code,
            "error": exc.name.replace(" ", "_").lower(),
            "message": exc.description or "",
        }
        return jsonify(payload), exc.code or 500


def register_jwt_callbacks() -> None:
    """Return JSON bodies for JWT extension edge cases."""

    @jwt.unauthorized_loader
    def missing_token(err: str):
        return (
            jsonify(
                {
                    "code": 401,
                    "error": "unauthorized",
                    "message": "Authentication required.",
                    "detail": err,
                }
            ),
            401,
        )

    @jwt.invalid_token_loader
    def invalid_token(err: str):
        return (
            jsonify(
                {
                    "code": 422,
                    "error": "invalid_token",
                    "message": "Token could not be decoded.",
                    "detail": err,
                }
            ),
            422,
        )

    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        return (
            jsonify(
                {
                    "code": 401,
                    "error": "token_expired",
                    "message": "Token has expired.",
                }
            ),
            401,
        )
