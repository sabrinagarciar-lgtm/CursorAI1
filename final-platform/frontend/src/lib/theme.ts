export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "cursorhub_theme";

export function applyThemeClass(mode: ThemePreference) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
    return;
  }
  if (mode === "light") {
    root.classList.remove("dark");
    return;
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.matches) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function loadThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function saveThemePreference(mode: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}
