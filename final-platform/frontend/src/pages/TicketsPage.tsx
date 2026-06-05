import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  customerEmail: string;
}

export function TicketsPage() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("customer@shopease.com");
  const [message, setMessage] = useState<string | null>(null);

  const loadTickets = () => {
    if (!isAuthenticated) return;
    fetch("/api/tickets", {
      headers: { Authorization: `Bearer ${localStorage.getItem("shopease_token")}` },
    })
      .then((r) => r.json())
      .then(setTickets)
      .catch(() => setTickets([]));
  };

  useEffect(() => {
    loadTickets();
  }, [isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, customerEmail: email, priority: "medium" }),
    });
    if (res.ok) {
      setMessage("Ticket created successfully.");
      setTitle("");
      setDescription("");
      loadTickets();
    } else {
      const data = await res.json();
      setMessage(data.message || "Failed to create ticket.");
    }
  };

  return (
    <div data-testid="tickets-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>

      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Create Ticket</h2>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Submit Ticket
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>

      {isAuthenticated ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-800">Your Tickets</h2>
          {tickets.map((t) => (
            <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">{t.title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sign in to view your ticket list.</p>
      )}
    </div>
  );
}
