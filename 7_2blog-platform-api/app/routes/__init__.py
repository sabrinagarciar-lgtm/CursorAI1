"""Register HTTP blueprints."""

from flask import jsonify, redirect, render_template, url_for


def register_blueprints(flask_app):
    """Attach OpenAPI blueprints (`/api/...`) and the health probe."""
    from app import api

    from app.routes.categories import blp as categories_blp
    from app.routes.posts import blp as posts_blp
    from app.routes.search import blp as searches_blp
    from app.routes.sessions import blp as sessions_blp
    from app.routes.users import blp as users_blp

    api.register_blueprint(users_blp, url_prefix="/api/users")
    api.register_blueprint(sessions_blp, url_prefix="/api/sessions")
    api.register_blueprint(posts_blp, url_prefix="/api/posts")
    api.register_blueprint(categories_blp, url_prefix="/api")
    api.register_blueprint(searches_blp, url_prefix="/api")

    @flask_app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @flask_app.get("/")
    def _index_redirect():
        return redirect(url_for("_demo"))

    @flask_app.get("/demo")
    def _demo():
        from sqlalchemy.exc import SQLAlchemyError
        from sqlalchemy.orm import selectinload

        from app.models import Post

        db_error: str | None = None
        db_error_kind: str | None = None
        try:
            posts = (
                Post.query.filter_by(status="published")
                .order_by(
                    Post.published_at.desc().nullslast(),
                    Post.created_at.desc(),
                )
                .options(
                    selectinload(Post.author),
                    selectinload(Post.categories),
                    selectinload(Post.tags),
                )
                .limit(20)
                .all()
            )
        except SQLAlchemyError as exc:
            posts = []
            db_error = str(exc.orig) if getattr(exc, "orig", None) else str(exc)
            el = db_error.lower()
            if "role" in el and "does not exist" in el:
                db_error_kind = "postgres_role_missing"

        openapi_path_raw = flask_app.config.get("OPENAPI_JSON_PATH") or "api-docs.json"
        swagger_path_raw = flask_app.config.get("OPENAPI_SWAGGER_UI_PATH") or "/swagger-ui"

        openapi_path = (
            openapi_path_raw
            if openapi_path_raw.startswith("/")
            else f"/{openapi_path_raw}"
        )
        swagger_path = (
            swagger_path_raw
            if swagger_path_raw.startswith("/")
            else f"/{swagger_path_raw}"
        )

        return render_template(
            "demo.html",
            posts=posts,
            db_error=db_error,
            db_error_kind=db_error_kind,
            cloudsql_instance=flask_app.config.get("CLOUDSQL_INSTANCE_CONNECTION_NAME"),
            demo_password_note=(
                "Demo logins use password DemoPass123! (alex@demo.example.com / "
                "casey@demo.example.com). Use these only on non-production datasets."
            ),
            api_links={
                "swagger": swagger_path,
                "openapi_json": openapi_path,
                "health": "/health",
            },
        )
