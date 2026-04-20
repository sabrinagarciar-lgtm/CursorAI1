import React from 'react';

type Props = {
  title: string;
  value: string;
  hint?: string;
  deltaLabel?: string;
  deltaPositive?: boolean;
  loading?: boolean;
};

export function KpiCard({
  title,
  value,
  hint,
  deltaLabel,
  deltaPositive,
  loading,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      {loading ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          <div className="h-8 w-2/3 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-1/3 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {value}
          </p>
          {deltaLabel !== undefined && (
            <p
              className={
                deltaPositive === undefined
                  ? 'mt-1 text-xs text-slate-600 dark:text-slate-400'
                  : deltaPositive
                    ? 'mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400'
                    : 'mt-1 text-xs font-medium text-rose-600 dark:text-rose-400'
              }
            >
              {deltaLabel}
            </p>
          )}
          {hint ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
