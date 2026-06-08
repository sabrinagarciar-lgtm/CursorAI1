import { describe, expect, it } from "vitest";

import { applyProductFilters } from "./filterUtils";
import type { Product } from "../../types/product";

const products: Product[] = [
  {
    id: "1",
    title: "Headphones",
    description: "Audio gear",
    price: 149.99,
    imageUrl: "https://example.com/1.jpg",
    rating: 4.5,
    category: "Electronics",
    priority: "High",
  },
  {
    id: "2",
    title: "T-Shirt",
    description: "Cotton tee",
    price: 34.99,
    imageUrl: "https://example.com/2.jpg",
    rating: 4.2,
    category: "Apparel",
    priority: "Low",
  },
];

describe("applyProductFilters", () => {
  it("filters by category", () => {
    const result = applyProductFilters(products, "", ["Electronics"], [], [], "featured");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Headphones");
  });

  it("filters by priority", () => {
    const result = applyProductFilters(products, "", [], [], ["Low"], "featured");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("T-Shirt");
  });
});
