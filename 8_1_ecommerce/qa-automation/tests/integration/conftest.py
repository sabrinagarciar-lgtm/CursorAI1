"""Integration test fixtures — isolated Flask app against temp SQLite."""
import json
import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[2] / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


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
    yield application
    Path(db_path).unlink(missing_ok=True)


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def api_base_url():
    import os

    return os.environ.get("API_BASE_URL", "http://127.0.0.1:5051")
