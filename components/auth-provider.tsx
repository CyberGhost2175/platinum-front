"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { can, SHIFT_ROLES } from "@/lib/roles";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/session";
import type { MeUser, ShiftState, TokenPair } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  user: MeUser | null;
  applySession: (tokens: TokenPair) => Promise<MeUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type ShiftContextValue = {
  shift: ShiftState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<ShiftState | null>;
  open: () => Promise<void>;
  close: () => Promise<void>;
};

const ShiftContext = createContext<ShiftContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);

  const refreshUser = useCallback(async () => {
    const me = await api.auth.me();
    setUser(me);
  }, []);

  const applySession = useCallback(async (tokens: TokenPair) => {
    setTokens(tokens.accessToken, tokens.refreshToken);
    const me = await api.auth.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await api.auth.logout(refreshToken);
    } catch {
      /* already invalid */
    }
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAccessToken()) {
        setReady(true);
        return;
      }
      try {
        await refreshUser();
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ ready, user, applySession, logout, refreshUser }),
    [ready, user, applySession, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      <ShiftProvider user={user} ready={ready}>
        {children}
      </ShiftProvider>
    </AuthContext.Provider>
  );
}

function ShiftProvider({
  children,
  user,
  ready,
}: {
  children: React.ReactNode;
  user: MeUser | null;
  ready: boolean;
}) {
  const [shift, setShift] = useState<ShiftState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = can(user?.role, SHIFT_ROLES);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setShift(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const current = await api.shifts.current();
      setShift(current);
      return current;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setShift(null);
        return null;
      }
      setError(errorMessage(err));
      setShift(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const open = useCallback(async () => {
    setError(null);
    await api.shifts.open(user?.locationId ?? undefined);
    await refresh();
  }, [refresh, user?.locationId]);

  const close = useCallback(async () => {
    if (!shift) return;
    setError(null);
    await api.shifts.close(shift.id);
    await refresh();
  }, [refresh, shift]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, refresh]);

  const value = useMemo(
    () => ({ shift, loading, error, refresh, open, close }),
    [shift, loading, error, refresh, open, close],
  );

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) throw new Error("useShift must be used within AuthProvider");
  return context;
}
