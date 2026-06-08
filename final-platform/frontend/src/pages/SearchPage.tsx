import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
import ProductCatalog from "../features/search/ProductCatalog";
import { fetchProducts } from "../lib/api";
import { enrichProduct } from "../lib/productNormalizer";
import type { Product } from "../types/product";

export function SearchPage() {
  const { setProducts: setCartProducts } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ perPage: 50 })
      .then((result) => {
        const enriched = result.items.map(enrichProduct);
        setProducts(enriched);
        setCartProducts(enriched);
      })
      .finally(() => setLoading(false));
  }, [setCartProducts]);

  if (loading) {
    return <p className="text-slate-500 dark:text-slate-400">Loading catalog...</p>;
  }

  return (
    <div data-testid="search-page">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Product Search</h1>
      <ProductCatalog products={products} />
    </div>
  );
}
