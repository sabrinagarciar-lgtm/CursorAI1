from flask import Blueprint, jsonify, request

from app.auth import require_roles
from app.services.products import ProductError, create_product, delete_product, get_product, list_products, update_product

products_bp = Blueprint("products", __name__)


@products_bp.get("/products")
def list_products_route():
    search = request.args.get("search")
    category = request.args.get("category")
    sort = request.args.get("sort", "title")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    min_price = request.args.get("minPrice", type=float)
    max_price = request.args.get("maxPrice", type=float)
    return jsonify(
        list_products(
            search=search,
            category=category,
            min_price=min_price,
            max_price=max_price,
            sort=sort,
            page=page,
            per_page=per_page,
        )
    )


@products_bp.get("/products/<product_id>")
def get_product_route(product_id: str):
    product = get_product(product_id)
    if product is None:
        return jsonify({"message": "Product not found."}), 404
    return jsonify(product)


@products_bp.post("/products")
@require_roles("admin")
def create_product_route():
    payload = request.get_json(silent=True) or {}
    try:
        product = create_product(payload)
    except (ProductError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(product), 201


@products_bp.put("/products/<product_id>")
@require_roles("admin")
def update_product_route(product_id: str):
    payload = request.get_json(silent=True) or {}
    try:
        product = update_product(product_id, payload)
    except (ProductError, ValueError) as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        return jsonify({"message": str(exc)}), status
    return jsonify(product)


@products_bp.delete("/products/<product_id>")
@require_roles("admin")
def delete_product_route(product_id: str):
    try:
        delete_product(product_id)
    except ProductError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        return jsonify({"message": str(exc)}), status
    return "", 204
