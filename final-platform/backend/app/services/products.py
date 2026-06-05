from __future__ import annotations

import uuid

from app.db import get_db
from app.utils.security import sanitize_text


class ProductError(Exception):
    pass


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "price": row["price"],
        "imageUrl": row["image_url"],
        "rating": row["rating"],
        "reviewCount": row["review_count"],
        "category": row["category"] if "category" in row.keys() else "general",
    }


def list_products(
    search: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort: str = "title",
    page: int = 1,
    per_page: int = 20,
) -> dict:
    db = get_db()
    clauses: list[str] = []
    params: list = []

    if search:
        clauses.append("(title LIKE ? OR description LIKE ?)")
        term = f"%{search}%"
        params.extend([term, term])
    if category and category != "all":
        clauses.append("category = ?")
        params.append(category)
    if min_price is not None:
        clauses.append("price >= ?")
        params.append(min_price)
    if max_price is not None:
        clauses.append("price <= ?")
        params.append(max_price)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sort_map = {
        "title": "title ASC",
        "price-asc": "price ASC",
        "price-desc": "price DESC",
        "rating": "rating DESC",
    }
    order_by = sort_map.get(sort, "title ASC")
    offset = max(page - 1, 0) * per_page

    total = db.execute(
        f"SELECT COUNT(*) AS c FROM products {where}", params
    ).fetchone()["c"]
    rows = db.execute(
        f"""
        SELECT id, title, description, price, image_url, rating, review_count, category
        FROM products {where}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
        """,
        [*params, per_page, offset],
    ).fetchall()

    items = [_row_to_dict(row) for row in rows]
    return {
        "items": items,
        "total": total,
        "page": page,
        "perPage": per_page,
        "totalPages": max(1, (total + per_page - 1) // per_page),
    }


def get_product(product_id: str) -> dict | None:
    db = get_db()
    row = db.execute(
        """
        SELECT id, title, description, price, image_url, rating, review_count, category
        FROM products WHERE id = ?
        """,
        (product_id,),
    ).fetchone()
    return _row_to_dict(row) if row else None


def create_product(payload: dict) -> dict:
    raw_title = payload.get("title")
    if raw_title is None or not str(raw_title).strip():
        raise ProductError("Title is required.")
    title = sanitize_text(str(raw_title), max_length=200)
    description = sanitize_text(str(payload.get("description", "")), max_length=2000)
    try:
        price = float(payload.get("price", 0))
    except (TypeError, ValueError) as exc:
        raise ProductError("Price must be a number.") from exc
    if price <= 0:
        raise ProductError("Price must be greater than zero.")

    image_url = str(payload.get("imageUrl") or payload.get("image_url") or "").strip()
    if not image_url:
        raise ProductError("Image URL is required.")

    rating = float(payload.get("rating", 0))
    review_count = int(payload.get("reviewCount") or payload.get("review_count") or 0)
    product_id = str(payload.get("id") or uuid.uuid4().hex[:8])

    db = get_db()
    existing = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if existing:
        raise ProductError(f"Product '{product_id}' already exists.")

    db.execute(
        """
        INSERT INTO products (id, title, description, price, image_url, rating, review_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (product_id, title, description, price, image_url, rating, review_count),
    )
    db.commit()
    return get_product(product_id)  # type: ignore[return-value]


def update_product(product_id: str, payload: dict) -> dict:
    product = get_product(product_id)
    if product is None:
        raise ProductError("Product not found.")

    updates: list[str] = []
    values: list = []

    if "title" in payload:
        updates.append("title = ?")
        values.append(sanitize_text(str(payload["title"]), max_length=200))
    if "description" in payload:
        updates.append("description = ?")
        values.append(sanitize_text(str(payload["description"]), max_length=2000))
    if "price" in payload:
        price = float(payload["price"])
        if price <= 0:
            raise ProductError("Price must be greater than zero.")
        updates.append("price = ?")
        values.append(price)
    if "imageUrl" in payload or "image_url" in payload:
        url = str(payload.get("imageUrl") or payload.get("image_url"))
        updates.append("image_url = ?")
        values.append(url)
    if "rating" in payload:
        updates.append("rating = ?")
        values.append(float(payload["rating"]))
    if "reviewCount" in payload or "review_count" in payload:
        updates.append("review_count = ?")
        values.append(int(payload.get("reviewCount") or payload.get("review_count")))

    if not updates:
        return product

    values.append(product_id)
    db = get_db()
    db.execute(f"UPDATE products SET {', '.join(updates)} WHERE id = ?", values)
    db.commit()
    return get_product(product_id)  # type: ignore[return-value]


def delete_product(product_id: str) -> None:
    db = get_db()
    row = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if row is None:
        raise ProductError("Product not found.")
    in_orders = db.execute(
        "SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1", (product_id,)
    ).fetchone()
    if in_orders:
        raise ProductError("Cannot delete product referenced by orders.")
    db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
