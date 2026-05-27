import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, authMe } from "./api";
import type { User } from "../types";

const TOKEN_KEY = "support-desk-token";

interface AuthCtx {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (accessToken: string, userSnapshot: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  error?: string | null;
  setTransientError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  const setTransientError = useCallback((msg: string | null) => setErr(msg), []);

  useEffect(() => {
    async function boot() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await authMe(token);
        setUser(data);
      } catch (e) {
        console.warn(e);
        setTokenState(null);
        setUser(null);
        try {
          sessionStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }
      } finally {
        setLoading(false);
      }
    }
    void boot();
  }, [token]);

  const login = useCallback((accessToken: string, userSnapshot: User) => {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } catch {
      try {
        sessionStorage.setItem(TOKEN_KEY, accessToken);
      } catch {
        /* ignore */
      }
    }
    setTokenState(accessToken);
    setUser(userSnapshot);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await authMe(token);
      setUser(data);
    } catch (e) {
      if (e instanceof ApiError && (e.httpStatus === 401 || e.httpStatus === 404)) {
        logout();
      }
      throw e;
    }
  }, [logout, token]);

  const ctx = useMemo(
    (): AuthCtx => ({
      token,
      user,
      loading,
      login,
      logout,
      refreshUser,
      error,
      setTransientError,
    }),
    [login, logout, loading, refreshUser, error, token, user, setTransientError],
  );

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth requires AuthProvider");
  return v;
}
