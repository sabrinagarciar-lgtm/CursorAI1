import json
from datetime import datetime, timezone
from pathlib import Path

from flask import current_app


def send_order_confirmation(
    *,
    order_id: str,
    customer_email: str,
    customer_name: str,
    total: float,
    items: list[dict],
) -> dict:
    subject = f"Order Confirmation #{order_id}"
    body_lines = [
        f"Hi {customer_name},",
        "",
        "Thank you for your purchase! Here is your order summary:",
        "",
    ]
    for item in items:
        body_lines.append(
            f"- {item['title']} x{item['quantity']} @ ${item['unit_price']:.2f}"
        )
    body_lines.extend(
        [
            "",
            f"Total charged: ${total:.2f}",
            "",
            "We will notify you when your items ship.",
            "",
            "— ShopEase Team",
        ]
    )
    body = "\n".join(body_lines)

    log_dir = Path(current_app.config["EMAIL_LOG_DIR"])
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "email_notifications.jsonl"

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "to": customer_email,
        "subject": subject,
        "body": body,
        "order_id": order_id,
    }
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record) + "\n")

    return record
