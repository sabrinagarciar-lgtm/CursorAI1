from flask import Blueprint, jsonify, request

from app.auth import require_auth, require_roles
from app.services.ticket_service import TicketError, create_ticket, get_ticket, list_tickets, update_ticket

tickets_bp = Blueprint("tickets", __name__)


@tickets_bp.get("/tickets")
@require_auth
def get_tickets():
    status = request.args.get("status")
    return jsonify(list_tickets(status=status))


@tickets_bp.get("/tickets/<int:ticket_id>")
@require_auth
def get_ticket_route(ticket_id: int):
    ticket = get_ticket(ticket_id)
    if ticket is None:
        return jsonify({"message": "Ticket not found."}), 404
    return jsonify(ticket)


@tickets_bp.post("/tickets")
def post_ticket():
    payload = request.get_json(silent=True) or {}
    try:
        ticket = create_ticket(payload)
    except TicketError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(ticket), 201


@tickets_bp.patch("/tickets/<int:ticket_id>")
@require_roles("admin")
def patch_ticket(ticket_id: int):
    payload = request.get_json(silent=True) or {}
    try:
        ticket = update_ticket(ticket_id, payload)
    except TicketError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        return jsonify({"message": str(exc)}), status
    return jsonify(ticket)
