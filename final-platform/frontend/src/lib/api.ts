import type {
  AuthUser,
  CheckoutPayload,
  DiscountValidation,
  Order,
  Product,
} from "../types/product";

const API_BASE = "/api";

function getStoredToken(): string | null {
  return localStorage.getItem("shopease_token");
}

async function request<T>(
  path: string,
  options?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  const token = getStoredToken();
  if (options?.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "Request failed.";
    throw new Error(message);
  }
  return data as T;
}

export function login(email: string, password: string) {
  return request<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
}

export function register(email: string, password: string, name: string) {
  return request<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
    auth: false,
  });
}

export function fetchCurrentUser() {
  return request<AuthUser>("/auth/me");
}

export interface ProductSearchParams {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductSearchResult {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function fetchProducts(params?: ProductSearchParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.page) query.set("page", String(params.page));
  if (params?.perPage) query.set("perPage", String(params.perPage));
  if (params?.minPrice != null) query.set("minPrice", String(params.minPrice));
  if (params?.maxPrice != null) query.set("maxPrice", String(params.maxPrice));
  const qs = query.toString();
  return request<ProductSearchResult>(`/products${qs ? `?${qs}` : ""}`, { auth: false });
}

export function fetchProduct(id: string) {
  return request<Product>(`/products/${id}`, { auth: false });
}

export function validateDiscount(code: string, subtotal: number) {
  return request<DiscountValidation>("/discounts/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
    auth: false,
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

export function fetchOrders() {
  return request<Order[]>("/orders");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
