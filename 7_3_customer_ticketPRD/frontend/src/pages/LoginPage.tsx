import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { login } from "../lib/api";

export function LoginPage() {
  const { login: setSession } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      const { data } = await login(email, password);
      setSession(data.access_token, data.user);
      nav("/tickets", { replace: true });
    } catch (e2) {
      if (e2 instanceof ApiError) {
        const msg =
          typeof e2.body?.errors?.credentials?.[0] === "string"
            ? e2.body.errors.credentials[0]
            : e2.message;
        setErr(msg);
      } else {
        setErr("Could not reach the API.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-borderline bg-surface-muted/40 p-8 shadow-panel">
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">Use seeded admin/agent or customer credentials.</p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-borderline bg-surface px-3 py-2 text-ink outline-none ring-accent/30 focus:border-accent focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-borderline bg-surface px-3 py-2 text-ink outline-none ring-accent/30 focus:border-accent focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err ? <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{err}</div> : null}
        <button
          disabled={pending}
          type="submit"
          className="rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Need an account?{" "}
        <Link className="font-medium text-accent hover:underline" to="/register">
          Register as customer
        </Link>
      </p>
    </div>
  );
}
