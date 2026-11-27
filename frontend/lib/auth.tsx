"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginInput, Me, Preferences, Role, SignupInput } from "@/shared/types";
import { apiGet, apiPatch, apiPost } from "./api-client";

export const DEFAULT_PREFS: Preferences = {
  theme: "light",
  fontScale: "md",
  navigatorSide: "left",
  layout: "single",
};

/** localStorage key read by the inline script in app/layout.tsx (prevents a theme flash). */
export const PREFS_CACHE_KEY = "examcore:prefs";

/** Put the theme and font size on <html> so the CSS variables switch instantly. */
export function applyPreferences(p: Pick<Preferences, "theme" | "fontScale">) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.dataset.font = p.fontScale;
  try {
    window.localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify({ theme: p.theme, fontScale: p.fontScale }));
  } catch {
    // storage may be blocked; the theme still applies for this page
  }
}

type AuthContextValue = {
  me: Me | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<Me>;
  signup: (input: SignupInput) => Promise<Me>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Applies instantly, then saves with PATCH /api/me/preferences. */
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the session once (cookie auth: GET /api/auth/me).
  useEffect(() => {
    let alive = true;
    apiGet<Me>("/api/auth/me")
      .then((m) => alive && setMe(m))
      .catch(() => alive && setMe(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Keep <html data-theme/data-font> in sync with the logged-in user's preferences.
  useEffect(() => {
    if (loading || !me) return; // logged out: keep the last-used theme (already applied from the saved copy)
    applyPreferences(me.preferences);
  }, [me, loading]);

  const login = useCallback(async (input: LoginInput) => {
    const m = await apiPost<Me>("/api/auth/login", input);
    setMe(m);
    return m;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const m = await apiPost<Me>("/api/auth/signup", input);
    setMe(m);
    return m;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout", {});
    } finally {
      setMe(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setMe(await apiGet<Me>("/api/auth/me"));
    } catch {
      setMe(null);
    }
  }, []);

  const updatePreferences = useCallback(async (patch: Partial<Preferences>) => {
    setMe((current) => (current ? { ...current, preferences: { ...current.preferences, ...patch } } : current));
    const saved = await apiPatch<Preferences>("/api/me/preferences", patch);
    setMe((current) => (current ? { ...current, preferences: saved } : current));
  }, []);

  const value = useMemo(
    () => ({ me, loading, login, signup, logout, refresh, updatePreferences }),
    [me, loading, login, signup, logout, refresh, updatePreferences],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function roleHome(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "examiner") return "/examiner";
  return "/candidate";
}
