import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../lib/auth";

export function HomePage() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="text-ink-muted">Loading session…</div>;
  }
  if (user) {
    return <Navigate to="/tickets" replace />;
  }
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-3xl border border-borderline bg-gradient-to-br from-accent/15 via-transparent to-accent/10 p-10 shadow-panel">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Ticketing crafted for clarity.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-ink-muted">
          Customers lodge issues; agents uphold SLAs with transparent status wiring, collaborator comments, and
          operational audit trails—all aligned with the PRD roadmap.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Open a portal account
          </Link>
          <Link
            to="/login"
            className="inline-flex rounded-xl border border-borderline px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            Team sign-in
          </Link>
        </div>
      </section>
      <section className="rounded-3xl border border-borderline bg-surface-muted/30 p-8">
        <h2 className="font-display text-xl font-semibold text-ink">Role-aware UI</h2>
        <ul className="mt-4 space-y-3 text-sm text-ink-muted">
          <li>• Customers: create tickets, converse on-thread, track SLA ribbons.</li>
          <li>• Agents: triage queues, elevate priority with rationale notes, steer finite states.</li>
          <li>• Admins: directory surfaces, deterministic assignment, housekeeping deletes.</li>
        </ul>
      </section>
    </div>
  );
}
