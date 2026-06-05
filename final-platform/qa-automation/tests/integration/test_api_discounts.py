"""Integration tests: discount validation API."""
import pytest

from tests.helpers.test_data import DISCOUNT_CODES, discount_validate_payload


@pytest.mark.integration
class TestDiscountsAPI:
    def test_valid_discount_save10(self, client):
        payload = discount_validate_payload(DISCOUNT_CODES["save10"], subtotal=100.0)
        response = client.post("/api/discounts/validate", json=payload)
        assert response.status_code == 200
        body = response.get_json()
        assert body["valid"] is True
        assert body["discount_amount"] > 0

    def test_invalid_discount_rejected(self, client):
        payload = discount_validate_payload(DISCOUNT_CODES["invalid"], subtotal=50.0)
        response = client.post("/api/discounts/validate", json=payload)
        assert response.status_code == 400
