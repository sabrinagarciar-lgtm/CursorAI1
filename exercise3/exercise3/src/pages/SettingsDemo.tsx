import React from 'react';
import { SettingsPanel } from '../exercise3/SettingsPanel';

export default function SettingsDemo() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Exercise 3 — tabbed settings with forms, toggles, and theme support.
          </p>
        </header>
        <SettingsPanel />
      </div>
    </div>
  );
}
