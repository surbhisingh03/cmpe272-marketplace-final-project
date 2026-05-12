/** Same rules as server: only in-app paths, no open redirects. */
export function safeInternalPath(raw) {
  try {
    const s = decodeURIComponent(String(raw || "").trim());
    if (!s.startsWith("/") || s.startsWith("//")) return "/marketplace/explore";
    return s.length > 512 ? "/marketplace/explore" : s;
  } catch {
    return "/marketplace/explore";
  }
}
