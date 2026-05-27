import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { ApiError, createTicketJson, createTicketMultipart } from "../lib/api";

const CATEGORIES = ["technical", "billing", "general", "feature_request"] as const;
const PRIOS = ["low", "medium", "high", "urgent"] as const;

export function TicketNewPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIOS)[number]>("medium");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("general");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [autoAssign, setAutoAssign] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (user?.email) {
      setCustomerEmail(user.email.toLowerCase());
    }
  }, [user?.email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErr(null);
    setPending(true);
    try {
      const base = {
        subject,
        description,
        priority,
        category,
        customer_email: customerEmail.trim().toLowerCase(),
        ...(isAdmin && autoAssign ? { auto_assign: true } : {}),
      };
      let envelope;
      if (files.length) {
        const fd = new FormData();
        Object.entries(base).forEach(([k, v]) => fd.append(k, String(v)));
        files.slice(0, 3).forEach((f) => fd.append("attachments", f));
        envelope = await createTicketMultipart(token, fd);
      } else {
        envelope = await createTicketJson(token, base as Record<string, unknown>);
      }
      navigate(`/tickets/${envelope.data.id}`, { replace: true });
    } catch (ex) {
      if (ex instanceof ApiError) {
        const flattened = Object.values(ex.body?.errors ?? {})
          .flat()
          .join(" · ");
        setErr(flattened || ex.message);
      } else {
        setErr("Could not create ticket.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">Create ticket</h1>
        <p className="text-sm text-ink-muted">FR-001 fields + optional multipart attachments.</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-borderline bg-surface-muted/30 p-8 shadow-panel">
        <label className="text-sm font-semibold text-ink">
          Subject
          <input
            minLength={5}
            maxLength={200}
            required
            className="mt-1 w-full rounded-xl border border-borderline bg-surface px-4 py-2 text-ink"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-ink">
          Description
          <textarea
            minLength={20}
            maxLength={5000}
            required
            rows={6}
            className="mt-1 w-full rounded-xl border border-borderline bg-surface px-4 py-2 text-ink"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-ink">
            Priority
            <select
              className="mt-1 w-full rounded-xl border border-borderline bg-surface px-4 py-2 text-ink"
              value={priority}
              onChange={(e) => setPriority(e.target.value as (typeof PRIOS)[number])}
            >
              {PRIOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-ink">
            Category
            <select
              className="mt-1 w-full rounded-xl border border-borderline bg-surface px-4 py-2 text-ink capitalize"
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm font-semibold text-ink">
          Customer email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-borderline bg-surface px-4 py-2 text-ink"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-ink-muted">
            Authenticated customers must match their portal email exactly.
          </span>
        </label>
        {isAdmin ? (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} />
            Request automatic routing (FR-006)
          </label>
        ) : null}
        <label className="text-sm font-semibold text-ink">
          Attachments (optional, PDF/JPG/PNG/DOC/DOCX, ≤3 × 5MB)
          <input
            type="file"
            multiple
            className="mt-2 block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-accent-foreground"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))}
          />
        </label>

        {err ? <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{err}</div> : null}

        <button
          disabled={pending}
          type="submit"
          className="rounded-2xl bg-accent py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </div>
  );
}
