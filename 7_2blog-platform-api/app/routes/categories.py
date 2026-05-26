from flask.views import MethodView
from flask_smorest import Blueprint

from app.models import Category
from app.schemas.category import PaginatedCategoriesResponseSchema
from app.schemas.common import CategoriesListQuerySchema, pagination_meta

blp = Blueprint(
    "Categories",
    __name__,
    description="Browse blog categories maintained by admins or seed utilities",
)


@blp.route("/categories")
class CategoriesCollection(MethodView):
    """Discover available categories (paginated)."""

    @blp.arguments(CategoriesListQuerySchema, location="query")
    @blp.response(200, PaginatedCategoriesResponseSchema)
    def get(self, q):
        qb = Category.query.order_by(Category.name.asc())
        pager = qb.paginate(page=q["page"], per_page=q["per_page"], error_out=False)

        return {"data": pager.items or [], "meta": pagination_meta(pager)}
