import type { SettingsFormValues } from "../features/settings/SettingsPanel";

export function settingsStorageKey(userId: number) {
  return `cursorhub_settings_${userId}`;
}

export function loadUserSettings(userId: number): SettingsFormValues | null {
  const raw = localStorage.getItem(settingsStorageKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SettingsFormValues;
  } catch {
    return null;
  }
}

export function saveUserSettings(userId: number, values: SettingsFormValues) {
  localStorage.setItem(settingsStorageKey(userId), JSON.stringify(values));
}

export function defaultSettingsForUser(
  name: string,
  email: string,
): SettingsFormValues {
  return {
    profile: {
      displayName: name,
      email,
      bio: "",
      timezone: "america-los_angeles",
    },
    notifications: {
      emailDigest: true,
      pushAlerts: false,
      marketing: false,
      digestFrequency: "weekly",
    },
    privacy: {
      profileVisibility: "signed-in",
      discoverable: true,
      shareUsage: false,
    },
    appearance: {
      theme: "system",
      density: "comfortable",
      reducedMotion: false,
    },
  };
}
