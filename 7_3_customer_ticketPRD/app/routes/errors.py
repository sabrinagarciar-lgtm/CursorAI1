"""Centralized error handling (PRD §8)."""

from __future__ import annotations

from flask import Flask, request
from flask_jwt_extended import JWTManager
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import BadRequest, Forbidden, HTTPException, NotFound, TooManyRequests

from app.extensions import db
from app.http_helpers import error_response

jwt_manager = JWTManager()


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ValidationError)
    def handle_validation(err: ValidationError):
        msgs = err.messages
        if not isinstance(msgs, dict):
            msgs = {"detail": msgs}
        return error_response(
            message="Validation failed.",
            code="VALIDATION_ERROR",
            http_status=400,
            errors=msgs,
        )

    def _map_http(exc: HTTPException):
        mapping = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            429: "RATE_LIMIT_EXCEEDED",
        }
        code = mapping.get(exc.code or 500, "INTERNAL_ERROR")
        return error_response(message=str(exc.description or exc.name), code=code, http_status=exc.code or 500)

    @app.errorhandler(BadRequest)
    def handle_bad_request(exc: BadRequest):
        return error_response(
            message=str(exc.description or "Bad request"),
            code="VALIDATION_ERROR",
            http_status=400,
        )

    @app.errorhandler(NotFound)
    def handle_not_found(exc: NotFound):
        return error_response(message=str(exc.description or "Not found."), code="NOT_FOUND", http_status=404)

    @app.errorhandler(Forbidden)
    def handle_forbidden(exc: Forbidden):
        return error_response(message=str(exc.description or "Forbidden"), code="FORBIDDEN", http_status=403)

    @app.errorhandler(TooManyRequests)
    def handle_rl(exc: TooManyRequests):
        return error_response(
            message=str(exc.description or "Rate limit exceeded"),
            code="RATE_LIMIT_EXCEEDED",
            http_status=429,
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity(_: IntegrityError):
        db.session.rollback()
        return error_response(
            message="Database integrity conflict.",
            code="CONFLICT",
            http_status=409,
            errors={"database": ["Unique constraint violated."]},
        )

    @app.errorhandler(HTTPException)
    def handle_http(exc: HTTPException):
        return _map_http(exc)

    @app.errorhandler(Exception)
    def handle_generic(exc: Exception):
        if isinstance(exc, HTTPException):
            return _map_http(exc)
        app.logger.exception("Unhandled error processing %s", request.path)
        return error_response(
            message="Internal server error.",
            code="INTERNAL_ERROR",
            http_status=500,
        )


def register_jwt_handlers(_app: Flask) -> None:
    @jwt_manager.invalid_token_loader
    def invalid_token(err: str):
        return error_response(
            message="Authentication required.",
            code="UNAUTHORIZED",
            http_status=401,
            errors={"token": [err]},
        )

    @jwt_manager.unauthorized_loader
    def unauthorized(err: str):
        return error_response(
            message="Authentication required.",
            code="UNAUTHORIZED",
            http_status=401,
            errors={"token": [err]},
        )

    @jwt_manager.expired_token_loader
    def expired(_jwt_header, _jwt_payload):
        return error_response(message="Token has expired.", code="UNAUTHORIZED", http_status=401)
