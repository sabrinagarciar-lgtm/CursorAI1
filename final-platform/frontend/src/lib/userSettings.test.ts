import { afterEach, describe, expect, it } from "vitest";

import {
  defaultSettingsForUser,
  loadUserSettings,
  saveUserSettings,
  settingsStorageKey,
} from "./userSettings";

describe("userSettings", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("creates defaults from logged-in user", () => {
    const settings = defaultSettingsForUser("Alex Rivera", "alex@example.com");
    expect(settings.profile.displayName).toBe("Alex Rivera");
    expect(settings.profile.email).toBe("alex@example.com");
  });

  it("persists and loads settings per user id", () => {
    const values = defaultSettingsForUser("Test User", "test@example.com");
    values.profile.bio = "Hello world";
    saveUserSettings(42, values);

    expect(settingsStorageKey(42)).toBe("cursorhub_settings_42");
    const loaded = loadUserSettings(42);
    expect(loaded?.profile.bio).toBe("Hello world");
    expect(loadUserSettings(99)).toBeNull();
  });
});
