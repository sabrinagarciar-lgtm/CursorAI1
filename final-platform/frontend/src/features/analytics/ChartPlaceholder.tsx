import React from 'react';

type Variant = 'area' | 'bars' | 'donut';

type Props = {
  title: string;
  subtitle?: string;
  variant: Variant;
  loading?: boolean;
  children?: React.ReactNode;
};

function LoadingOverlay({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/70 backdrop-blur-[2px] dark:bg-slate-950/70"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="inline-flex h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent dark:border-indigo-400" />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}

function AreaMock() {
  return (
    <div className="flex h-44 items-end gap-1 px-1 sm:h-52">
      {[
        32, 48, 40, 62, 55, 70, 58, 78, 66, 88, 74, 92, 80, 95, 85, 100, 90, 96,
      ].map((h, i) => (
        <div
          key={`a-${i}`}
          className="group flex-1"
          style={{ height: `${h}%` }}
          title="Placeholder"
        >
          <div className="h-full w-full rounded-t-sm bg-gradient-to-t from-indigo-500/15 via-indigo-500/40 to-indigo-500/70 transition group-hover:from-indigo-500/25 group-hover:to-indigo-500/85 dark:from-indigo-400/10 dark:via-indigo-400/35 dark:to-indigo-400/75" />
        </div>
      ))}
    </div>
  );
}

function BarsMock() {
  const series = [
    { label: 'NA', h: 78 },
    { label: 'EU', h: 56 },
    { label: 'APAC', h: 92 },
    { label: 'LATAM', h: 44 },
  ];
  return (
    <div className="flex h-44 items-end justify-between gap-3 px-2 sm:h-52">
      {series.map(bar => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div
            className="w-full max-w-[3rem] rounded-t-md bg-gradient-to-t from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"
            style={{ height: `${bar.h}%` }}
          />
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutMock() {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-4 sm:h-52 sm:flex-row sm:gap-8">
      <div
        className="relative h-28 w-28 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 p-[10px] shadow-inner dark:from-indigo-400 dark:via-violet-400 dark:to-cyan-300"
        aria-hidden="true"
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          Mix
        </div>
      </div>
      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500" /> Enterprise
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> SMB
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-500" /> Self-serve
        </li>
      </ul>
    </div>
  );
}

export function ChartPlaceholder({ title, subtitle, variant, loading, children }: Props) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Mock chart
        </span>
      </div>

      <div className="relative min-h-[11rem] rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/40">
        {loading ? <LoadingOverlay label="Refreshing chart…" /> : null}
        {children}
        {!children && variant === 'area' ? <AreaMock /> : null}
        {!children && variant === 'bars' ? <BarsMock /> : null}
        {!children && variant === 'donut' ? <DonutMock /> : null}
      </div>
    </section>
  );
}
