"""API coverage for ticketing, RBAC, validation, SLA, and audit trails."""

from __future__ import annotations

import io
from datetime import datetime, timedelta

from sqlalchemy import select
from werkzeug.datastructures import MultiDict

from app.extensions import db
from app.models.ticket import Ticket, TicketStatus
from tests.conftest import SHARED_SECRET


def register_payload(idx: int = 1) -> dict:
    return {
        "name": "Reg User",
        "email": f"reg{idx}@example.com",
        "password": "Password123!",
    }


def json_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def test_register_login_flow(client):
    rv = client.post("/api/auth/register", json=register_payload())
    body = rv.get_json()
    assert rv.status_code == 201
    assert body["status"] == "success"
    assert body["data"]["user"]["role"] == "customer"

    login = client.post("/api/auth/login", json={"email": "reg1@example.com", "password": "Password123!"})
    assert login.status_code == 200
    assert "access_token" in login.get_json()["data"]


def test_register_duplicate_conflict(client):
    client.post("/api/auth/register", json=register_payload(50))
    dup = client.post("/api/auth/register", json=register_payload(50))
    assert dup.status_code == 409
    assert dup.get_json()["code"] == "CONFLICT"


def test_login_validation_error(client):
    bad = client.post("/api/auth/login", json={"email": "oops", "password": SHARED_SECRET})
    assert bad.status_code == 400
    assert bad.get_json()["code"] == "VALIDATION_ERROR"


def test_me_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_profile(client, token_customer):
    rv = client.get("/api/auth/me", headers=json_headers(token_customer))
    assert rv.status_code == 200
    assert rv.get_json()["data"]["email"] == "customer@example.com"


def test_ticket_create_validation(client, token_customer):
    rv = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "abc",
            "description": "short",
            "priority": "low",
            "category": "billing",
            "customer_email": "customer@example.com",
        },
    )
    assert rv.status_code == 400
    assert rv.get_json()["code"] == "VALIDATION_ERROR"


def test_subject_disallowed_chars(client, token_customer):
    rv = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "<script>XSS</script",
            "description": "Twenty character narrative at minimum required here.",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    )
    assert rv.status_code == 400


def test_customer_wrong_customer_email_blocked(client, token_customer):
    rv = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Valid title here",
            "description": "This description is deliberately long enough to satisfy PRD!",
            "priority": "low",
            "category": "billing",
            "customer_email": "evil@example.com",
        },
    )
    assert rv.status_code == 403


def test_ticket_creation_numbering_notifications(client, app, token_customer):
    rv = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Network portal outage",
            "description": "Longer narration keeps Marshmallow happy with certainty.",
            "priority": "urgent",
            "category": "technical",
            "customer_email": "customer@example.com",
        },
    )
    payload = rv.get_json()
    assert rv.status_code == 201
    ticket_number = payload["data"]["ticket_number"]
    assert ticket_number.startswith("TICK-")
    assert payload["data"]["sla"]["resolution_due_at"]

    notifies = app.config.setdefault("_NOTIFICATIONS", [])
    kinds = {n.kind for n in notifies}
    assert "ticket_created" in kinds


def test_ticket_filtering_helpers(client, app, token_admin, token_customer):
    """Exercises query-string filters on the ticket collection (FR-025/026)."""

    for idx in range(3):
        client.post(
            "/api/tickets",
            headers=json_headers(token_customer),
            json={
                "subject": f"Filter sample {idx}",
                "description": "We keep verbose descriptions to satisfy schema validation rules.",
                "priority": "low",
                "category": "billing",
                "customer_email": "customer@example.com",
            },
        )

    with app.app_context():
        ticket = db.session.scalars(select(Ticket).order_by(Ticket.id.asc())).first()
        marker = ticket.ticket_number
        ticket.status = TicketStatus.closed.value
        ticket.closed_at = datetime.utcnow()
        db.session.commit()

    filtered = client.get(
        "/api/tickets?status=closed&ticket_number=" + marker + "&priority=low&category=billing&q=Filter",
        headers=json_headers(token_admin),
    ).get_json()

    assert filtered["meta"]["total"] >= 1
    labels = [row["ticket_number"] for row in filtered["data"]]
    assert marker in labels


def test_admin_auto_assign_ticket(client, token_admin, token_agent, app):
    rv = client.post(
        "/api/tickets",
        headers=json_headers(token_admin),
        json={
            "subject": "Auto routing sample",
            "description": "We keep verbosity high for validation safety checks today.",
            "priority": "medium",
            "category": "technical",
            "customer_email": "customer@example.com",
            "auto_assign": True,
        },
    )
    data = rv.get_json()["data"]
    assert rv.status_code == 201
    assert data["assigned_to"]["email"] == "agent@example.com"
    assert data["status"] == TicketStatus.assigned.value

    kinds = {n.kind for n in app.config.setdefault("_NOTIFICATIONS", [])}
    assert "ticket_assigned" in kinds


def test_customer_cannot_request_auto_assign(client, token_customer):
    rv = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Forbidden auto routing",
            "description": "This description still passes length expectations handily!",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
            "auto_assign": True,
        },
    )
    assert rv.status_code == 403


def test_manual_assignment_and_history(client, app, token_admin, token_customer):
    create = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Assignment queue regression",
            "description": "Verbose note keeps ticket schema validation entirely satisfied!",
            "priority": "low",
            "category": "billing",
            "customer_email": "customer@example.com",
        },
    ).get_json()

    tid = create["data"]["id"]
    app.config["_NOTIFICATIONS"] = []

    assign = client.post(
        f"/api/tickets/{tid}/assign",
        headers=json_headers(token_admin),
        json={"assigned_to_user_id": 2},  # Alex Agent seed order
    )
    assert assign.status_code == 200
    assert any(ev.kind == "ticket_assigned" for ev in app.config["_NOTIFICATIONS"])

    history = client.get(f"/api/tickets/{tid}/history", headers=json_headers(token_admin)).get_json()["data"]
    kinds = {row["kind"] for row in history}
    assert {"assignment", "status"}.issubset(kinds)


def test_illegal_transition(client, token_admin, token_customer, token_agent):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "State machine guard",
            "description": "We document enough chars to surpass minimum requirements here.",
            "priority": "high",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    tid = created["id"]
    client.post(
        f"/api/tickets/{tid}/assign",
        headers=json_headers(token_admin),
        json={"assigned_to_user_id": 2},
    )
    rv = client.put(
        f"/api/tickets/{tid}/status",
        headers=json_headers(token_agent),
        json={"status": TicketStatus.waiting.value},
    )
    assert rv.status_code == 400


def test_happy_status_flow_and_notifications(client, app, token_admin, token_customer, token_agent):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Progressive SLA story",
            "description": "We keep narration verbose enough for repeatable automated testing.",
            "priority": "high",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    tid = created["id"]
    client.post(
        f"/api/tickets/{tid}/assign",
        headers=json_headers(token_admin),
        json={"assigned_to_user_id": 2},
    )

    transitions = ["in_progress", "waiting", "in_progress", "resolved"]
    app.config["_NOTIFICATIONS"] = []

    for st in transitions:
        resp = client.put(
            f"/api/tickets/{tid}/status",
            headers=json_headers(token_agent),
            json={"status": st},
        )
        assert resp.status_code == 200

    history = client.get(f"/api/tickets/{tid}/history", headers=json_headers(token_agent)).get_json()["data"]

    notifies = app.config["_NOTIFICATIONS"]
    assert any(n.kind == "status_changed" for n in notifies)
    status_events = [row for row in history if row["kind"] == "status"]
    assert len(status_events) >= 6


def test_reopen_blocked_after_week(app, client, token_admin, token_customer, token_agent):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Reopen guard rails",
            "description": "We meet minimum length mandates with lots of explanatory verbiage.",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    tid = created["id"]
    client.post(
        f"/api/tickets/{tid}/assign",
        headers=json_headers(token_admin),
        json={"assigned_to_user_id": 2},
    )

    lifecycle = ["in_progress", "resolved", "closed"]
    for st in lifecycle:
        assert (
            client.put(f"/api/tickets/{tid}/status", headers=json_headers(token_agent), json={"status": st}).status_code
            == 200
        )

    with app.app_context():
        ticket = db.session.get(Ticket, tid)
        ticket.closed_at = datetime.utcnow() - timedelta(days=10)
        db.session.commit()

    late_reopen = client.put(
        f"/api/tickets/{tid}/status",
        headers=json_headers(token_agent),
        json={"status": TicketStatus.reopened.value},
    )
    assert late_reopen.status_code == 400


def test_comments_internal_hidden_from_customer(client, token_customer, token_agent, token_admin):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Collaboration secrecy",
            "description": "We document enough chatter to beat minimum length validations now.",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    tid = created["id"]
    client.post(
        f"/api/tickets/{tid}/assign",
        headers=json_headers(token_admin),
        json={"assigned_to_user_id": 2},
    )

    agent_internal = client.post(
        f"/api/tickets/{tid}/comments",
        headers=json_headers(token_agent),
        json={"content": "Secret agent investigation notes abound here!", "is_internal": True},
    )
    assert agent_internal.status_code == 201

    customer_reply = client.post(
        f"/api/tickets/{tid}/comments",
        headers=json_headers(token_agent),
        json={"content": "Public customer-friendly update arrives now!", "is_internal": False},
    )
    assert customer_reply.status_code == 201

    customer_visible = client.get(f"/api/tickets/{tid}/comments", headers=json_headers(token_customer)).get_json()[
        "data"
    ]
    assert len(customer_visible) == 1


def test_customer_cannot_post_internal_comments(client, token_customer):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Internal attempt",
            "description": "We keep chatter verbose enough to satisfy validations today.",
            "priority": "low",
            "category": "billing",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    rv = client.post(
        f"/api/tickets/{created['id']}/comments",
        headers=json_headers(token_customer),
        json={"content": "Trying to escalate quietly", "is_internal": True},
    )
    assert rv.status_code == 403


def test_priority_requires_reason(client, token_admin, token_customer, token_agent):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Severity bump regression",
            "description": "We provide plenty of explanatory characters for ticket creation!",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    tid = created["id"]
    client.post(
        f"/api/tickets/{tid}/assign",
        headers=json_headers(token_admin),
        json={"assigned_to_user_id": 2},
    )
    rejection = client.put(
        f"/api/tickets/{tid}/priority",
        headers=json_headers(token_agent),
        json={"priority": "urgent", "reason": "no"},
    )
    assert rejection.status_code == 400

    success = client.put(
        f"/api/tickets/{tid}/priority",
        headers=json_headers(token_agent),
        json={"priority": "urgent", "reason": "Customer blocked on payment gateway outage."},
    )
    payload = success.get_json()["data"]
    assert success.status_code == 200
    assert payload["priority"] == "urgent"


def test_customer_cannot_update_metadata(client, token_customer):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Metadata guard",
            "description": "We document enough chatter to surpass minimum validations handily!",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    forbidden = client.put(
        f"/api/tickets/{created['id']}",
        headers=json_headers(token_customer),
        json={"description": "Another twenty-character note for PATCH attempts!" },
    )
    assert forbidden.status_code == 403


def test_agent_cannot_modify_unassigned_ticket(client, token_agent, token_customer):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Unassigned backlog",
            "description": "We keep chatter verbose enough to satisfy validation minimums!",
            "priority": "low",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    resp = client.put(
        f"/api/tickets/{created['id']}",
        headers=json_headers(token_agent),
        json={
            "description": "Agent attempts direct edit despite lacking assignment linkage here!",
        },
    )
    assert resp.status_code == 403


def test_agents_can_list_queue(client, token_agent, token_customer):
    client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Queue visibility",
            "description": "We provide enough explanatory characters once again!",
            "priority": "high",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    )
    listing = client.get("/api/tickets", headers=json_headers(token_agent)).get_json()
    assert listing["meta"]["total"] >= 1


def test_pagination_contract(client, token_admin, token_customer):
    for idx in range(3):
        client.post(
            "/api/tickets",
            headers=json_headers(token_customer),
            json={
                "subject": f"Pagination sample {idx}",
                "description": "Each ticket needs more than twenty characters for creation rules!",
                "priority": "low",
                "category": "billing",
                "customer_email": "customer@example.com",
            },
        )

    page = client.get("/api/tickets?page=1&per_page=2", headers=json_headers(token_admin)).get_json()
    assert page["meta"]["total"] >= 3
    assert len(page["data"]) <= 2


def test_admin_delete_ticket(client, token_admin, token_customer):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Deletion target",
            "description": "We keep explanatory prose verbose enough to validate creation!",
            "priority": "low",
            "category": "billing",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    delete = client.delete(f"/api/tickets/{created['id']}", headers=json_headers(token_admin))
    assert delete.status_code == 204


def test_agent_forbidden_delete(client, token_customer, token_agent):
    created = client.post(
        "/api/tickets",
        headers=json_headers(token_customer),
        json={
            "subject": "Retention policy",
            "description": "We meet minimum narration requirements with extra words!",
            "priority": "medium",
            "category": "general",
            "customer_email": "customer@example.com",
        },
    ).get_json()["data"]
    resp = client.delete(f"/api/tickets/{created['id']}", headers=json_headers(token_agent))
    assert resp.status_code == 403


def test_admin_only_user_directory(client, token_admin, token_agent):
    assert client.get("/api/users", headers=json_headers(token_admin)).status_code == 200
    assert client.get("/api/users", headers=json_headers(token_agent)).status_code == 403


def test_attachment_quota(client, token_customer):
    multipart = MultiDict()
    multipart.add("subject", "Attachment quotas")
    multipart.add(
        "description",
        "We deliberately exceed minimum description length thresholds for validations.",
    )
    multipart.add("priority", "medium")
    multipart.add("category", "technical")
    multipart.add("customer_email", "customer@example.com")
    for suffix in ("a", "b", "c", "d"):
        multipart.add(
            "attachments",
            (io.BytesIO(b"%PDF-1.7 fake"), f"{suffix}.pdf", "application/pdf"),
        )

    denied = client.post("/api/tickets", data=multipart, headers={"Authorization": f"Bearer {token_customer}"})
    payload = denied.get_json()
    assert denied.status_code == 400
    assert "attachments" in payload["errors"]


def test_agent_directory_visibility(client, token_agent):
    assert client.get("/api/agents", headers=json_headers(token_agent)).status_code == 200


def test_openapi_assets_hosted(client):
    spec = client.get("/docs/openapi.yaml")
    assert spec.status_code == 200
    swagger = client.get("/docs/")
    assert swagger.status_code == 200
