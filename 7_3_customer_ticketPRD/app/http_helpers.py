"""Shared JSON envelopes."""

from __future__ import annotations

from typing import Any

from flask import jsonify


def success_response(data: Any | None = None, meta: dict | None = None, status_code: int = 200):
    payload: dict[str, Any] = {"status": "success"}
    payload["data"] = data if data is not None else {}
    payload["meta"] = meta if meta is not None else {}
    return jsonify(payload), status_code


def error_response(
    *,
    message: str,
    code: str,
    http_status: int,
    errors: dict | None = None,
):
    payload = {"status": "error", "message": message, "code": code, "errors": errors or {}}
    return jsonify(payload), http_status
