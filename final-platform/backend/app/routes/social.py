from flask import Blueprint, jsonify, request

from app.services.social_service import SocialError, add_comment, create_post, like_post, list_posts

social_bp = Blueprint("social", __name__)


@social_bp.get("/social/posts")
def get_posts():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 10, type=int)
    return jsonify(list_posts(page=page, per_page=per_page))


@social_bp.post("/social/posts")
def post_create():
    payload = request.get_json(silent=True) or {}
    try:
        post = create_post(payload)
    except SocialError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(post), 201


@social_bp.post("/social/posts/<int:post_id>/like")
def post_like(post_id: int):
    try:
        post = like_post(post_id)
    except SocialError as exc:
        return jsonify({"message": str(exc)}), 404
    return jsonify(post)


@social_bp.post("/social/posts/<int:post_id>/comments")
def post_comment(post_id: int):
    payload = request.get_json(silent=True) or {}
    try:
        comment = add_comment(post_id, payload)
    except SocialError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        return jsonify({"message": str(exc)}), status
    return jsonify(comment), 201
