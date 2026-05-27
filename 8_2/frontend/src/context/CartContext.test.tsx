import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { CartProvider, useCart } from "./CartContext";
import type { Product } from "../types/product";

const sampleProducts: Product[] = [
  {
    id: "1",
    title: "Wireless Bluetooth Headphones",
    description: "Test product",
    price: 149.99,
    imageUrl: "https://example.com/1.jpg",
    rating: 4.5,
    reviewCount: 100,
  },
  {
    id: "2",
    title: "Minimalist Watch",
    description: "Test product",
    price: 89.0,
    imageUrl: "https://example.com/2.jpg",
    rating: 4.8,
    reviewCount: 50,
  },
];

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

function seedProducts(result: { current: ReturnType<typeof useCart> }) {
  act(() => {
    result.current.setProducts(sampleProducts);
  });
}

describe("CartContext", () => {
  it("TC-F01 adds item to cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    act(() => {
      result.current.addToCart("1");
    });

    expect(result.current.itemCount).toBe(1);
    expect(result.current.items).toEqual([{ productId: "1", quantity: 1 }]);
  });

  it("TC-F02 increments quantity for same product", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    act(() => {
      result.current.addToCart("1");
      result.current.addToCart("1");
    });

    expect(result.current.itemCount).toBe(2);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("TC-F03 updates quantity and subtotal", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    act(() => {
      result.current.addToCart("1");
      result.current.updateQuantity("1", 3);
    });

    expect(result.current.subtotal).toBeCloseTo(449.97, 2);
    expect(result.current.cartLines[0].lineTotal).toBeCloseTo(449.97, 2);
  });

  it("TC-F04 removes item from cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    act(() => {
      result.current.addToCart("1");
      result.current.removeFromCart("1");
    });

    expect(result.current.itemCount).toBe(0);
    expect(result.current.cartLines).toHaveLength(0);
  });

  it("TC-F05 clears cart and discount", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    act(() => {
      result.current.addToCart("1");
      result.current.setDiscount({
        valid: true,
        code: "SAVE10",
        discount_amount: 10,
        message: "Applied",
      });
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.discount).toBeNull();
  });

  it("TC-F06 returns zero subtotal for empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    expect(result.current.subtotal).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  it("TC-F07 supports multiple products in cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    seedProducts(result);

    act(() => {
      result.current.addToCart("1");
      result.current.addToCart("2");
    });

    expect(result.current.itemCount).toBe(2);
    expect(result.current.subtotal).toBeCloseTo(238.99, 2);
  });
});
