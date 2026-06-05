import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProductCard from '../../components/ProductCard';
import type { Product, ProductCategory, ProductPriority } from '../../types/product';
import {
  applyProductFilters,
  type PriceBracket,
  type SortOption,
} from './filterUtils';
import { CATALOG_PRODUCTS } from './mockProducts';

const PAGE_SIZE = 6;

const CATEGORY_OPTIONS: ProductCategory[] = [
  'Electronics',
  'Apparel',
  'Home',
  'Sports',
  'Accessories',
];

const PRICE_OPTIONS: { bracket: PriceBracket; label: string }[] = [
  { bracket: 'under50', label: 'Under $50' },
  { bracket: '50-100', label: '$50 – $100' },
  { bracket: 'over100', label: 'Over $100' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
  { value: 'title-asc', label: 'Name: A to Z' },
];

const PRIORITY_OPTIONS: ProductPriority[] = ['High', 'Medium', 'Low'];

export interface ProductCatalogProps {
  /** Defaults to the shared catalog (Exercise 1 products plus extras). */
  products?: Product[];
  pageSize?: number;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products = CATALOG_PRODUCTS,
  pageSize = PAGE_SIZE,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedPriceBrackets, setSelectedPriceBrackets] = useState<PriceBracket[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<ProductPriority[]>([]);
  const [sort, setSort] = useState<SortOption>('featured');
  const [page, setPage] = useState(1);
  const [cartItems, setCartItems] = useState<string[]>([]);

  const filteredSorted = useMemo(
    () =>
      applyProductFilters(
        products,
        query,
        selectedCategories,
        selectedPriceBrackets,
        selectedPriorities,
        sort,
      ),
    [products, query, selectedCategories, selectedPriceBrackets, selectedPriorities, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedCategories, selectedPriceBrackets, selectedPriorities, sort]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleAddToCart = useCallback((productId: string) => {
    setCartItems((prev) => [...prev, productId]);
  }, []);

  const toggleCategory = (c: ProductCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const togglePriceBracket = (b: PriceBracket) => {
    setSelectedPriceBrackets((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  const togglePriority = (p: ProductPriority) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedPriceBrackets.length > 0 ||
    selectedPriorities.length > 0;

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedPriceBrackets([]);
    setSelectedPriorities([]);
    setSort('featured');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            Product Showcase
          </h1>
          <p className="mt-2 text-slate-600">
            Search, filter, and sort — same catalog as Exercise 1, with more items for paging
          </p>
          {cartItems.length > 0 && (
            <p
              className="mt-3 text-sm font-medium text-indigo-600"
              role="status"
              aria-live="polite"
            >
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
            </p>
          )}
        </header>

        <section
          className="mb-8 rounded-xl bg-white p-4 shadow-md ring-1 ring-slate-200/80 sm:p-6"
          aria-label="Search and filters"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 min-w-0">
              <label htmlFor="product-search" className="block text-sm font-medium text-slate-700">
                Search products
              </label>
              <input
                id="product-search"
                type="search"
                data-testid="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description…"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="sort-select" className="text-sm font-medium text-slate-700 sm:sr-only">
                Sort
              </label>
              <select
                id="sort-select"
                data-testid="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                data-testid="clear-filters"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters && sort === 'featured'}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear all filters
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <fieldset className="min-w-0">
              <legend className="text-sm font-semibold text-slate-800">Category</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {CATEGORY_OPTIONS.map((c) => (
                  <label
                    key={c}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      data-testid={`filter-category-${c}`}
                      checked={selectedCategories.includes(c)}
                      onChange={() => toggleCategory(c)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0">
              <legend className="text-sm font-semibold text-slate-800">Price</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {PRICE_OPTIONS.map(({ bracket, label }) => (
                  <label
                    key={bracket}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      data-testid={`filter-price-${bracket}`}
                      checked={selectedPriceBrackets.includes(bracket)}
                      onChange={() => togglePriceBracket(bracket)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0 md:col-span-2 xl:col-span-1">
              <legend className="text-sm font-semibold text-slate-800">Priority</legend>
              <p className="mt-1 text-xs text-slate-500">
                Merchandising tier (OR when multiple selected)
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {PRIORITY_OPTIONS.map((p) => (
                  <label
                    key={p}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      data-testid={`filter-priority-${p}`}
                      checked={selectedPriorities.includes(p)}
                      onChange={() => togglePriority(p)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <p
            className="mt-4 text-sm text-slate-600"
            data-testid="result-count"
            aria-live="polite"
          >
            {filteredSorted.length} product{filteredSorted.length !== 1 ? 's' : ''} found
            {totalPages > 1 && (
              <span className="text-slate-500">
                {' '}
                · Page {safePage} of {totalPages}
              </span>
            )}
          </p>
        </section>

        <main className="overflow-visible">
          {pageSlice.length === 0 ? (
            <div
              data-testid="product-catalog-empty"
              className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center"
            >
              <p className="text-lg font-medium text-slate-800">No products match your filters</p>
              <p className="mt-2 text-sm text-slate-600">
                Try a different search or clear filters to see the full catalog.
              </p>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3"
                role="list"
              >
                {pageSlice.map((product) => (
                  <div key={product.id} className="overflow-visible pt-1" role="listitem">
                    <ProductCard product={product} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-4"
                  aria-label="Pagination"
                  data-testid="pagination-nav"
                >
                  <button
                    type="button"
                    data-testid="pagination-prev"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Previous
                  </button>
                  <span
                    className="text-sm text-slate-600"
                    data-testid="pagination-status"
                  >
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    data-testid="pagination-next"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductCatalog;
