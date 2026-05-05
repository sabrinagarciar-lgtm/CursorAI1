import React, { useCallback, useEffect, useState } from 'react';
import { SelectField, TextAreaField, TextField } from './form';
import { SettingsTabId, SettingsTabs } from './SettingsTabs';
import { ToggleSwitch } from './ToggleSwitch';

export type ThemePreference = 'system' | 'light' | 'dark';

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

const INITIAL_VALUES: SettingsFormValues = {
  profile: {
    displayName: 'Alex Rivera',
    email: 'alex@example.com',
    bio: '',
    timezone: 'america-los_angeles',
  },
  notifications: {
    emailDigest: true,
    pushAlerts: false,
    marketing: false,
    digestFrequency: 'weekly',
  },
  privacy: {
    profileVisibility: 'signed-in',
    discoverable: true,
    shareUsage: false,
  },
  appearance: {
    theme: 'system',
    density: 'comfortable',
    reducedMotion: false,
  },
};

function cloneValues(v: SettingsFormValues): SettingsFormValues {
  return structuredClone(v);
}

function applyThemeClass(mode: ThemePreference) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
    return;
  }
  if (mode === 'light') {
    root.classList.remove('dark');
    return;
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.matches) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

type ProfileErrors = Partial<{ displayName: string; email: string; bio: string }>;

function validateProfile(profile: SettingsFormValues['profile']): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!profile.displayName.trim()) {
    errors.displayName = 'Display name is required.';
  }
  const email = profile.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (profile.bio.length > 280) {
    errors.bio = 'Bio must be 280 characters or fewer.';
  }
  return errors;
}

const tabPanelClass =
  'rounded-b-lg rounded-tr-lg border border-t-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [draft, setDraft] = useState<SettingsFormValues>(() => cloneValues(INITIAL_VALUES));
  const [saved, setSaved] = useState<SettingsFormValues>(() => cloneValues(INITIAL_VALUES));
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    applyThemeClass(draft.appearance.theme);
  }, [draft.appearance.theme]);

  useEffect(() => {
    if (draft.appearance.theme !== 'system') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [draft.appearance.theme]);

  const updateDraft = useCallback(
    <K extends keyof SettingsFormValues>(section: K, partial: Partial<SettingsFormValues[K]>) => {
      setDraft(prev => ({
        ...prev,
        [section]: { ...prev[section], ...partial },
      }));
      setStatusMessage('');
      if (section === 'profile') {
        setProfileErrors({});
      }
    },
    []
  );

  const handleSave = () => {
    const nextProfileErrors = validateProfile(draft.profile);
    setProfileErrors(nextProfileErrors);
    if (Object.keys(nextProfileErrors).length > 0) {
      setActiveTab('profile');
      setStatusMessage('Fix the highlighted fields, then try saving again.');
      return;
    }
    setSaved(cloneValues(draft));
    setStatusMessage('Your settings were saved. (Placeholder — connect to your API.)');
  };

  const handleCancel = () => {
    setDraft(cloneValues(saved));
    setProfileErrors({});
    setStatusMessage('Changes discarded.');
  };

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40"
      aria-labelledby="settings-heading"
    >
      <h2 id="settings-heading" className="sr-only">
        Account settings
      </h2>

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
              onChange={e => updateDraft('profile', { email: e.target.value })}
              error={profileErrors.email}
              hint="Optional — used for sign-in and notifications."
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
              onChange={e =>
                updateDraft('appearance', { theme: e.target.value as ThemePreference })
              }
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
