import { useEffect, useState } from "react";

import ProductCatalog from "../features/search/ProductCatalog";
import { fetchProducts } from "../lib/api";
import type { Product } from "../types/product";

export function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ perPage: 50 })
      .then((result) => setProducts(result.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-500">Loading catalog...</p>;
  }

  return (
    <div data-testid="search-page">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Product Search</h1>
      <ProductCatalog products={products} />
    </div>
  );
}
