import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  defaultSettingsForUser,
  loadUserSettings,
  saveUserSettings,
} from '../../lib/userSettings';
import type { ThemePreference } from '../../lib/theme';
import { SelectField, TextAreaField, TextField } from './form';
import { SettingsTabId, SettingsTabs } from './SettingsTabs';
import { ToggleSwitch } from './ToggleSwitch';

export type { ThemePreference };

export type SettingsFormValues = {
  profile: {
    displayName: string;
    email: string;
    bio: string;
    timezone: string;
  };
  notifications: {
    emailDigest: boolean;
    pushAlerts: boolean;
    marketing: boolean;
    digestFrequency: string;
  };
  privacy: {
    profileVisibility: string;
    discoverable: boolean;
    shareUsage: boolean;
  };
  appearance: {
    theme: ThemePreference;
    density: string;
    reducedMotion: boolean;
  };
};

function cloneValues(v: SettingsFormValues): SettingsFormValues {
  return structuredClone(v);
}

type ProfileErrors = Partial<{ displayName: string; email: string; bio: string }>;

function validateProfile(profile: SettingsFormValues['profile']): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!profile.displayName.trim()) {
    errors.displayName = 'Display name is required.';
  }
  if (profile.bio.length > 280) {
    errors.bio = 'Bio must be 280 characters or fewer.';
  }
  return errors;
}

const tabPanelClass =
  'rounded-b-lg rounded-tr-lg border border-t-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6';

export function SettingsPanel() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [draft, setDraft] = useState<SettingsFormValues | null>(null);
  const [saved, setSaved] = useState<SettingsFormValues | null>(null);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    const stored = loadUserSettings(user.id);
    const base = stored ?? defaultSettingsForUser(user.name, user.email);
    const values = {
      ...base,
      profile: {
        ...base.profile,
        displayName: base.profile.displayName || user.name,
        email: user.email,
      },
    };
    setDraft(cloneValues(values));
    setSaved(cloneValues(values));
    setTheme(values.appearance.theme);
  }, [user, setTheme]);

  const updateDraft = useCallback(
    <K extends keyof SettingsFormValues>(section: K, partial: Partial<SettingsFormValues[K]>) => {
      setDraft(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: { ...prev[section], ...partial },
        };
      });
      setStatusMessage('');
      if (section === 'profile') {
        setProfileErrors({});
      }
    },
    []
  );

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setTheme(nextTheme);
    updateDraft('appearance', { theme: nextTheme });
  };

  const handleSave = () => {
    if (!draft || !user) return;
    const nextProfileErrors = validateProfile(draft.profile);
    setProfileErrors(nextProfileErrors);
    if (Object.keys(nextProfileErrors).length > 0) {
      setActiveTab('profile');
      setStatusMessage('Fix the highlighted fields, then try saving again.');
      return;
    }
    const next = cloneValues({
      ...draft,
      profile: { ...draft.profile, email: user.email },
    });
    saveUserSettings(user.id, next);
    setSaved(next);
    setTheme(next.appearance.theme);
    setStatusMessage(`Settings saved for ${user.name}.`);
  };

  const handleCancel = () => {
    if (!saved) return;
    setDraft(cloneValues(saved));
    setTheme(saved.appearance.theme);
    setProfileErrors({});
    setStatusMessage('Changes discarded.');
  };

  if (!user || !draft) {
    return null;
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40"
      aria-labelledby="settings-heading"
    >
      <h2 id="settings-heading" className="sr-only">
        Account settings
      </h2>

      <p className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400 sm:px-6">
        Signed in as <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
        {' '}({user.role})
      </p>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="p-4 sm:p-6">
        <div
          role="tabpanel"
          id="settings-panel-profile"
          aria-labelledby="settings-tab-profile"
          hidden={activeTab !== 'profile'}
          className={activeTab === 'profile' ? tabPanelClass : 'hidden'}
          tabIndex={activeTab === 'profile' ? 0 : -1}
        >
          <div className="mx-auto max-w-xl space-y-5">
            <TextField
              label="Display name"
              name="displayName"
              autoComplete="name"
              value={draft.profile.displayName}
              onChange={e => updateDraft('profile', { displayName: e.target.value })}
              error={profileErrors.displayName}
              required
              hint="Shown on your public profile."
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={draft.profile.email}
              readOnly
              hint="Linked to your signed-in account."
            />
            <TextAreaField
              label="Bio"
              name="bio"
              value={draft.profile.bio}
              onChange={e => updateDraft('profile', { bio: e.target.value })}
              error={profileErrors.bio}
              hint="Validation placeholder: max 280 characters."
              maxLength={280}
            />
            <SelectField
              label="Time zone"
              name="timezone"
              value={draft.profile.timezone}
              onChange={e => updateDraft('profile', { timezone: e.target.value })}
              options={[
                { value: 'utc', label: 'UTC' },
                { value: 'america-new_york', label: 'Eastern Time (US)' },
                { value: 'america-chicago', label: 'Central Time (US)' },
                { value: 'america-denver', label: 'Mountain Time (US)' },
                { value: 'america-los_angeles', label: 'Pacific Time (US)' },
                { value: 'europe-london', label: 'London' },
              ]}
            />
          </div>
        </div>

        <div
          role="tabpanel"
          id="settings-panel-notifications"
          aria-labelledby="settings-tab-notifications"
          hidden={activeTab !== 'notifications'}
          className={activeTab === 'notifications' ? tabPanelClass : 'hidden'}
          tabIndex={activeTab === 'notifications' ? 0 : -1}
        >
          <div className="mx-auto max-w-xl space-y-6">
            <ToggleSwitch
              label="Email digest"
              description="Receive a summary of activity you follow."
              checked={draft.notifications.emailDigest}
              onChange={emailDigest => updateDraft('notifications', { emailDigest })}
            />
            <ToggleSwitch
              label="Push alerts"
              description="Time-sensitive alerts on devices where you are signed in."
              checked={draft.notifications.pushAlerts}
              onChange={pushAlerts => updateDraft('notifications', { pushAlerts })}
            />
            <ToggleSwitch
              label="Product updates"
              description="Occasional news about features and tips."
              checked={draft.notifications.marketing}
              onChange={marketing => updateDraft('notifications', { marketing })}
            />
            <SelectField
              label="Digest frequency"
              name="digestFrequency"
              value={draft.notifications.digestFrequency}
              onChange={e => updateDraft('notifications', { digestFrequency: e.target.value })}
              hint="Only applies when email digest is enabled."
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </div>
        </div>

        <div
          role="tabpanel"
          id="settings-panel-privacy"
          aria-labelledby="settings-tab-privacy"
          hidden={activeTab !== 'privacy'}
          className={activeTab === 'privacy' ? tabPanelClass : 'hidden'}
          tabIndex={activeTab === 'privacy' ? 0 : -1}
        >
          <div className="mx-auto max-w-xl space-y-6">
            <SelectField
              label="Who can see your profile"
              name="profileVisibility"
              value={draft.privacy.profileVisibility}
              onChange={e => updateDraft('privacy', { profileVisibility: e.target.value })}
              options={[
                { value: 'public', label: 'Anyone' },
                { value: 'signed-in', label: 'Signed-in users' },
                { value: 'connections', label: 'Connections only' },
              ]}
            />
            <ToggleSwitch
              label="Appear in search"
              description="Allow others to find you by name or email when permitted by your visibility."
              checked={draft.privacy.discoverable}
              onChange={discoverable => updateDraft('privacy', { discoverable })}
            />
            <ToggleSwitch
              label="Share anonymized usage"
              description="Placeholder toggle — helps improve recommendations."
              checked={draft.privacy.shareUsage}
              onChange={shareUsage => updateDraft('privacy', { shareUsage })}
            />
          </div>
        </div>

        <div
          role="tabpanel"
          id="settings-panel-appearance"
          aria-labelledby="settings-tab-appearance"
          hidden={activeTab !== 'appearance'}
          className={activeTab === 'appearance' ? tabPanelClass : 'hidden'}
          tabIndex={activeTab === 'appearance' ? 0 : -1}
        >
          <div className="mx-auto max-w-xl space-y-6">
            <SelectField
              label="Theme"
              name="theme"
              value={draft.appearance.theme}
              onChange={e => handleThemeChange(e.target.value as ThemePreference)}
              hint="Uses your system setting when set to System."
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
            <SelectField
              label="Density"
              name="density"
              value={draft.appearance.density}
              onChange={e => updateDraft('appearance', { density: e.target.value })}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
            />
            <ToggleSwitch
              label="Reduce motion"
              description="Limits animations for this session (placeholder — wire to prefers-reduced-motion if needed)."
              checked={draft.appearance.reducedMotion}
              onChange={reducedMotion => updateDraft('appearance', { reducedMotion })}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p
            id="settings-form-status"
            className="order-2 text-sm text-slate-600 dark:text-slate-400 sm:order-1"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
          <div className="order-1 flex flex-wrap gap-2 sm:order-2 sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex min-h-[2.5rem] min-w-[5rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex min-h-[2.5rem] min-w-[5rem] items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
