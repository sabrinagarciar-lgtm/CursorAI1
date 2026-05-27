import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { ApiError, listTickets } from "../lib/api";
import type { Ticket, TicketListMeta } from "../types";
import { PRIORITY_OPTS, slaWarnings, STATUS_OPTS, priorityTone, statusTone } from "../domain/tickets";

const emptyMeta: TicketListMeta = {
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0,
  has_next: false,
  has_prev: false,
};

export function TicketListPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<TicketListMeta>(emptyMeta);
  const [pending, setPending] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [q, setQ] = useState("");

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    p.page = String(page);
    p.per_page = "20";
    if (status) p.status = status;
    if (priority) p.priority_csv = priority;
    if (q.trim()) p.q = q.trim();
    return p;
  }, [page, priority, q, status]);

  const load = useCallback(async () => {
    if (!token) return;
    setPending(true);
    setErr(null);
    try {
      const envelope = await listTickets(token, params);
      const m = envelope.meta as TicketListMeta;
      setItems(envelope.data);
      setMeta({ ...emptyMeta, ...m });
    } catch (e) {
      if (e instanceof ApiError) setErr(e.message);
      else setErr("Network error.");
    } finally {
      setPending(false);
    }
  }, [params, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Tickets</h1>
          <p className="text-sm text-ink-muted">Scoped listing follows PRD RBAC (customer vs agent queue vs admin global).</p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          New ticket
        </Link>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-borderline bg-surface-muted/40 p-4">
        <div>
          <label className="text-xs font-semibold uppercase text-ink-muted">Keyword</label>
          <input
            className="mt-1 w-48 rounded-lg border border-borderline bg-surface px-2 py-2 text-sm text-ink"
            placeholder="Subject / description"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-ink-muted">Status</label>
          <select
            className="mt-1 rounded-lg border border-borderline bg-surface px-2 py-2 text-sm text-ink"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-ink-muted">Priority</label>
          <select
            className="mt-1 rounded-lg border border-borderline bg-surface px-2 py-2 text-sm text-ink"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any</option>
            {PRIORITY_OPTS.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded-lg border border-borderline px-3 py-2 text-sm text-ink hover:bg-surface"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {err}
        </div>
      ) : null}

      {pending ? <div className="text-sm text-ink-muted">Fetching queue…</div> : null}

      <div className="rounded-3xl border border-borderline shadow-panel overflow-hidden bg-surface">
        <table className="min-w-full divide-y divide-borderline text-sm">
          <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 hidden md:table-cell">Customer</th>
              <th className="px-4 py-3 hidden lg:table-cell">SLA</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-borderline">
            {items.map((t) => {
              const warns = slaWarnings(t);
              return (
              <tr key={t.id} className="hover:bg-surface-muted/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{t.subject}</div>
                  <div className="font-mono text-xs text-ink-muted">{t.ticket_number}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs capitalize ${statusTone(t.status)}`}>
                    {t.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs ${priorityTone(t.priority)}`}>{t.priority}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted hidden md:table-cell">{t.customer_email}</td>
                <td className="px-4 py-3 text-xs hidden lg:table-cell">
                  <div className="space-y-1 text-ink-muted">
                    {warns.length ? warns.map((msg) => <div key={msg} className="text-amber-600 dark:text-amber-400">⚠ {msg}</div>) : (
                      <span>On track</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/tickets/${t.id}`} className="text-accent hover:underline">
                    Open →
                  </Link>
                </td>
              </tr>
              );
            })}
            {!pending && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  No tickets in this filtered window.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
        <div>
          Page {meta.page} / {Math.max(meta.pages, 1)} · {meta.total} total
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!meta.has_prev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-borderline px-3 py-2 disabled:opacity-40 hover:bg-surface-muted"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!meta.has_next}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-borderline px-3 py-2 disabled:opacity-40 hover:bg-surface-muted"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
