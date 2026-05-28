"""Integration tests: product catalog API."""
import pytest


@pytest.mark.integration
class TestProductsAPI:
    def test_get_products_returns_seeded_catalog(self, client):
        response = client.get("/api/products")
        assert response.status_code == 200
        products = response.get_json()
        assert isinstance(products, list)
        assert len(products) >= 6
        required = {"id", "title", "price", "imageUrl"}
        assert required.issubset(products[0].keys())

    def test_products_have_positive_prices(self, client):
        products = client.get("/api/products").get_json()
        assert all(p["price"] > 0 for p in products)
