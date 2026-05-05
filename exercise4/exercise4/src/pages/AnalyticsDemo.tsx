import React, { useCallback, useMemo, useState } from 'react';
import { AnalyticsDashboard } from '../exercise4';

function readAnalyticsErrorFlag(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('analyticsError') === '1';
}

const AnalyticsDemo: React.FC = () => {
  const [analyticsError] = useState(() => readAnalyticsErrorFlag());

  const retryHref = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/';
    }
    return window.location.pathname;
  }, []);

  const handleRetry = useCallback(() => {
    window.location.href = retryHref;
  }, [retryHref]);

  if (analyticsError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div
          data-testid="analytics-error"
          role="alert"
          className="max-w-md rounded-xl border border-rose-200 bg-white p-8 text-center shadow-lg dark:border-rose-900/60 dark:bg-slate-900"
        >
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Analytics unavailable
          </h1>
          <p
            data-testid="analytics-error-message"
            className="mt-3 text-sm text-slate-600 dark:text-slate-400"
          >
            Simulated outage — remove <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">analyticsError=1</code> from the
            URL or use Try again.
          </p>
          <button
            type="button"
            data-testid="analytics-error-retry"
            onClick={handleRetry}
            className="mt-6 inline-flex min-h-[2.5rem] items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <AnalyticsDashboard />;
};

export default AnalyticsDemo;
