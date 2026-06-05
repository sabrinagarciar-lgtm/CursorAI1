from __future__ import annotations

from app.extensions import db
from app.models.platform import KanbanTask
from app.utils.security import sanitize_text


class KanbanError(Exception):
    pass


VALID_COLUMNS = {"todo", "in-progress", "done"}
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


def list_tasks() -> list[dict]:
    tasks = KanbanTask.query.order_by(KanbanTask.column_id, KanbanTask.position).all()
    return [t.to_dict() for t in tasks]


def create_task(payload: dict) -> dict:
    title = sanitize_text(str(payload.get("title", "")), max_length=200)
    if not title:
        raise KanbanError("Title is required.")
    column_id = str(payload.get("columnId") or "todo")
    if column_id not in VALID_COLUMNS:
        raise KanbanError("Invalid column.")
    priority = str(payload.get("priority") or "medium")
    if priority not in VALID_PRIORITIES:
        raise KanbanError("Invalid priority.")

    task = KanbanTask(
        title=title,
        description=sanitize_text(str(payload.get("description", "")), max_length=2000),
        column_id=column_id,
        assignee=sanitize_text(str(payload.get("assignee") or "Unassigned"), max_length=100),
        priority=priority,
        due_date=payload.get("dueDate"),
        position=KanbanTask.query.filter_by(column_id=column_id).count(),
    )
    db.session.add(task)
    db.session.commit()
    return task.to_dict()


def update_task(task_id: int, payload: dict) -> dict:
    task = db.session.get(KanbanTask, task_id)
    if task is None:
        raise KanbanError("Task not found.")
    if "title" in payload:
        task.title = sanitize_text(str(payload["title"]), max_length=200)
    if "description" in payload:
        task.description = sanitize_text(str(payload["description"]), max_length=2000)
    if "columnId" in payload:
        col = str(payload["columnId"])
        if col not in VALID_COLUMNS:
            raise KanbanError("Invalid column.")
        task.column_id = col
    if "assignee" in payload:
        task.assignee = sanitize_text(str(payload["assignee"]), max_length=100)
    if "priority" in payload:
        if str(payload["priority"]) not in VALID_PRIORITIES:
            raise KanbanError("Invalid priority.")
        task.priority = str(payload["priority"])
    if "dueDate" in payload:
        task.due_date = payload["dueDate"]
    db.session.commit()
    return task.to_dict()


def delete_task(task_id: int) -> None:
    task = db.session.get(KanbanTask, task_id)
    if task is None:
        raise KanbanError("Task not found.")
    db.session.delete(task)
    db.session.commit()
