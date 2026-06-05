export { ProductCatalog } from './ProductCatalog';
export type { ProductCatalogProps } from './ProductCatalog';
export { CATALOG_PRODUCTS } from './mockProducts';
export {
  applyProductFilters,
  matchesSearch,
  matchesCategories,
  matchesPriceBrackets,
  sortProducts,
} from './filterUtils';
export type { SortOption, PriceBracket } from './filterUtils';
