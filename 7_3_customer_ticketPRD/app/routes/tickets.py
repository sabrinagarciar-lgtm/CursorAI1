"""Ticket lifecycle endpoints."""

from __future__ import annotations

import math
from datetime import datetime
from pathlib import Path
from typing import Iterable
from uuid import uuid4

from flask import Blueprint, current_app, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from sqlalchemy import asc, desc, or_, select
from werkzeug.exceptions import Forbidden, NotFound
from werkzeug.utils import secure_filename

from app.auth_context import get_current_user
from app.extensions import db
from app.http_helpers import error_response, success_response
from app.models import Attachment, Comment, Ticket, TicketAssignment, TicketStatusHistory, User
from app.models.ticket import TicketStatus
from app.models.user import UserRole
from app.services import access_control
from app.services.assignment_selector import select_auto_assign_agent
from app.services.serialization import serialize_comment, serialize_ticket
from app.services import notifications
from app.services.sla_alerts import maybe_notify_sla_pressure
from app.services.ticket_number import generate_next_ticket_number
from app.services.sla import mark_first_response_if_needed
from app.services.ticket_workflow import apply_assignment, apply_status_change
from app.schemas.api import (
    AssignSchema,
    CommentSchema,
    PrioritySchema,
    TicketCreateJsonSchema,
    TicketPatchSchema,
    StatusSchema,
)
from app.utils.sanitize import sanitize_text

tickets_bp = Blueprint("tickets", __name__, url_prefix="/tickets")


def _paginate_defaults() -> tuple[int, int]:
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    return page, per_page


def _base_ticket_query(actor: User):
    q = Ticket.query
    if actor.role == UserRole.admin.value:
        return q

    customer_email_expr = Ticket.customer_email.ilike(actor.email.strip().lower())

    if actor.role == UserRole.customer.value:
        return q.filter(
            or_(Ticket.creator_user_id == actor.id, customer_email_expr),
        )

    if actor.role == UserRole.agent.value:
        queue_clause = Ticket.assigned_to_id.is_(None) & Ticket.status.in_([TicketStatus.open.value])
        return q.filter(or_(Ticket.assigned_to_id == actor.id, queue_clause))

    return q.filter(False)  # pragma: no cover


def _apply_filters(sel, args):
    if ticket_no := args.get("ticket_number"):
        sel = sel.filter(Ticket.ticket_number == ticket_no.strip())

    email = args.get("email")
    if email:
        sel = sel.filter(Ticket.customer_email.ilike(email.strip().lower()))

    status_param = args.getlist("status") or ([] if "," not in (args.get("status_csv") or "") else args["status_csv"].split(","))
    if not status_param and args.get("status"):
        status_param = [s.strip() for s in args.get("status", "").split(",") if s.strip()]
    statuses = [s.strip() for s in status_param if s.strip()]
    if statuses:
        sel = sel.filter(Ticket.status.in_(statuses))

    priority_vals = []
    if raw := args.get("priority_csv"):
        priority_vals.extend([p.strip() for p in raw.split(",") if p.strip()])
    priority_vals.extend([p.strip() for p in args.getlist("priority") if p.strip()])
    if priority_vals:
        sel = sel.filter(Ticket.priority.in_(priority_vals))

    if cat := args.get("category"):
        sel = sel.filter(Ticket.category == cat.strip())

    if agent_id := args.get("assigned_to"):
        sel = sel.filter(Ticket.assigned_to_id == int(agent_id))

    if q_kw := args.get("q"):
        like = f"%{q_kw.strip()}%"
        sel = sel.filter(or_(Ticket.subject.ilike(like), Ticket.description.ilike(like)))

    if frm := args.get("created_after"):
        sel = sel.filter(Ticket.created_at >= datetime.fromisoformat(frm))
    if to_dt := args.get("created_before"):
        sel = sel.filter(Ticket.created_at <= datetime.fromisoformat(to_dt))

    if args.get("unassigned_only") == "true":
        sel = sel.filter(Ticket.assigned_to_id.is_(None))

    return sel


def _save_upload_streams(streams: Iterable, ticket: Ticket):
    uploads_dir = Path(current_app.config["UPLOAD_FOLDER"]) / ticket.ticket_number.replace("/", "_")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    allowed_ext = current_app.config["ALLOWED_UPLOAD_EXTENSIONS"]

    attachments: list[Attachment] = []
    for fs in streams:
        if not fs.filename:
            continue
        fname = secure_filename(fs.filename)
        suffix = Path(fname).suffix.lower()
        if suffix not in allowed_ext:
            raise ValidationError({"attachments": [f"Disallowed extension: {suffix}"]})
        data = fs.read()
        size = len(data)
        if size > current_app.config["MAX_UPLOAD_FILE_BYTES"]:
            raise ValidationError({"attachments": ["Each attachment must be 5 MB or smaller."]})

        stored = f"{uuid4().hex}{suffix}"
        abs_path = uploads_dir / stored
        abs_path.write_bytes(data)

        mime = fs.mimetype or "application/octet-stream"
        att = Attachment(
            ticket_id=ticket.id,
            comment_id=None,
            filename=fname,
            stored_name=stored,
            file_path=str(abs_path),
            file_size=size,
            file_type=mime,
        )
        attachments.append(att)
    return attachments


def _ticket_create_payload() -> dict | None:
    ct = request.content_type or ""
    if "multipart/form-data" in ct:
        parsed = dict(request.form.items())
        if "mentions" in parsed and parsed["mentions"]:
            try:
                import json as _json

                parsed["mentions"] = _json.loads(parsed["mentions"])
            except Exception:
                parsed["mentions"] = []
        return parsed
    return request.get_json(silent=True)


@tickets_bp.route("", methods=["GET"])
@jwt_required()
def list_tickets():
    actor = get_current_user(strict=True)
    page, per_page = _paginate_defaults()
    q = _base_ticket_query(actor)
    q = _apply_filters(q, request.args)
    q = q.order_by(desc(Ticket.updated_at))

    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    serialized = [serialize_ticket(t, actor=actor, app=current_app) for t in items]
    pages = max(int(math.ceil(total / per_page)), 1) if per_page else 1
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_next": page * per_page < total,
        "has_prev": page > 1,
    }
    return success_response(serialized, meta)


@tickets_bp.route("", methods=["POST"])
@jwt_required()
def create_ticket():
    actor = get_current_user(strict=True)
    if not access_control.can_create_ticket(actor):
        raise Forbidden(description="Insufficient permissions.")

    raw = _ticket_create_payload() or {}

    validated = TicketCreateJsonSchema().load(raw)

    if actor.role == UserRole.customer.value and validated["customer_email"].lower() != actor.email.lower():
        raise Forbidden(description="Customers must specify their authenticated email.")

    wants_auto_assign = validated.get("auto_assign", False)
    if wants_auto_assign and actor.role != UserRole.admin.value:
        raise Forbidden(description="Only administrators may request auto-assignment.")

    subject = sanitize_text(validated["subject"])
    description = sanitize_text(validated["description"], strip=False)

    ticket_no = generate_next_ticket_number()
    ticket = Ticket(
        ticket_number=ticket_no,
        subject=subject,
        description=description,
        status=TicketStatus.open.value,
        priority=validated["priority"],
        category=validated["category"],
        customer_email=validated["customer_email"].strip().lower(),
        creator_user_id=actor.id,
    )
    db.session.add(ticket)
    db.session.flush()

    db.session.add(
        TicketStatusHistory(
            ticket_id=ticket.id,
            from_status=None,
            to_status=TicketStatus.open.value,
            changed_by_id=actor.id,
            note="ticket_created",
        )
    )

    streams = []
    if "multipart/form-data" in (request.content_type or ""):
        streams = request.files.getlist("attachments")
        allowed_max = current_app.config["MAX_UPLOAD_FILES_TICKET_CREATE"]
        if streams and sum(1 for s in streams if s.filename) > allowed_max:
            return error_response(
                message="Validation failed.",
                code="VALIDATION_ERROR",
                http_status=400,
                errors={"attachments": [f"Maximum {allowed_max} files allowed."]},
            )

        if streams:
            try:
                for att in _save_upload_streams(streams, ticket):
                    db.session.add(att)
            except ValidationError as err:
                return error_response(
                    message="Validation failed.", code="VALIDATION_ERROR", http_status=400, errors=err.messages  # type: ignore[arg-type]
                )

    if wants_auto_assign:
        agent_pick = select_auto_assign_agent(validated["category"])
        if agent_pick:
            apply_assignment(app=current_app._get_current_object(), ticket=ticket, agent=agent_pick, acting_user=None, send_notifications=True)

    db.session.commit()

    notifications.notify_ticket_created(current_app._get_current_object(), customer_email=ticket.customer_email, ticket_number=ticket.ticket_number)
    sla = serialize_ticket(ticket, actor=actor, app=current_app)["sla"]
    maybe_notify_sla_pressure(current_app._get_current_object(), ticket, sla)

    return success_response(serialize_ticket(ticket, actor=actor, app=current_app), status_code=201)


def _ticket_or_404(ticket_id: int) -> Ticket:
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        raise NotFound(description="Ticket not found.")
    return ticket


@tickets_bp.route("/<int:ticket_id>", methods=["GET"])
@jwt_required()
def get_ticket_detail(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    if not access_control.can_view_ticket(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")
    serialized = serialize_ticket(ticket, actor=actor, app=current_app)
    maybe_notify_sla_pressure(current_app._get_current_object(), ticket, serialized["sla"])
    return success_response(serialized)


@tickets_bp.route("/<int:ticket_id>", methods=["PUT"])
@jwt_required()
def update_ticket(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    if not access_control.can_view_ticket(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")

    if actor.role == UserRole.customer.value:
        raise Forbidden(description="Customers cannot update ticket metadata.")

    if actor.role == UserRole.agent.value and ticket.assigned_to_id != actor.id:
        raise Forbidden(description="Agents may only mutate tickets assigned to them.")

    payload = TicketPatchSchema().load(request.get_json(silent=True) or {})

    changed = False
    if subject := payload.get("subject"):
        ticket.subject = sanitize_text(subject)
        changed = True
    if descr := payload.get("description"):
        ticket.description = sanitize_text(descr, strip=False)
        changed = True
    if cust := payload.get("customer_email"):
        ticket.customer_email = cust.strip().lower()
        changed = True

    if not changed:
        return error_response(
            message="Validation failed.", code="VALIDATION_ERROR", http_status=400, errors={"ticket": ["No fields provided"]}
        )

    ticket.updated_at = datetime.utcnow()
    db.session.commit()
    sla = serialize_ticket(ticket, actor=actor, app=current_app)["sla"]
    maybe_notify_sla_pressure(current_app._get_current_object(), ticket, sla)
    return success_response(serialize_ticket(ticket, actor=actor, app=current_app))


@tickets_bp.route("/<int:ticket_id>", methods=["DELETE"])
@jwt_required()
def delete_ticket(ticket_id: int):
    actor = get_current_user(strict=True)
    if not access_control.can_delete_ticket(actor):
        raise Forbidden(description="Administrators only.")
    ticket = _ticket_or_404(ticket_id)
    attachments = db.session.scalars(select(Attachment).where(Attachment.ticket_id == ticket.id)).all()
    for att in attachments:
        try:
            Path(att.file_path).unlink(missing_ok=True)
        except OSError:
            pass
        db.session.delete(att)
    db.session.delete(ticket)
    db.session.commit()
    return "", 204


@tickets_bp.route("/<int:ticket_id>/assign", methods=["POST"])
@jwt_required()
def assign_ticket(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)

    payload = AssignSchema().load(request.get_json(silent=True) or {})
    assigned_to_user_id = payload.get("assigned_to_user_id")
    auto_assign = payload.get("auto_assign", False)

    if actor.role != UserRole.admin.value:
        raise Forbidden(description="Only administrators may assign tickets.")

    chosen_agent = None

    if auto_assign:
        chosen_agent = select_auto_assign_agent(ticket.category)
        if chosen_agent is None:
            return error_response(
                message="No eligible agent.",
                code="VALIDATION_ERROR",
                http_status=400,
                errors={"auto_assign": ["No available agents match routing rules."]},
            )
    else:
        if not assigned_to_user_id:
            return error_response(
                message="Validation failed.",
                code="VALIDATION_ERROR",
                http_status=400,
                errors={"assigned_to_user_id": ["Required when auto_assign=false."]},
            )
        candidate = db.session.get(User, assigned_to_user_id)
        if not candidate:
            raise NotFound(description="Agent profile not found.")

        chosen_agent = candidate

    apply_assignment(
        app=current_app._get_current_object(),
        ticket=ticket,
        agent=chosen_agent,
        acting_user=actor,
        send_notifications=True,
    )
    ticket.updated_at = datetime.utcnow()
    db.session.commit()
    sla = serialize_ticket(ticket, actor=actor, app=current_app)["sla"]
    maybe_notify_sla_pressure(current_app._get_current_object(), ticket, sla)
    return success_response(serialize_ticket(ticket, actor=actor, app=current_app))


@tickets_bp.route("/<int:ticket_id>/status", methods=["PUT"])
@jwt_required()
def update_ticket_status(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    if not access_control.can_view_ticket(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")

    if not access_control.can_modify_status(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")

    payload = StatusSchema().load(request.get_json(silent=True) or {})
    desired = payload["status"]

    note = sanitize_text(payload.get("note") or "")

    apply_status_change(
        app=current_app._get_current_object(),
        ticket=ticket,
        actor=actor,
        new_status=desired,
        note=note if note else None,
    )

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    sla = serialize_ticket(ticket, actor=actor, app=current_app)["sla"]
    maybe_notify_sla_pressure(current_app._get_current_object(), ticket, sla)
    return success_response(serialize_ticket(ticket, actor=actor, app=current_app))


@tickets_bp.route("/<int:ticket_id>/priority", methods=["PUT"])
@jwt_required()
def update_ticket_priority(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    if not access_control.can_change_priority(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")
    payload = PrioritySchema().load(request.get_json(silent=True) or {})

    ticket.priority = payload["priority"]

    audit_comment = sanitize_text(payload["reason"], strip=False)

    db.session.add(
        Comment(
            ticket_id=ticket.id,
            user_id=actor.id,
            content=f"[PRIORITY CHANGE] {audit_comment}",
            is_internal=True,
            mentions=[],
        )
    )

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    recipients_staff: list[str] = []
    if ticket.assigned_to and ticket.assigned_to.email:
        recipients_staff.append(ticket.assigned_to.email.lower())
    for email in db.session.scalars(select(User.email).where(User.role == UserRole.admin.value)):
        recipients_staff.append(email.lower())

    notifications.notify_new_comment(
        current_app._get_current_object(),
        recipients=tuple(sorted(set(recipients_staff))),
        ticket_number=ticket.ticket_number,
        excerpt=f"[PRIORITY INTERNAL] Ticket {ticket.ticket_number} set to {payload['priority']} (detail recorded internally).",
    )

    sla = serialize_ticket(ticket, actor=actor, app=current_app)["sla"]
    maybe_notify_sla_pressure(current_app._get_current_object(), ticket, sla)
    return success_response(serialize_ticket(ticket, actor=actor, app=current_app))


@tickets_bp.route("/<int:ticket_id>/comments", methods=["GET"])
@jwt_required()
def list_comments(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    if not access_control.can_view_ticket(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")

    ordered = Comment.query.filter(Comment.ticket_id == ticket_id).order_by(asc(Comment.created_at)).all()
    serialized = []
    for c in ordered:
        if access_control.should_redact_internal_comment(actor, c.is_internal):
            continue
        serialized.append(serialize_comment(c, actor=actor, ticket=ticket))
    return success_response(serialized)


@tickets_bp.route("/<int:ticket_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    payload = CommentSchema().load(request.get_json(silent=True) or {})
    wants_internal = bool(payload.get("is_internal"))

    if not access_control.can_comment(actor, ticket, internal=wants_internal):
        raise Forbidden(description="Insufficient permissions.")

    mentions = payload.get("mentions") or []

    excerpt = sanitize_text(payload["content"], strip=False)

    db.session.add(
        Comment(
            ticket_id=ticket.id,
            user_id=actor.id,
            content=excerpt,
            is_internal=wants_internal,
            mentions=mentions if isinstance(mentions, list) else [],
        )
    )

    ticket.updated_at = datetime.utcnow()
    if actor.role in {UserRole.agent.value, UserRole.admin.value}:
        mark_first_response_if_needed(db.session, ticket)

    db.session.commit()

    recipients: set[str] = set()
    if not wants_internal and ticket.customer_email:
        recipients.add(ticket.customer_email.lower())
    if ticket.assigned_to and ticket.assigned_to.email:
        recipients.add(ticket.assigned_to.email.lower())
    if isinstance(mentions, list):
        for email in mentions:
            recipients.add(email.lower())

    notifications.notify_new_comment(
        current_app._get_current_object(),
        recipients=tuple(recipients),
        ticket_number=ticket.ticket_number,
        excerpt=f"{actor.name}: {excerpt}",
    )

    return success_response({"detail": "comment recorded"}, status_code=201)


@tickets_bp.route("/<int:ticket_id>/history", methods=["GET"])
@jwt_required()
def ticket_history(ticket_id: int):
    actor = get_current_user(strict=True)
    ticket = _ticket_or_404(ticket_id)
    if not access_control.can_view_ticket(actor, ticket):
        raise Forbidden(description="Insufficient permissions.")

    status_rows = (
        TicketStatusHistory.query.filter(TicketStatusHistory.ticket_id == ticket.id)
        .order_by(asc(TicketStatusHistory.created_at))
        .all()
    )
    assigns = (
        TicketAssignment.query.filter(TicketAssignment.ticket_id == ticket.id)
        .order_by(asc(TicketAssignment.assigned_at))
        .all()
    )

    events = []
    for row in assigns:
        events.append(
            {
                "kind": "assignment",
                "timestamp": row.assigned_at.isoformat() + "Z",
                "assigned_to_id": row.assigned_to_id,
                "assigned_by_id": row.assigned_by_id,
                "ticket_id": row.ticket_id,
            }
        )
    for row in status_rows:
        events.append(
            {
                "kind": "status",
                "timestamp": row.created_at.isoformat() + "Z",
                "from_status": row.from_status,
                "to_status": row.to_status,
                "changed_by_id": row.changed_by_id,
                "note": row.note,
            }
        )

    events.sort(key=lambda e: e["timestamp"])
    return success_response(events)
