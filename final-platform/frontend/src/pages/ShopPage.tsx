import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../lib/api";

export function ShopPage() {
  const { products, setProducts, addToCart, itemCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((data) => {
        if (active) setProducts(data.items);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setProducts]);

  const handleAddToCart = (productId: string) => {
    addToCart(productId);
    const product = products.find((item) => item.id === productId);
    setToast(`${product?.title ?? "Item"} added to cart`);
    window.setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-semibold">Unable to load products</p>
        <p className="mt-1 text-sm">{error}</p>
        <p className="mt-3 text-sm">Make sure the backend is running on port 5051.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Product Showcase
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Browse our selection, add items to your cart, and proceed through a secure checkout
            with discount codes and email confirmation.
          </p>
        </div>
        {itemCount > 0 && (
          <Link
            to="/cart"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
          >
            View cart ({itemCount})
          </Link>
        )}
      </div>

      {toast && (
        <div
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
        ))}
      </div>
    </div>
  );
}
