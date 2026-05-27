from flask import Blueprint, jsonify

from app.db import get_db

products_bp = Blueprint("products", __name__)


@products_bp.get("/products")
def list_products():
    db = get_db()
    rows = db.execute(
        """
        SELECT id, title, description, price, image_url, rating, review_count
        FROM products
        ORDER BY title
        """
    ).fetchall()
    return jsonify(
        [
            {
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "price": row["price"],
                "imageUrl": row["image_url"],
                "rating": row["rating"],
                "reviewCount": row["review_count"],
            }
            for row in rows
        ]
    )
