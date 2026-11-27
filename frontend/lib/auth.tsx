"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Me, Role, SignupInput } from "@/shared/types";
import { MOCK_USERS } from "@/frontend/lib/mock";

const SESSION_KEY = "examcore:session";
const DEFAULT_PREFS: Me["preferences"] = {
  theme: "light",
  fontScale: "md",
  navigatorSide: "left",
  layout: "single",
};

type AuthContextValue = {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  signup: (input: SignupInput) => Promise<Me>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updatePreferences: (patch: Partial<Me["preferences"]>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toMe(email: string): Me | null {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user) return null;
  return { ...user, preferences: DEFAULT_PREFS };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { email: string; preferences?: Me["preferences"] };
        const found = toMe(parsed.email);
        if (found) {
          setMe({ ...found, preferences: parsed.preferences ?? DEFAULT_PREFS });
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setLoading(false);
  }, []);

  const persist = useCallback((next: Me | null) => {
    setMe(next);
    try {
      if (next) {
        window.localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ email: next.email, preferences: next.preferences }),
        );
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // storage may be unavailable
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!email.trim()) throw new Error("Enter your institutional email.");
      if (password.length < 1) throw new Error("Enter your password.");
      const found = toMe(email);
      if (!found) {
        throw new Error("No account matches that email. Try a demo account.");
      }
      if (!found.isActive) {
        throw new Error("This account has been deactivated.");
      }
      persist(found);
      return found;
    },
    [persist],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const email = input.email.trim().toLowerCase();
      const existing = toMe(email);
      if (existing) {
        throw new Error("An account with this email already exists.");
      }
      const next: Me = {
        id: `u-${Date.now()}`,
        email,
        fullName: input.fullName.trim(),
        role: "candidate",
        isActive: true,
        createdAt: new Date().toISOString(),
        preferences: DEFAULT_PREFS,
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    persist(null);
  }, [persist]);

  const refresh = useCallback(async () => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { email: string };
      const found = toMe(parsed.email);
      if (found) setMe(found);
    } catch {
      // ignore
    }
  }, []);

  const updatePreferences = useCallback(
    (patch: Partial<Me["preferences"]>) => {
      setMe((current) => {
        if (!current) return current;
        const next = {
          ...current,
          preferences: { ...current.preferences, ...patch },
        };
        try {
          window.localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ email: next.email, preferences: next.preferences }),
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      me,
      loading,
      login,
      signup,
      logout,
      refresh,
      updatePreferences,
    }),
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
