import { SettingsPanel } from "../features/settings/SettingsPanel";

export function SettingsPage() {
  return (
    <div data-testid="settings-page">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Settings</h1>
      <SettingsPanel />
    </div>
  );
}
