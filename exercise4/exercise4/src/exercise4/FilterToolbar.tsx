import React from 'react';
import type { DashboardFilters, Region, Segment } from './types';

type Props = {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  disabled?: boolean;
  onApplyPresets: (preset: '7d' | '30d' | '90d') => void;
};

const regionOptions: { value: Region | 'all'; label: string }[] = [
  { value: 'all', label: 'All regions' },
  { value: 'NA', label: 'North America' },
  { value: 'EU', label: 'Europe' },
  { value: 'APAC', label: 'Asia Pacific' },
  { value: 'LATAM', label: 'Latin America' },
];

const segmentOptions: { value: Segment | 'all'; label: string }[] = [
  { value: 'all', label: 'All segments' },
  { value: 'Enterprise', label: 'Enterprise' },
  { value: 'SMB', label: 'SMB' },
  { value: 'Self-serve', label: 'Self-serve' },
];

const fieldClass =
  'mt-1 w-full min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25';

const labelClass = 'text-xs font-medium text-slate-600 dark:text-slate-300';

export function FilterToolbar({ filters, onChange, disabled, onApplyPresets }: Props) {
  const patch = (partial: Partial<DashboardFilters>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="dash-search" className={labelClass}>
              Search products
            </label>
            <input
              id="dash-search"
              type="search"
              autoComplete="off"
              placeholder="Filter by product or id…"
              value={filters.search}
              onChange={e => patch({ search: e.target.value })}
              disabled={disabled}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="dash-region" className={labelClass}>
              Region
            </label>
            <select
              id="dash-region"
              value={filters.region}
              onChange={e => patch({ region: e.target.value as Region | 'all' })}
              disabled={disabled}
              className={fieldClass}
            >
              {regionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dash-segment" className={labelClass}>
              Segment
            </label>
            <select
              id="dash-segment"
              value={filters.segment}
              onChange={e => patch({ segment: e.target.value as Segment | 'all' })}
              disabled={disabled}
              className={fieldClass}
            >
              {segmentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl lg:grid-cols-2">
          <div>
            <label htmlFor="dash-from" className={labelClass}>
              From
            </label>
            <input
              id="dash-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo}
              onChange={e => patch({ dateFrom: e.target.value })}
              disabled={disabled}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="dash-to" className={labelClass}>
              To
            </label>
            <input
              id="dash-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom}
              onChange={e => patch({ dateTo: e.target.value })}
              disabled={disabled}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {(
            [
              { id: '7d' as const, label: 'Last 7 days' },
              { id: '30d' as const, label: 'Last 30 days' },
              { id: '90d' as const, label: 'Last 90 days' },
            ] as const
          ).map(p => (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onApplyPresets(p.id)}
              className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
