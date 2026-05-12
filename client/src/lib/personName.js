/** Tokens we never show as a person’s first name (OAuth provider labels, etc.). */
export const INVALID_PROVIDER_DISPLAY_NAMES = new Set(["facebook", "google", "apple"]);

export function isValidPersonFirstNameToken(token) {
  const t = String(token ?? "").trim();
  if (!t) return false;
  return !INVALID_PROVIDER_DISPLAY_NAMES.has(t.toLowerCase());
}

function firstTokenFromLine(line) {
  const s = String(line ?? "").trim();
  if (!s) return undefined;
  const token = s.split(/\s+/).filter(Boolean)[0] || "";
  const t = String(token).trim();
  return isValidPersonFirstNameToken(t) ? t : undefined;
}

/**
 * Reads name-related fields from API payloads with inconsistent casing
 * (e.g. `displayname` vs `displayName`, `firstname` vs `firstName`).
 */
export function readUserNameFields(u) {
  if (!u || typeof u !== "object") {
    return { explicitFirst: "", displayLine: "" };
  }
  const explicitFirst = String(u.firstName ?? u.firstname ?? "").trim();
  const displayLine = String(u.displayName ?? u.displayname ?? u.name ?? "").trim();
  return { explicitFirst, displayLine };
}

/**
 * First name token: prefers `firstName` / `firstname`, else first word of
 * `displayName` / `displayname` / `name`. Returns undefined if nothing valid.
 */
export function computeUserFirstName(u) {
  if (!u || typeof u !== "object") return undefined;
  const { explicitFirst, displayLine } = readUserNameFields(u);
  const fromExplicit = firstTokenFromLine(explicitFirst);
  if (fromExplicit) return fromExplicit;
  return firstTokenFromLine(displayLine);
}

/** For tracking fallbacks: first valid token from display/name, or "". */
export function firstValidTokenFromDisplayOrName(displayName, name) {
  const full = String(displayName ?? name ?? "").trim();
  return firstTokenFromLine(full) ?? "";
}

/** Same as firstValidTokenFromDisplayOrName but reads raw user keys (incl. `displayname`, `firstname`). */
export function firstValidTokenFromUser(u) {
  if (!u || typeof u !== "object") return "";
  const { explicitFirst, displayLine } = readUserNameFields(u);
  return firstTokenFromLine(explicitFirst) ?? firstTokenFromLine(displayLine) ?? "";
}

/** Avatar / activity initials: never email local parts or provider tokens. */
export function userAvatarInitials(user) {
  if (!user) return "?";
  const fn = String(user.firstName ?? user.firstname ?? "").trim();
  if (fn && isValidPersonFirstNameToken(fn)) {
    if (fn.length >= 2) return fn.slice(0, 2).toUpperCase();
    return `${fn[0]}${fn[0]}`.toUpperCase();
  }
  const full = String(user.displayName ?? user.displayname ?? user.name ?? "").trim();
  if (!full) return "?";
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (!isValidPersonFirstNameToken(parts[0])) return "?";
  if (parts.length >= 2 && isValidPersonFirstNameToken(parts[1])) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const w = parts[0];
  if (w.length >= 2) return w.slice(0, 2).toUpperCase();
  return `${w[0]}${w[0]}`.toUpperCase();
}
