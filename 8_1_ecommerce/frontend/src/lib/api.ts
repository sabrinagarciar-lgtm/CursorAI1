import type {
  CheckoutPayload,
  DiscountValidation,
  Order,
  Product,
} from "../types/product";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "Request failed.";
    throw new Error(message);
  }
  return data as T;
}

export function fetchProducts() {
  return request<Product[]>("/products");
}

export function validateDiscount(code: string, subtotal: number) {
  return request<DiscountValidation>("/discounts/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

export function submitCheckout(payload: CheckoutPayload) {
  return request<{ success: boolean; order: Order }>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchOrder(orderId: string) {
  return request<Order>(`/orders/${orderId}`);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
