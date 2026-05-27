/** API response shapes (aligned with Flask `success_response` / `error_response`). */

export type UserRole = "customer" | "agent" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  availability_status?: string;
  expertise_areas?: string[];
}

export interface TicketSlaPayload {
  first_response_hours: number | null;
  resolution_hours: number | null;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  first_response_met: boolean;
  resolution_met: boolean;
  first_response_approaching: boolean;
  resolution_approaching: boolean;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  customer_email: string;
  creator_user_id: number | null;
  assigned_to: Pick<User, "id" | "name" | "email" | "role"> | null;
  sla: TicketSlaPayload;
  timestamps: Record<string, string | null>;
}

export interface TicketListMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Comment {
  id: number;
  ticket_id: number;
  author: Pick<User, "id" | "name" | "email" | "role"> | null;
  content: string;
  is_internal: boolean;
  mentions: string[];
  created_at: string;
}

export interface HistoryEvent {
  kind: "assignment" | "status";
  timestamp: string;
  assigned_to_id?: number;
  assigned_by_id?: number | null;
  ticket_id?: number;
  from_status?: string | null;
  to_status?: string;
  changed_by_id?: number | null;
  note?: string | null;
}

export interface ApiSuccess<T> {
  status: "success";
  data: T;
  meta: TicketListMeta | Record<string, unknown>;
}

export interface ApiErrBody {
  status: "error";
  message: string;
  code: string;
  errors: Record<string, string[]>;
}
