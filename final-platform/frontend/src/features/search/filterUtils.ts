import { derivePriority, normalizeCategory } from '../../lib/productNormalizer';
import type { Product, ProductCategory, ProductPriority } from '../../types/product';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'title-asc';

export type PriceBracket = 'under50' | '50-100' | 'over100';

const PRICE_BRACKET_MATCHERS: Record<
  PriceBracket,
  (price: number) => boolean
> = {
  under50: (p) => p < 50,
  '50-100': (p) => p >= 50 && p <= 100,
  over100: (p) => p > 100,
};

export function matchesSearch(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    product.title.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q)
  );
}

export function matchesCategories(
  product: Product,
  selected: ProductCategory[],
): boolean {
  if (selected.length === 0) return true;
  return selected.includes(normalizeCategory(product.category));
}

export function matchesPriceBrackets(
  product: Product,
  brackets: PriceBracket[],
): boolean {
  if (brackets.length === 0) return true;
  return brackets.some((b) => PRICE_BRACKET_MATCHERS[b](product.price));
}

export function matchesPriorities(
  product: Product,
  selected: ProductPriority[],
): boolean {
  if (selected.length === 0) return true;
  return selected.includes(derivePriority(product));
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'featured':
      return copy;
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'rating-desc':
      return copy.sort((a, b) => b.rating - a.rating);
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return copy;
  }
}

export function applyProductFilters(
  products: Product[],
  query: string,
  categories: ProductCategory[],
  priceBrackets: PriceBracket[],
  priorities: ProductPriority[],
  sort: SortOption,
): Product[] {
  const filtered = products.filter(
    (p) =>
      matchesSearch(p, query) &&
      matchesCategories(p, categories) &&
      matchesPriceBrackets(p, priceBrackets) &&
      matchesPriorities(p, priorities),
  );
  return sortProducts(filtered, sort);
}
