import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import type { UserRole } from "../types";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) {
    return <div className="text-ink-muted">Loading session…</div>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireRole({ roles, children }: { roles: readonly UserRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-ink-muted">…</div>;
  if (!user || !roles.includes(user.role)) return <Navigate to="/tickets" replace />;
  return children;
}
