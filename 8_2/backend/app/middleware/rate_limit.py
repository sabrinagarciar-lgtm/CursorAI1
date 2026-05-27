from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from flask import Flask, g, jsonify, request

_store: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _client_key() -> str:
    return request.remote_addr or "testclient"


def _rate_limit_key(endpoint: str) -> str:
    return f"{_client_key()}:{endpoint}"


def init_rate_limiter(app: Flask) -> None:
    @app.before_request
    def check_rate_limit():
        if not app.config.get("RATE_LIMIT_ENABLED", True):
            return None
        if request.method == "OPTIONS":
            return None

        limit = app.config.get("RATE_LIMIT_REQUESTS", 100)
        window = app.config.get("RATE_LIMIT_WINDOW_SECONDS", 60)
        key = _rate_limit_key(request.endpoint or request.path)
        now = time.time()

        with _lock:
            timestamps = _store[key]
            _store[key] = [t for t in timestamps if now - t < window]
            if len(_store[key]) >= limit:
                g.rate_limited = True
                return (
                    jsonify(
                        {
                            "message": "Rate limit exceeded. Try again later.",
                            "retry_after_seconds": window,
                        }
                    ),
                    429,
                )
            _store[key].append(now)
        return None

    @app.teardown_request
    def clear_rate_limit_flag(_exc=None):
        g.pop("rate_limited", None)


def reset_rate_limit_store() -> None:
    with _lock:
        _store.clear()
