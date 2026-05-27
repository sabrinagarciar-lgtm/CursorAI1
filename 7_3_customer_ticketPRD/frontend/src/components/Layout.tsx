import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-surface-muted text-ink shadow-sm ring-1 ring-borderline"
      : "text-ink-muted hover:bg-surface-muted hover:text-ink"
  }`;

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const canStaff = Boolean(user?.role === "agent" || user?.role === "admin");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-borderline bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink">
              Support<span className="text-accent">Desk</span>
            </Link>
            {user ? (
              <nav className="hidden gap-1 sm:flex">
                <NavLink to="/tickets" className={navCls}>
                  Tickets
                </NavLink>
                <NavLink to="/tickets/new" className={navCls}>
                  New ticket
                </NavLink>
                {canStaff ? (
                  <NavLink to="/agents" className={navCls}>
                    Agents
                  </NavLink>
                ) : null}
                {user.role === "admin" ? (
                  <NavLink to="/users" className={navCls}>
                    Users
                  </NavLink>
                ) : null}
              </nav>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="rounded-lg border border-borderline bg-surface-muted px-3 py-2 text-sm text-ink transition hover:bg-surface"
              onClick={toggleTheme}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            {loading ? (
              <span className="text-sm text-ink-muted">…</span>
            ) : user ? (
              <>
                <span className="hidden max-w-[12rem] truncate text-sm text-ink-muted md:inline">
                  {user.email}
                </span>
                <button
                  type="button"
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90"
                  onClick={() => logout()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-borderline px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
        {user ? (
          <div className="flex gap-1 border-t border-borderline px-4 py-2 sm:hidden">
            <NavLink to="/tickets" className={navCls}>
              Tickets
            </NavLink>
            <NavLink to="/tickets/new" className={navCls}>
              New
            </NavLink>
            {canStaff ? (
              <NavLink to="/agents" className={navCls}>
                Agents
              </NavLink>
            ) : null}
            {user.role === "admin" ? (
              <NavLink to="/users" className={navCls}>
                Users
              </NavLink>
            ) : null}
          </div>
        ) : null}
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-borderline py-6 text-center text-xs text-ink-muted">
        Support Desk UI · API base{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5">
          {import.meta.env.VITE_API_BASE || "(dev proxy → :5050)"}
        </code>
      </footer>
    </div>
  );
}
