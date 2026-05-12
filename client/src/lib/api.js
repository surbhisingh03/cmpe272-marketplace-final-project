export function apiPath(path) {
  const base = import.meta.env.VITE_API_URL || "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Full URL to start Facebook OAuth (browser top-level navigation).
 * In dev, use the API origin (default :5001) so the Vite proxy does not mishandle 302 redirects.
 */
export function facebookOAuthStartUrl(redirectInternalPath) {
  const qs = new URLSearchParams({
    redirect: String(redirectInternalPath || "/marketplace/explore"),
  }).toString();
  const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (configured) return `${configured}/api/auth/facebook?${qs}`;
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_DEV_API_PORT || "5001";
    return `http://localhost:${port}/api/auth/facebook?${qs}`;
  }
  return `/api/auth/facebook?${qs}`;
}

/** True if the API has Facebook OAuth env configured (FACEBOOK_APP_ID, SECRET, REDIRECT_URI). */
export async function fetchFacebookLoginEnabled() {
  try {
    const data = await apiFetch("/api/auth/facebook/status");
    return Boolean(data?.enabled);
  } catch {
    return false;
  }
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("fh_token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(apiPath(path), { ...options, headers, credentials: "include" });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}
