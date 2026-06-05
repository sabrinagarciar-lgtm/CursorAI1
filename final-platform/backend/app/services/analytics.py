from __future__ import annotations

from app.db import get_db
from app.extensions import cache, db
from app.models.platform import SupportTicket


@cache.memoize(timeout=60)
def get_dashboard_metrics() -> dict:
    conn = get_db()
    order_stats = conn.execute(
        """
        SELECT COUNT(*) AS order_count,
               COALESCE(SUM(total), 0) AS revenue,
               COALESCE(AVG(total), 0) AS avg_order
        FROM orders WHERE status = 'confirmed'
        """
    ).fetchone()

    product_count = conn.execute("SELECT COUNT(*) AS c FROM products").fetchone()["c"]
    ticket_count = db.session.query(SupportTicket).count()
    open_tickets = db.session.query(SupportTicket).filter_by(status="open").count()

    recent_orders = conn.execute(
        """
        SELECT id, customer_name, total, created_at, status
        FROM orders ORDER BY created_at DESC LIMIT 10
        """
    ).fetchall()

    transactions = [
        {
            "id": row["id"],
            "customer": row["customer_name"],
            "amount": row["total"],
            "date": row["created_at"][:10] if row["created_at"] else "",
            "status": row["status"],
            "region": "North America",
            "segment": "Retail",
        }
        for row in recent_orders
    ]

    revenue = float(order_stats["revenue"] or 0)
    return {
        "kpis": {
            "revenue": revenue,
            "orders": int(order_stats["order_count"] or 0),
            "avgOrderValue": round(float(order_stats["avg_order"] or 0), 2),
            "products": int(product_count),
            "tickets": ticket_count,
            "openTickets": open_tickets,
        },
        "transactions": transactions,
        "regions": [
            {"name": "North America", "value": round(revenue * 0.45, 2)},
            {"name": "Europe", "value": round(revenue * 0.30, 2)},
            {"name": "Asia Pacific", "value": round(revenue * 0.25, 2)},
        ],
    }
