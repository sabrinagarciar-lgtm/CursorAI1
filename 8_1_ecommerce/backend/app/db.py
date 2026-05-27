import sqlite3
from pathlib import Path

from flask import Flask, g

DEMO_PRODUCTS = [
    (
        "1",
        "Wireless Bluetooth Headphones",
        "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
        149.99,
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
        4.5,
        2847,
    ),
    (
        "2",
        "Minimalist Watch",
        "Sleek analog watch with genuine leather strap. Water-resistant and crafted with premium materials.",
        89.0,
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
        4.8,
        562,
    ),
    (
        "3",
        "Organic Cotton T-Shirt",
        "Soft, sustainable cotton tee in classic fit. Made from 100% certified organic cotton.",
        34.99,
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
        4.2,
        1203,
    ),
    (
        "4",
        "Portable Power Bank",
        "20000mAh high-capacity power bank with fast charging and multiple USB ports.",
        49.99,
        "https://images.unsplash.com/photo-1609091839311-533aa0e4b711?w=400&h=400&fit=crop",
        4.6,
        1892,
    ),
    (
        "5",
        "Ceramic Coffee Mug",
        "Handcrafted ceramic mug with ergonomic handle. Microwave and dishwasher safe.",
        24.99,
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
        4.9,
        423,
    ),
    (
        "6",
        "Running Shoes",
        "Lightweight performance running shoes with responsive cushioning for every mile.",
        129.99,
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
        4.4,
        3156,
    ),
]

DEMO_DISCOUNTS = [
    ("SAVE10", "percent", 10.0, 25.0, None),
    ("WELCOME20", "percent", 20.0, 50.0, None),
    ("FLAT15", "fixed", 15.0, 30.0, None),
    ("VIP50", "percent", 50.0, 100.0, 1),
    ("EXPIRED", "percent", 5.0, 0.0, None),
]


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        from flask import current_app

        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_exc=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app: Flask) -> None:
    app.teardown_appcontext(close_db)

    with app.app_context():
        db_path = Path(app.config["DATABASE"])
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                price REAL NOT NULL,
                image_url TEXT NOT NULL,
                rating REAL NOT NULL,
                review_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS discount_codes (
                code TEXT PRIMARY KEY,
                discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
                value REAL NOT NULL,
                min_order REAL NOT NULL DEFAULT 0,
                max_uses INTEGER,
                uses_count INTEGER NOT NULL DEFAULT 0,
                active INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                subtotal REAL NOT NULL,
                discount_code TEXT,
                discount_amount REAL NOT NULL DEFAULT 0,
                total REAL NOT NULL,
                payment_last4 TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );
            """
        )

        product_count = conn.execute("SELECT COUNT(*) AS c FROM products").fetchone()["c"]
        if product_count == 0:
            conn.executemany(
                """
                INSERT INTO products (id, title, description, price, image_url, rating, review_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                DEMO_PRODUCTS,
            )

        discount_count = conn.execute("SELECT COUNT(*) AS c FROM discount_codes").fetchone()["c"]
        if discount_count == 0:
            conn.executemany(
                """
                INSERT INTO discount_codes (code, discount_type, value, min_order, max_uses, active)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (code, dtype, value, min_order, max_uses, 0 if code == "EXPIRED" else 1)
                    for code, dtype, value, min_order, max_uses in DEMO_DISCOUNTS
                ],
            )

        conn.commit()
        conn.close()
