/**
 * Facebook Login (OAuth 2.0) — exchange code and load profile.
 * @see https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 */

const GRAPH = "https://graph.facebook.com/v19.0";

export function facebookOAuthConfigured() {
  return Boolean(
    process.env.FACEBOOK_APP_ID?.trim() &&
      process.env.FACEBOOK_APP_SECRET?.trim() &&
      process.env.FACEBOOK_REDIRECT_URI?.trim(),
  );
}

export async function exchangeFacebookCode(code, redirectUri) {
  const id = process.env.FACEBOOK_APP_ID;
  const secret = process.env.FACEBOOK_APP_SECRET;
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("client_secret", secret);
  url.searchParams.set("code", code);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const msg = data.error?.message || data.error_description || "Facebook token exchange failed";
    throw new Error(msg);
  }
  return data.access_token;
}

export function displayNameFromFacebookProfile(me) {
  const name = String(me?.name ?? "").trim();
  if (name) return name.slice(0, 120);
  const fn = String(me?.first_name ?? "").trim();
  const ln = String(me?.last_name ?? "").trim();
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  if (combined) return combined.slice(0, 120);
  return "";
}

export async function fetchFacebookProfile(accessToken) {
  const u = new URL(`${GRAPH}/me`);
  u.searchParams.set("fields", "id,name,first_name,last_name,picture.type(large)");
  u.searchParams.set("access_token", accessToken);
  const res = await fetch(u);
  const me = await res.json().catch(() => ({}));
  if (!res.ok || me.error) {
    const msg = me.error?.message || "Facebook profile request failed";
    throw new Error(msg);
  }
  return me;
}
