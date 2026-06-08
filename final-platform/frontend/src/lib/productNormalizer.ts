import type { Product, ProductCategory, ProductPriority } from "../types/product";

const API_CATEGORY_MAP: Record<string, ProductCategory> = {
  electronics: "Electronics",
  clothing: "Apparel",
  accessories: "Accessories",
  home: "Home",
  sports: "Sports",
  general: "Accessories",
};

export function normalizeCategory(raw?: string): ProductCategory {
  if (!raw) return "Accessories";
  const key = raw.toLowerCase();
  if (API_CATEGORY_MAP[key]) return API_CATEGORY_MAP[key];
  const displayMatch = (
    ["Electronics", "Apparel", "Home", "Sports", "Accessories"] as ProductCategory[]
  ).find((c) => c.toLowerCase() === key);
  return displayMatch ?? "Accessories";
}

export function derivePriority(product: Product): ProductPriority {
  if (product.priority) return product.priority;
  if (product.price >= 100 || product.rating >= 4.7) return "High";
  if (product.price >= 50) return "Medium";
  return "Low";
}

export function enrichProduct(product: Product): Product {
  return {
    ...product,
    category: normalizeCategory(product.category),
    priority: derivePriority(product),
  };
}
