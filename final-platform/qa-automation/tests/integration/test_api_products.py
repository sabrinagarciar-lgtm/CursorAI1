"""Integration tests: product catalog API."""
import pytest


@pytest.mark.integration
class TestProductsAPI:
    def test_get_products_returns_seeded_catalog(self, client):
        response = client.get("/api/products")
        assert response.status_code == 200
        body = response.get_json()
        assert "items" in body
        products = body["items"]
        assert len(products) >= 6
        required = {"id", "title", "price", "imageUrl"}
        assert required.issubset(products[0].keys())

    def test_products_have_positive_prices(self, client):
        products = client.get("/api/products").get_json()["items"]
        assert all(p["price"] > 0 for p in products)
