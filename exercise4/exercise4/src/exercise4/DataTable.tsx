import React from 'react';

export type Column<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
};

type Props<T> = {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  rowId: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  /** Optional test id on the empty-state cell for E2E */
  emptyTestId?: string;
  /** Optional test id on the table section */
  sectionTestId?: string;
  /** Optional stable test id per row */
  rowTestId?: (row: T) => string;
};

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-slate-800" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, r) => (
        <tr key={`sk-${r}`}>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={`sk-${r}-${c}`} className="px-4 py-3">
              <div className="h-3 w-full max-w-[8rem] animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function DataTable<T>({
  title,
  description,
  columns,
  rows,
  rowId,
  loading,
  emptyMessage = 'No rows match the selected filters.',
  emptyTestId,
  sectionTestId,
  rowTestId,
}: Props<T>) {
  return (
    <section
      data-testid={sectionTestId}
      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60"
    >
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-950/50">
            <tr>
              {columns.map(col => (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          {loading ? (
            <TableSkeleton cols={columns.length} />
          ) : rows.length === 0 ? (
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  data-testid={emptyTestId}
                  className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map(row => (
                <tr
                  key={rowId(row)}
                  data-testid={rowTestId?.(row)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  {columns.map(col => (
                    <td
                      key={col.id}
                      className={`whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200 ${col.className ?? ''}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </section>
  );
}
