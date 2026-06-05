"""Rate limiting API tests."""

import pytest

from app.middleware.rate_limit import reset_rate_limit_store


@pytest.mark.rate_limit
class TestRateLimiting:
    def test_exceeding_rate_limit_returns_429(self, rate_limited_client):
        reset_rate_limit_store()
        responses = []
        for _ in range(7):
            responses.append(rate_limited_client.get("/api/products"))

        status_codes = [r.status_code for r in responses]
        assert 200 in status_codes
        assert 429 in status_codes

        limited = next(r for r in responses if r.status_code == 429)
        body = limited.get_json()
        assert "Rate limit exceeded" in body["message"]
        assert "retry_after_seconds" in body

    def test_rate_limit_not_applied_when_disabled(self, client):
        reset_rate_limit_store()
        for _ in range(10):
            response = client.get("/api/products")
            assert response.status_code == 200
