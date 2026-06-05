import { Link } from "react-router-dom";

const FEATURES = [
  { to: "/shop", title: "E-Commerce", desc: "Shop, cart, checkout from Exercise 8.2", color: "from-indigo-500 to-violet-600" },
  { to: "/search", title: "Product Search", desc: "Filters, sort, pagination from Exercise 5", color: "from-emerald-500 to-teal-600" },
  { to: "/settings", title: "Settings Panel", desc: "Profile, privacy, appearance from Exercise 3", color: "from-amber-500 to-orange-600" },
  { to: "/analytics", title: "Analytics", desc: "KPIs, charts, tables from Exercise 4", color: "from-sky-500 to-blue-600" },
  { to: "/kanban", title: "Kanban Board", desc: "Drag-and-drop tasks from Exercise 7", color: "from-rose-500 to-pink-600" },
  { to: "/social", title: "Social Feed", desc: "Posts, comments, likes from Exercise 8.1", color: "from-fuchsia-500 to-purple-600" },
  { to: "/tickets", title: "Ticketing", desc: "Support tickets from Exercise 8.3", color: "from-cyan-500 to-indigo-600" },
  { to: "/qa-dashboard", title: "QA Metrics", desc: "Quality dashboard from 8.1 QA automation", color: "from-slate-600 to-slate-800" },
];

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">CursorHub Final Platform</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Unified full-stack application integrating all course exercises — Flask + SQLAlchemy backend,
          React frontend, Playwright E2E, pytest coverage, Redis caching, Celery tasks, and CI/CD pipeline.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/shop" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Start Shopping
          </Link>
          <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Sign In
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`mb-3 h-2 w-12 rounded-full bg-gradient-to-r ${f.color}`} />
            <h2 className="font-semibold text-slate-900 group-hover:text-indigo-700">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
