from __future__ import annotations

import json

from app.extensions import db
from app.models.platform import UserSettings


DEFAULT_SETTINGS = {
    "profile": {
        "displayName": "Alex Rivera",
        "email": "alex@example.com",
        "bio": "",
        "timezone": "america-los_angeles",
    },
    "notifications": {
        "emailDigest": True,
        "pushAlerts": False,
        "marketing": False,
        "digestFrequency": "weekly",
    },
    "privacy": {
        "profileVisibility": "signed-in",
        "discoverable": True,
        "shareUsage": False,
    },
    "appearance": {
        "theme": "system",
        "density": "comfortable",
        "reducedMotion": False,
    },
}


def get_user_settings(user_id: int) -> dict:
    record = UserSettings.query.filter_by(user_id=user_id).first()
    if record is None:
        return DEFAULT_SETTINGS.copy()
    try:
        return json.loads(record.settings_json)
    except json.JSONDecodeError:
        return DEFAULT_SETTINGS.copy()


def save_user_settings(user_id: int, payload: dict) -> dict:
    record = UserSettings.query.filter_by(user_id=user_id).first()
    merged = {**DEFAULT_SETTINGS, **payload}
    if record is None:
        record = UserSettings(user_id=user_id, settings_json=json.dumps(merged))
        db.session.add(record)
    else:
        record.settings_json = json.dumps(merged)
    db.session.commit()
    return merged
