import type { ThemePreference } from './types';

export function applyThemeClass(mode: ThemePreference) {
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
