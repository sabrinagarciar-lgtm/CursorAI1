import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tests.helpers.test_data import valid_checkout_payload  # noqa: E402


@pytest.fixture()
def app():
    import tempfile

    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    email_dir = tempfile.mkdtemp()
    from app import create_app

    application = create_app(
        {
            "TESTING": True,
            "DATABASE": db_path,
            "EMAIL_LOG_DIR": email_dir,
        }
    )
    application.config["_TEST_EMAIL_DIR"] = email_dir
    yield application
    Path(db_path).unlink(missing_ok=True)


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def email_log_path(app):
    return Path(app.config["EMAIL_LOG_DIR"]) / "email_notifications.jsonl"


@pytest.fixture()
def read_email_log(email_log_path):
    def _read():
        if not email_log_path.exists():
            return []
        return [
            json.loads(line)
            for line in email_log_path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

    return _read


@pytest.fixture()
def checkout_payload():
    return valid_checkout_payload()


def post_checkout(client, payload=None, **overrides):
    from tests.helpers.test_data import build_checkout_payload

    body = build_checkout_payload(**overrides) if payload is None else payload
    if overrides and payload is not None:
        body = {**payload, **overrides}
    return client.post("/api/checkout", json=body)
