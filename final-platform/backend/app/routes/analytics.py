from flask import Blueprint, jsonify

from app.services.analytics import get_dashboard_metrics

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/analytics/dashboard")
def dashboard_metrics():
    return jsonify(get_dashboard_metrics())
