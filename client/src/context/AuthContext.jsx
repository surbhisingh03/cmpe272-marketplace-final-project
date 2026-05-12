import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { computeUserFirstName } from "../lib/personName.js";

const USER_CACHE_KEY = "fh_user";

const AuthContext = createContext(null);

function readCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || typeof u !== "object") return null;
    return u;
  } catch {
    return null;
  }
}

function writeCachedUser(u) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_CACHE_KEY);
}

function normalizeUser(u) {
  if (!u || typeof u !== "object") return null;
  const { displayname, firstname, ...rest } = u;
  const id = u.id != null ? u.id : null;
  const role =
    u.role ??
    (u.accountType === "admin" ? "admin" : u.accountType === "customer" ? "customer" : undefined);
  const d = String(u.displayName ?? displayname ?? "").trim();
  const n = String(u.name ?? "").trim();
  const displayName = d || n;
  const name = n || d;
  const merged = {
    ...rest,
    id,
    role,
    displayName,
    name,
  };
  merged.firstName = computeUserFirstName({ ...merged, firstName: u.firstName ?? firstname });
  return merged;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("fh_token") ? normalizeUser(readCachedUser()) : null;
  });
  const [loading, setLoading] = useState(() => Boolean(typeof window !== "undefined" && localStorage.getItem("fh_token")));

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const token = localStorage.getItem("fh_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const cached = normalizeUser(readCachedUser());
      if (cached) {
        setUser(cached);
      }
      try {
        const me = normalizeUser(await apiFetch("/api/auth/me"));
        if (!cancelled && me) {
          setUser(me);
          writeCachedUser(me);
        }
      } catch (e) {
        const status = e?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("fh_token");
          writeCachedUser(null);
          if (!cancelled) setUser(null);
        }
        /* Network / proxy / transient errors: keep cached user so UI stays logged-in */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithToken = useCallback((token, u) => {
    localStorage.setItem("fh_token", token);
    const normalized = normalizeUser(u);
    writeCachedUser(normalized);
    setUser(normalized);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fh_token");
    writeCachedUser(null);
    setUser(null);
    setLoading(false);
  }, []);

  const nu = normalizeUser(user);
  const isAuthenticated = Boolean(nu?.email || (nu?.id != null && String(nu.id) !== ""));

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithToken,
      logout,
      setUser: (next) => {
        const normalized = normalizeUser(next);
        writeCachedUser(normalized);
        setUser(normalized);
      },
      isAuthenticated,
    }),
    [user, loading, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
