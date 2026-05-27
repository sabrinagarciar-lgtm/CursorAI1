import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  PRIORITY_OPTS,
  STATUS_OPTS,
  priorityTone,
  slaWarnings,
  statusTone,
} from "../domain/tickets";
import {
  ApiError,
  addComment,
  assignTicket,
  deleteTicket,
  getTicket,
  listAgents,
  listComments,
  ticketHistory,
  updatePriority,
  updateStatus,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Comment as CommentRow, HistoryEvent, Ticket, User } from "../types";

export function TicketDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [statusPick, setStatusPick] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [priorityPick, setPriorityPick] = useState("");
  const [prioReason, setPrioReason] = useState("");
  const [assignee, setAssignee] = useState("");
  const [autoAssign, setAutoAssign] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [internalNote, setInternalNote] = useState(false);

  const admin = user?.role === "admin";
  const staff = user?.role === "agent" || admin;

  const loadAll = useCallback(async () => {
    if (!token || Number.isNaN(id)) return;
    setMsg(null);
    try {
      const [tick, cms, hist] = await Promise.all([
        getTicket(token, id),
        listComments(token, id),
        ticketHistory(token, id),
      ]);
      const tdata = tick.data;
      setTicket(tdata);
      setComments(cms.data);
      setHistory(hist.data);
      setStatusPick(tdata.status);
      setPriorityPick(tdata.priority);
      if (admin) {
        const ag = await listAgents(token);
        setAgents(ag.data);
      }
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Load failed.");
    }
  }, [admin, id, token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const slaWarn = ticket ? slaWarnings(ticket) : [];

  const actingOnTicket = Boolean(ticket && staff && (admin || ticket.assigned_to?.id === user!.id));

  const canTransition = actingOnTicket;

  async function mutateTicket(fn: () => Promise<{ data: Ticket }>) {
    try {
      const env = await fn();
      setTicket(env.data);
    } catch (e) {
      setMsg(e instanceof ApiError ? Object.values(e.body?.errors ?? {}).flat().join(" · ") || e.message : "Error.");
    }
  }

  async function submitStatus(ev: React.FormEvent) {
    ev.preventDefault();
    if (!token || !ticket) return;
    await mutateTicket(() => updateStatus(token, ticket.id, statusPick, statusNote.trim() || undefined));
    await loadAll();
    setStatusNote("");
  }

  async function submitPriority(ev: React.FormEvent) {
    ev.preventDefault();
    if (!token || !ticket) return;
    await mutateTicket(() => updatePriority(token, ticket.id, priorityPick, prioReason));
    await loadAll();
    setPrioReason("");
  }

  async function submitAssign(ev: React.FormEvent) {
    ev.preventDefault();
    if (!token || !ticket) return;
    await mutateTicket(() =>
      assignTicket(token, ticket.id, {
        ...(autoAssign ? { auto_assign: true } : { assigned_to_user_id: Number(assignee) }),
      }),
    );
    await loadAll();
    setAssignee("");
  }

  async function submitComment(ev: React.FormEvent) {
    ev.preventDefault();
    if (!token || !ticket || !commentBody.trim()) return;
    try {
      await addComment(token, ticket.id, commentBody, internalNote);
      const cms = await listComments(token, id);
      setComments(cms.data);
      setCommentBody("");
      setInternalNote(false);
      await loadAll();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Comment rejected.");
    }
  }

  async function onDelete() {
    if (!token || !ticket) return;
    if (!confirm("Delete this ticket permanently?")) return;
    try {
      await deleteTicket(token, ticket.id);
      navigate("/tickets");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Delete blocked.");
    }
  }

  const orderedHistory = useMemo(
    () => [...history].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)),
    [history],
  );

  if (!token) {
    return (
      <p className="text-ink-muted">
        Please <Link to="/login" className="text-accent underline">sign in</Link>.
      </p>
    );
  }

  if (Number.isNaN(id))
    return <p className="text-ink-muted">Invalid ticket id.</p>;

  return (
    <div className="flex flex-col gap-8">
      {msg ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">{msg}</div>
      ) : null}

      {!ticket ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <>
          <section className="rounded-3xl border border-borderline bg-gradient-to-br from-accent/15 to-transparent p-8 shadow-panel">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-accent">{ticket.ticket_number}</p>
                <h1 className="font-display text-4xl font-bold">{ticket.subject}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs capitalize ${statusTone(ticket.status)}`}>{ticket.status.replace(/_/g, " ")}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${priorityTone(ticket.priority)}`}>{ticket.priority}</span>
                  <span className="rounded-full px-3 py-1 text-xs capitalize bg-borderline text-ink-muted">{ticket.category.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="text-right text-sm text-ink-muted">
                <div>Customer: {ticket.customer_email}</div>
                <div>Assignee: {ticket.assigned_to?.name ?? "—"}</div>
              </div>
            </div>
            <p className="mt-6 whitespace-pre-wrap text-ink">{ticket.description}</p>
            <div className="mt-6 grid gap-3 rounded-2xl border border-borderline bg-surface-muted/60 p-4 text-sm md:grid-cols-2 dark:bg-surface/40">
              <div><strong className="text-ink">First response due</strong><div className="text-ink-muted">{ticket.sla.first_response_due_at ?? "—"}</div></div>
              <div><strong className="text-ink">Resolution due</strong><div className="text-ink-muted">{ticket.sla.resolution_due_at ?? "—"}</div></div>
              {slaWarn.map((w) => (
                <div key={w} className="md:col-span-2 rounded-lg bg-amber-500/10 px-3 py-2 text-amber-800 dark:text-amber-300">⚠ {w}</div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/tickets" className="text-accent hover:underline">← Tickets</Link>
              {admin ? (
                <button type="button" className="text-sm font-semibold text-red-600 dark:text-red-400" onClick={() => void onDelete()}>Delete</button>
              ) : null}
            </div>
          </section>

          {staff && (
            <div className="grid gap-4 lg:grid-cols-2">
              <form onSubmit={(e) => void submitStatus(e)} className="rounded-2xl border border-borderline bg-surface-muted/40 p-5 dark:bg-surface/30">
                <h2 className="font-display text-lg font-semibold">Status</h2>
                <select className="mt-3 w-full rounded-xl border border-borderline bg-surface px-3 py-2 capitalize" value={statusPick} onChange={(e) => setStatusPick(e.target.value)}>
                  {STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <textarea className="mt-3 w-full rounded-xl border border-borderline bg-surface px-3 py-2 text-sm" rows={2} placeholder="Optional note (audit)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                <button type="submit" disabled={!canTransition} className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40">
                  Apply status
                </button>
              </form>
              <form onSubmit={(e) => void submitPriority(e)} className="rounded-2xl border border-borderline bg-surface-muted/40 p-5 dark:bg-surface/30">
                <h2 className="font-display text-lg font-semibold">Priority + reason</h2>
                <select className="mt-3 w-full rounded-xl border border-borderline bg-surface px-3 py-2" value={priorityPick} onChange={(e) => setPriorityPick(e.target.value)}>
                  {PRIORITY_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <textarea required minLength={5} className="mt-3 w-full rounded-xl border border-borderline bg-surface px-3 py-2 text-sm" rows={3} placeholder="Escalation reason (FR-024)" value={prioReason} onChange={(e) => setPrioReason(e.target.value)} />
                <button type="submit" disabled={!canTransition} className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40">
                  Apply priority
                </button>
              </form>

              {admin && (
                <form onSubmit={(e) => void submitAssign(e)} className="rounded-2xl border border-borderline bg-surface-muted/40 p-5 lg:col-span-2 dark:bg-surface/30">
                  <h2 className="font-display text-lg font-semibold">Assign</h2>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} /> Auto-assign</label>
                    <select disabled={autoAssign} className="flex-1 rounded-xl border border-borderline bg-surface px-3 py-2 disabled:opacity-40" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                      <option value="">Select agent…</option>
                      {agents.map((a) => (<option key={a.id} value={String(a.id)}>{a.name}</option>))}
                    </select>
                    <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-accent-foreground dark:bg-accent">Assign</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <section className="rounded-3xl border border-borderline p-6">
            <h2 className="font-display text-2xl font-semibold mb-4">Discussion</h2>
            <div className="space-y-4">
              {comments.map((c) => (
                <article key={c.id} className="rounded-2xl border border-borderline bg-surface-muted/25 p-4 dark:bg-surface/20">
                  <div className="flex flex-wrap gap-2 text-xs text-ink-muted"><span>{c.author?.name}</span><span>{new Date(c.created_at).toLocaleString()}</span>{c.is_internal ? <span className="text-amber-600">internal</span> : null}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{c.content}</p>
                </article>
              ))}
            </div>
            <form onSubmit={(e) => void submitComment(e)} className="mt-6 flex flex-col gap-3 border-t border-borderline pt-6">
              <textarea required className="rounded-2xl border border-borderline bg-surface px-4 py-3 text-sm" rows={4} value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Compose update…" />
              {(staff) && (<label className="flex gap-2 text-xs text-ink-muted"><input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} /> Internal (agents/admins)</label>)}
              <button type="submit" className="self-start rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">Send</button>
            </form>
          </section>

          <section className="rounded-3xl border border-borderline p-6">
            <h2 className="font-display text-2xl font-semibold mb-4">Audit trail</h2>
            <ul className="space-y-2 text-sm">
              {orderedHistory.map((event, idx) => (
                <li key={`${idx}-${event.timestamp}-${event.kind}`} className="rounded-xl border border-dashed border-borderline px-3 py-2">
                  <strong className="text-ink">{event.kind}</strong> · {event.timestamp}<br />
                  {event.kind === "status"
                    ? <span>{(event.from_status ?? "—") + " → " + (event.to_status ?? "?")}{(event.note ? ` (${event.note})` : "")}</span>
                    : <span>To agent #{String(event.assigned_to_id)}{event.assigned_by_id ? ` by #${event.assigned_by_id}` : ""}</span>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
