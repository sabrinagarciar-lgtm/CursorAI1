"""PostgreSQL full-text search over ``posts.search_vector``."""

from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload

from flask.views import MethodView

from flask_smorest import Blueprint

from app.models import Post

from app.schemas.common import SearchQuerySchema, manual_pagination_meta

from app.schemas.post import PaginatedSearchResponseSchema


blp = Blueprint(
    "Searches",
    __name__,
    description="PostgreSQL FTS: ``websearch_to_tsquery`` + ``ts_rank`` over ``posts.search_vector``",
)


@blp.route("/searches")
class FTS(MethodView):

    @blp.arguments(SearchQuerySchema, location="query")

    @blp.response(200, PaginatedSearchResponseSchema)

    def get(self, args):

        keyword = args["q"].strip()

        page = args["page"]

        per_page = args["per_page"]

        ts_query = func.websearch_to_tsquery("english", keyword)

        ranking = func.ts_rank(Post.search_vector, ts_query)

        fts_clause = Post.search_vector.op("@@")(ts_query)

        published_clause = Post.status == "published"

        merged = fts_clause & published_clause

        base_opts = Post.query.options(
            joinedload(Post.author),

            selectinload(Post.categories),

            selectinload(Post.tags),

        )

        filtered = base_opts.filter(merged)

        totals = filtered.count()

        ranked = filtered.add_columns(ranking.label("rank_score"))

        ranked = ranked.order_by(
            ranking.desc(),

            Post.published_at.desc().nullslast(),

        )

        rows = ranked.offset((page - 1) * per_page).limit(per_page).all()

        payloads = []

        for node, grade in rows:

            setattr(node, "search_rank", float(grade))

            payloads.append(node)

        payload = {

            "data": payloads,

            "meta": manual_pagination_meta(
                total=totals,
                page=page,
                per_page=per_page,
                keyword=keyword,
            ),

        }

        return payload
