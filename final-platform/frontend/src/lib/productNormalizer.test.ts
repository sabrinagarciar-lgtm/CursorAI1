import { describe, expect, it } from "vitest";

import { enrichProduct, normalizeCategory } from "./productNormalizer";
import type { Product } from "../types/product";

const base: Product = {
  id: "1",
  title: "Test",
  description: "Desc",
  price: 149.99,
  imageUrl: "https://example.com/1.jpg",
  rating: 4.5,
};

describe("productNormalizer", () => {
  it("maps API category slugs to display categories", () => {
    expect(normalizeCategory("electronics")).toBe("Electronics");
    expect(normalizeCategory("clothing")).toBe("Apparel");
    expect(normalizeCategory("home")).toBe("Home");
  });

  it("enriches API products with category and priority", () => {
    const enriched = enrichProduct({ ...base, category: "electronics" });
    expect(enriched.category).toBe("Electronics");
    expect(enriched.priority).toBe("High");
  });
});
