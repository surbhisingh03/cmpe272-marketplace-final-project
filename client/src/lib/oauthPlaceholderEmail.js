/** Placeholder inbox used when Facebook does not return email (public_profile only). */
export function isSyntheticFacebookPlaceholderEmail(email) {
  return typeof email === "string" && /@oauth\.fusionhub\.local$/i.test(email);
}

function oauthLocalPart(email) {
  if (typeof email !== "string" || !email.includes("@")) return "";
  return email.split("@")[0]?.trim() ?? "";
}

/** True when the local part looks like an internal OAuth id placeholder (fb-123…). */
export function isPlaceholderOAuthLocalPart(email) {
  const local = oauthLocalPart(email);
  return /^fb-\d+$/i.test(local);
}

/**
 * Never use synthetic OAuth emails or fb-id local parts as a display name.
 * Returns a capitalized local part only for ordinary sign-in emails; otherwise "".
 */
export function oauthEmailLocalPartAsName(email) {
  if (typeof email !== "string" || !email.trim()) return "";
  if (isSyntheticFacebookPlaceholderEmail(email)) return "";
  if (isPlaceholderOAuthLocalPart(email)) return "";
  const local = oauthLocalPart(email);
  if (!local) return "";
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}
