import { useCallback, useEffect, useState } from "react";

import { ApiError, listAgents, updateAvailability } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { User } from "../types";

export function AgentsPage() {
  const { token, user } = useAuth();
  const [rows, setRows] = useState<User[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const env = await listAgents(token);
      setRows(env.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Agents directory unavailable.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Technician roster</h1>
        <p className="text-sm text-ink-muted">Directory + availability controls (agents may update themselves only).</p>
      </header>
      {err ? <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300">{err}</div> : null}
      <div className="rounded-3xl border border-borderline bg-surface shadow-panel overflow-x-auto">
        <table className="min-w-full divide-y divide-borderline text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden md:table-cell">Email</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3 hidden lg:table-cell">Expertise</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderline">
            {token ? rows.map((agent) => <AgentRow key={agent.id} agent={agent} reload={load} currentUser={user} token={token} />) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgentRow({
  agent,
  reload,
  currentUser,
  token,
}: {
  agent: User;
  reload: () => void;
  currentUser: User | null;
  token: string;
}) {
  const editable = Boolean(currentUser && currentUser.id === agent.id);
  const [availability, setAvailability] = useState(agent.availability_status ?? "offline");
  const [expertise, setExpertise] = useState((agent.expertise_areas ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAvailability(agent.availability_status ?? "offline");
    setExpertise((agent.expertise_areas ?? []).join(", "));
  }, [agent]);

  async function persist() {
    setBusy(true);
    try {
      const areas = expertise
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      await updateAvailability(token, agent.id, availability, areas);
      await reload();
    } catch (_e) {
      /* surfaced via toast alternative */
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-3">{agent.name}</td>
      <td className="px-4 py-3 text-ink-muted hidden md:table-cell">{agent.email}</td>
      <td className="px-4 py-3">
        <select disabled={!editable} className="rounded-lg border border-borderline bg-surface px-2 py-2" value={availability} onChange={(e) => setAvailability(e.target.value)}>
          {(["available", "busy", "offline"] as const).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <input disabled={!editable} className="w-full rounded-lg border border-borderline bg-surface px-2 py-2" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="comma separated" />
      </td>
      <td className="px-4 py-3 text-right">
        {editable ? (
          <button type="button" disabled={busy} onClick={() => void persist()} className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-40">
            {busy ? "…" : "Save"}
          </button>
        ) : (
          <span className="text-[11px] text-ink-muted">—</span>
        )}
      </td>
    </tr>
  );
}
