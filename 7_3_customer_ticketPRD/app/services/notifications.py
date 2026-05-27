"""In-process email/event notification sink (FR-035) — replaces SMTP while keeping hooks."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class NotificationEvent:
    kind: str
    to_addresses: tuple[str, ...]
    subject: str
    body: str


def enqueue(app, event: NotificationEvent) -> None:
    store: list = app.config.setdefault("_NOTIFICATIONS", [])  # type: ignore[arg-type]
    store.append(event)
    if app.config.get("LOG_NOTIFICATIONS"):  # pragma: no cover — debug toggle
        app.logger.info("NOTIFY[%s] %s -> %s", event.kind, event.to_addresses, event.subject)


def notify_ticket_created(app, *, customer_email: str, ticket_number: str):
    enqueue(
        app,
        NotificationEvent(
            kind="ticket_created",
            to_addresses=(customer_email.lower(),),
            subject=f"[{ticket_number}] Support ticket opened",
            body=f"Thank you — your ticket {ticket_number} was created successfully.",
        ),
    )


def notify_ticket_assigned(app, *, agent_email: str, ticket_number: str, subject: str):
    enqueue(
        app,
        NotificationEvent(
            kind="ticket_assigned",
            to_addresses=(agent_email.lower(),),
            subject=f"[{ticket_number}] New ticket assignment",
            body=f"You were assigned ticket {ticket_number}: {subject}",
        ),
    )


def notify_status_change(
    app,
    *,
    customer_email: str | None,
    agent_email: str | None,
    ticket_number: str,
    from_status: str,
    to_status: str,
):
    recipients = [e for e in (customer_email, agent_email) if e]
    if not recipients:
        return
    enqueue(
        app,
        NotificationEvent(
            kind="status_changed",
            to_addresses=tuple({e.lower() for e in recipients}),
            subject=f"[{ticket_number}] Status updated to {to_status}",
            body=f"Ticket {ticket_number} moved from '{from_status}' to '{to_status}'.",
        ),
    )


def notify_new_comment(
    app,
    *,
    recipients: tuple[str, ...],
    ticket_number: str,
    excerpt: str,
):
    uniq = tuple({r.lower() for r in recipients if r})
    if not uniq:
        return
    enqueue(
        app,
        NotificationEvent(
            kind="new_comment",
            to_addresses=uniq,
            subject=f"[{ticket_number}] New ticket comment",
            body=f"Ticket {ticket_number} has a new comment: {excerpt[:280]}",
        ),
    )


def notify_sla_nearing(app, *, agent_email: str, admin_emails: tuple[str, ...], ticket_number: str, headline: str):
    recipients = (agent_email.lower(), *[a.lower() for a in admin_emails])
    enqueue(
        app,
        NotificationEvent(
            kind="sla_deadline",
            to_addresses=tuple(sorted(set(recipients))),
            subject=f"[{ticket_number}] SLA approaching / missed — {headline}",
            body=f"Operational alert for ticket {ticket_number}: {headline}",
        ),
    )
