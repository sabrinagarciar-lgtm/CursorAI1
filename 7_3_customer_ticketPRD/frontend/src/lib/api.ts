import type { ApiErrBody, ApiSuccess, Comment, HistoryEvent, Ticket, User } from "../types";

const API_BASE =
  typeof import.meta.env?.VITE_API_BASE === "string" ? import.meta.env.VITE_API_BASE.replace(/\/$/, "") : "";

export class ApiError extends Error {
  declare readonly cause?: ApiErrBody;

  constructor(message: string, public readonly httpStatus: number, public readonly body?: ApiErrBody) {
    super(message);
    this.name = "ApiError";
    this.cause = body;
  }
}

function mergeHeaders(headers: HeadersInit | undefined, token?: string): HeadersInit {
  const merged: Record<string, string> = {
    ...(headers instanceof Headers ? Object.fromEntries(headers.entries()) : { ...(headers as Record<string, string>) }),
  };
  if (token) {
    merged["Authorization"] = `Bearer ${token}`;
  }
  return merged;
}

export async function fetchJson<T>(path: string, init?: RequestInit & { token?: string }): Promise<ApiSuccess<T>> {
  const { token, ...rest } = init ?? {};
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: mergeHeaders(
      rest.headers as HeadersInit,
      typeof token === "string" ? token : undefined,
    ) as HeadersInit,
  });

  let body: ApiSuccess<T> | ApiErrBody | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!body || typeof body !== "object") {
    throw new ApiError("Invalid response", res.status);
  }

  if (body.status === "error") {
    throw new ApiError(body.message ?? "Request failed", res.status, body);
  }

  if (!res.ok) {
    throw new ApiError(body.status === "success" ? "Unexpected success shape" : "Request failed", res.status);
  }

  return body as ApiSuccess<T>;
}

async function parseVoid(res: Response): Promise<void> {
  if (res.status === 204 || res.headers.get("content-length") === "0") return;
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && typeof body === "object" && body.status === "error")) {
    throw new ApiError(
      typeof body?.message === "string" ? body.message : `HTTP ${res.status}`,
      res.status,
      typeof body?.status === "string" ? (body as ApiErrBody) : undefined,
    );
  }
}

/* —— Auth —— */

export function login(email: string, password: string) {
  return fetchJson<{ access_token: string; user: User }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function registerAccount(name: string, email: string, password: string) {
  return fetchJson<{ access_token: string; user: User }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export function authMe(token: string) {
  return fetchJson<User>("/api/auth/me", { token });
}

export function logout(token: string) {
  return fetch("/api/auth/logout", {
    method: "POST",
    headers: mergeHeaders(undefined, token) as HeadersInit,
  });
}

/* —— Tickets —— */

export function listTickets(token: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  const qs = search.toString();
  return fetchJson<Ticket[]>(`/api/tickets${qs ? `?${qs}` : ""}`, { token });
}

export function getTicket(token: string, id: number) {
  return fetchJson<Ticket>(`/api/tickets/${id}`, { token });
}

export function updateTicket(token: string, id: number, patch: Partial<Pick<Ticket, "subject" | "description" | "customer_email">>) {
  return fetchJson<Ticket>(`/api/tickets/${id}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function deleteTicket(token: string, id: number) {
  return fetch(`${API_BASE}/api/tickets/${id}`, {
    method: "DELETE",
    headers: mergeHeaders(undefined, token) as HeadersInit,
  }).then(parseVoid);
}

export function createTicketJson(token: string, payload: Record<string, unknown>) {
  return fetchJson<Ticket>(`/api/tickets`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createTicketMultipart(token: string, form: FormData) {
  return fetchJson<Ticket>(`/api/tickets`, {
    method: "POST",
    token,
    body: form,
    headers: {},
  });
}

export function assignTicket(
  token: string,
  id: number,
  body: { assigned_to_user_id?: number | null; auto_assign?: boolean },
) {
  return fetchJson<Ticket>(`/api/tickets/${id}/assign`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateStatus(token: string, id: number, status: string, note?: string) {
  return fetchJson<Ticket>(`/api/tickets/${id}/status`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...(note?.trim() ? { note } : {}) }),
  });
}

export function updatePriority(token: string, id: number, priority: string, reason: string) {
  return fetchJson<Ticket>(`/api/tickets/${id}/priority`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority, reason }),
  });
}

export function listComments(token: string, ticketId: number) {
  return fetchJson<Comment[]>(`/api/tickets/${ticketId}/comments`, { token });
}

export function addComment(token: string, ticketId: number, content: string, isInternal: boolean) {
  return fetchJson<{ detail: string }>(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, is_internal: isInternal }),
  });
}

export function ticketHistory(token: string, ticketId: number) {
  return fetchJson<HistoryEvent[]>(`/api/tickets/${ticketId}/history`, { token });
}

/* —— Directory —— */

export function listAgents(token: string) {
  return fetchJson<User[]>("/api/agents", { token });
}

export function listUsers(token: string) {
  return fetchJson<User[]>("/api/users", { token });
}

export function updateAvailability(
  token: string,
  agentId: number,
  availability_status: User["availability_status"],
  expertise_areas: string[],
) {
  return fetchJson<User>(`/api/agents/${agentId}/availability`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availability_status, expertise_areas }),
  });
}
