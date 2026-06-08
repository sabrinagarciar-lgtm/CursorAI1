import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyThemeClass,
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "../lib/theme";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (mode: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => loadThemePreference());

  const setTheme = useCallback((mode: ThemePreference) => {
    saveThemePreference(mode);
    setThemeState(mode);
    applyThemeClass(mode);
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    if (theme !== "system") {
      return undefined;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeClass("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
