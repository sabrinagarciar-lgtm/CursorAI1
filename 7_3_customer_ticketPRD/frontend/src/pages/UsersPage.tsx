import { useCallback, useEffect, useState } from "react";

import { ApiError, listUsers } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { User } from "../types";

export function UsersPage() {
  const { token } = useAuth();
  const [people, setPeople] = useState<User[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const envelope = await listUsers(token);
      setPeople(envelope.data);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Insufficient privileges.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Administrative directory</h1>
        <p className="text-sm text-ink-muted">PRD-aligned admin-only snapshot of principals.</p>
      </header>
      {err ? <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-700">{err}</div> : null}
      <div className="rounded-3xl border border-borderline divide-y divide-borderline bg-surface shadow-panel overflow-hidden">
        {people.map((person) => (
          <article key={person.id} className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:bg-transparent">
            <div>
              <p className="text-lg font-semibold text-ink">{person.name}</p>
              <p className="text-sm text-ink-muted">{person.email}</p>
            </div>
            <span className="mt-3 inline-flex w-fit rounded-full bg-borderline px-3 py-1 text-xs capitalize text-ink sm:mt-0">{person.role}</span>
          </article>
        ))}
        {!people.length && !err ? <p className="px-4 py-6 text-sm text-ink-muted">No records.</p> : null}
      </div>
    </div>
  );
}
