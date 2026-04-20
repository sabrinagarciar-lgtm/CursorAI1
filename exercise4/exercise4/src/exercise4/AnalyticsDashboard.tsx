import React, { useEffect, useMemo, useState } from 'react';
import type { DashboardFilters, ThemePreference, TransactionRow } from './types';
import { ChartPlaceholder } from './ChartPlaceholder';
import { DataTable, type Column } from './DataTable';
import { FilterToolbar } from './FilterToolbar';
import { KpiCard } from './KpiCard';
import {
  MOCK_TRANSACTIONS,
  computeKpis,
  dailyRevenueSeries,
  defaultDashboardFilters,
  filterTransactions,
  formatCompactInt,
  formatCurrency,
  revenueByRegion,
} from './mockData';
import { applyThemeClass } from './theme';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function DailyTrend({ rows }: { rows: TransactionRow[] }) {
  const series = useMemo(() => {
    const full = dailyRevenueSeries(rows);
    const maxPoints = 42;
    if (full.length <= maxPoints) {
      return full;
    }
    return full.slice(-maxPoints);
  }, [rows]);

  const max = Math.max(1, ...series.map(p => p.revenue));

  return (
    <div className="flex h-44 items-end gap-px px-1 sm:h-52">
      {series.map(p => (
        <div key={p.date} className="flex min-w-0 flex-1 flex-col justify-end">
          <div
            className="w-full rounded-t-[2px] bg-gradient-to-t from-indigo-500/25 via-indigo-500/55 to-indigo-400 transition hover:from-indigo-500/35 hover:to-indigo-300 dark:from-indigo-400/15 dark:via-indigo-400/45 dark:to-cyan-300/70"
            style={{ height: `${Math.max(6, (p.revenue / max) * 100)}%` }}
            title={`${p.date} — ${formatCurrency(p.revenue)}`}
          />
        </div>
      ))}
    </div>
  );
}

function RegionBars({ rows }: { rows: TransactionRow[] }) {
  const shares = useMemo(() => revenueByRegion(rows), [rows]);
  const max = Math.max(1, ...shares.map(s => s.revenue));
  return (
    <div className="flex h-44 items-end justify-between gap-3 px-2 sm:h-52">
      {shares.map(bar => (
        <div key={bar.region} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div
            className="w-full max-w-[3rem] rounded-t-md bg-gradient-to-t from-slate-300 to-indigo-500 dark:from-slate-600 dark:to-indigo-400"
            style={{ height: `${(bar.revenue / max) * 100}%` }}
            title={`${bar.region}: ${formatCurrency(bar.revenue)}`}
          />
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {bar.region}
          </span>
        </div>
      ))}
    </div>
  );
}

const LOAD_MS = 580;

const transactionColumns: Column<TransactionRow>[] = [
  {
    id: 'id',
    header: 'Reference',
    cell: r => <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{r.id}</span>,
  },
  {
    id: 'date',
    header: 'Date',
    cell: r => r.date,
  },
  {
    id: 'product',
    header: 'Product',
    cell: r => r.product,
  },
  {
    id: 'region',
    header: 'Region',
    cell: r => (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {r.region}
      </span>
    ),
  },
  {
    id: 'segment',
    header: 'Segment',
    cell: r => r.segment,
  },
  {
    id: 'revenue',
    header: 'Revenue',
    className: 'text-right tabular-nums',
    cell: r => formatCurrency(r.revenue),
  },
  {
    id: 'orders',
    header: 'Orders',
    className: 'text-right tabular-nums',
    cell: r => formatCompactInt(r.orders),
  },
];

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(() => defaultDashboardFilters());
  const [committed, setCommitted] = useState<DashboardFilters>(() => defaultDashboardFilters());
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    setIsLoading(true);
    const id = window.setTimeout(() => {
      setCommitted(filters);
      setIsLoading(false);
    }, LOAD_MS);
    return () => window.clearTimeout(id);
  }, [filters]);

  const filtered = useMemo(
    () => filterTransactions(MOCK_TRANSACTIONS, committed),
    [committed]
  );

  const { current: kpis } = useMemo(
    () => computeKpis(MOCK_TRANSACTIONS, committed),
    [committed]
  );

  const tableRows = useMemo(() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)), [filtered]);

  const deltaLabel =
    kpis.revenueDeltaPct === null
      ? 'No comparison for prior window'
      : `${kpis.revenueDeltaPct >= 0 ? '+' : ''}${kpis.revenueDeltaPct.toFixed(1)}% vs prior period`;

  const handlePresets = (preset: '7d' | '30d' | '90d') => {
    const to = new Date();
    const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 89;
    const from = addDays(to, -days);
    setFilters(f => ({
      ...f,
      dateFrom: iso(from),
      dateTo: iso(to),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Exercise 4
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Analytics overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Mock metrics and chart placeholders — filters reload results on a short delay to mimic
              network latency.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="theme-mode" className="sr-only">
              Theme
            </label>
            <select
              id="theme-mode"
              value={theme}
              onChange={e => setTheme(e.target.value as ThemePreference)}
              className="min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25"
            >
              <option value="system">System theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:space-y-10 lg:px-8">
        <FilterToolbar
          filters={filters}
          onChange={setFilters}
          disabled={isLoading}
          onApplyPresets={handlePresets}
        />

        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">
            Key performance indicators
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Revenue"
              value={formatCurrency(kpis.totalRevenue)}
              deltaLabel={deltaLabel}
              deltaPositive={kpis.revenueDeltaPct === null ? undefined : kpis.revenueDeltaPct >= 0}
              loading={isLoading}
            />
            <KpiCard
              title="Orders"
              value={formatCompactInt(kpis.totalOrders)}
              hint="Within selected filters and range"
              loading={isLoading}
            />
            <KpiCard
              title="Avg. order value"
              value={formatCurrency(kpis.avgOrderValue)}
              hint="Revenue ÷ orders"
              loading={isLoading}
            />
            <KpiCard
              title="Active rows"
              value={formatCompactInt(filtered.length)}
              hint="Mock transactions after filters"
              loading={isLoading}
            />
          </div>
        </section>

        <section aria-labelledby="charts-heading" className="space-y-4">
          <h2 id="charts-heading" className="sr-only">
            Charts
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <ChartPlaceholder
                title="Revenue trend"
                subtitle="Daily revenue for the current filter window (mock aggregation)"
                variant="area"
                loading={isLoading}
              >
                <DailyTrend rows={filtered} />
              </ChartPlaceholder>
            </div>
            <div>
              <ChartPlaceholder
                title="Revenue by region"
                subtitle="Share of revenue in range"
                variant="bars"
                loading={isLoading}
              >
                <RegionBars rows={filtered} />
              </ChartPlaceholder>
            </div>
          </div>

          <ChartPlaceholder
            title="Segment mix"
            subtitle="Placeholder doughnut — swap for ECharts, Chart.js, or Recharts later"
            variant="donut"
            loading={isLoading}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
          <DataTable<TransactionRow>
            title="Transactions"
            description="Filtered mock ledger — search narrows products and ids"
            columns={transactionColumns}
            rows={tableRows.slice(0, 12)}
            rowId={r => r.id}
            loading={isLoading}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        Built with React and Tailwind — Exercise #4
      </footer>
    </div>
  );
}
