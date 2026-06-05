from flask import Blueprint, jsonify, request

from app.services.kanban_service import KanbanError, create_task, delete_task, list_tasks, update_task

kanban_bp = Blueprint("kanban", __name__)


@kanban_bp.get("/kanban/tasks")
def get_tasks():
    return jsonify(list_tasks())


@kanban_bp.post("/kanban/tasks")
def post_task():
    payload = request.get_json(silent=True) or {}
    try:
        task = create_task(payload)
    except KanbanError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(task), 201


@kanban_bp.put("/kanban/tasks/<int:task_id>")
def put_task(task_id: int):
    payload = request.get_json(silent=True) or {}
    try:
        task = update_task(task_id, payload)
    except KanbanError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        return jsonify({"message": str(exc)}), status
    return jsonify(task)


@kanban_bp.delete("/kanban/tasks/<int:task_id>")
def remove_task(task_id: int):
    try:
        delete_task(task_id)
    except KanbanError as exc:
        return jsonify({"message": str(exc)}), 404
    return "", 204
