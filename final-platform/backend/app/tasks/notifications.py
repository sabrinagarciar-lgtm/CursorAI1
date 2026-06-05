from __future__ import annotations

import json
from pathlib import Path

from app.extensions import celery_app


@celery_app.task(name="notifications.send_order_notification")
def send_order_notification(order_id: str, email: str, total: float, log_dir: str) -> dict:
    """Background task: persist order notification (email stub)."""
    log_path = Path(log_dir) / "email_notifications.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "orderId": order_id,
        "email": email,
        "total": total,
        "status": "queued_via_celery",
    }
    with log_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")
    return entry
