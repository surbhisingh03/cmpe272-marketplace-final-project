import { displayCompanyName } from "./marketplaceDisplay.js";
import {
  appendAnalyticsReview,
  appendAnalyticsVisit,
  LS_ANALYTICS_REVIEWS,
  LS_ANALYTICS_VISITS,
  readAnalyticsReviews,
  readAnalyticsVisits,
  clearAnalyticsStorage,
} from "./fusionhubAnalytics.js";

export { LS_ANALYTICS_REVIEWS, LS_ANALYTICS_VISITS };

export const LS_CURRENT_USER = "fusionhub_current_user";
/** @deprecated Use fusionhub_visits via analytics APIs */
export const LS_USER_VISITS = LS_ANALYTICS_VISITS;
export const LS_LAST_VISITED = "fusionhub_last_visited";
export const LS_REVIEWS = LS_ANALYTICS_REVIEWS;

const TRAIL_EVENT = "fusionhub-marketplace-tracking-updated";

/** Stored on each visit (`companyId`); aligns with marketplace journey derivation */
export const JOURNEY_COMPANY_IDS = ["bean-brew", "krativerse", "seaside-travels", "nexus-academy"];

const API_SLUG_TO_JOURNEY = {
  "srikavya-enterprise": "bean-brew",
  krativerse: "krativerse",
  "travel-agency": "seaside-travels",
  "nexus-academy": "nexus-academy",
};

const JOURNEY_TO_API_SLUG = {
  "bean-brew": "srikavya-enterprise",
  krativerse: "krativerse",
  "seaside-travels": "travel-agency",
  "nexus-academy": "nexus-academy",
};

export function journeyCompanyIdToApiSlug(companyId) {
  return JOURNEY_TO_API_SLUG[companyId] || null;
}

/** Canonical teammate sites for “Visit Original Website” (marketplace hub cards). */
export const PARTNER_ORIGINAL_WEBSITE_BY_JOURNEY_ID = {
  "bean-brew": "https://srikavyagelli.com/index.php",
  krativerse: "https://krativerse.com/",
  "seaside-travels": "https://surbhisingh.com/travel-agency/index.php",
  "nexus-academy": "http://geeshitha.com/nexus-academy/",
};

export function partnerStorefrontPath(journeyCompanyId) {
  if (!journeyCompanyId || !JOURNEY_COMPANY_IDS.includes(journeyCompanyId)) return "/marketplace/explore";
  return `/marketplace/storefront/${journeyCompanyId}`;
}

export function normalizeJourneyCompanyIdParam(raw) {
  if (raw == null) return null;
  const id = String(raw).trim().toLowerCase();
  return JOURNEY_COMPANY_IDS.includes(id) ? id : null;
}

export function partnerOriginalWebsiteUrl(journeyCompanyId) {
  return PARTNER_ORIGINAL_WEBSITE_BY_JOURNEY_ID[journeyCompanyId] || null;
}

const LEGACY_LS_VISITED = "fusionhub_visited_companies";
const LEGACY_LS_PATH = "fusionhub_last_visit_path";

export function emitTrackingUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TRAIL_EVENT));
}

export function subscribeTrackingUpdated(handler) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(TRAIL_EVENT, handler);
  return () => window.removeEventListener(TRAIL_EVENT, handler);
}

export function apiCompanySlugToJourneyCompanyId(slug) {
  if (slug == null) return null;
  const k = String(slug).trim();
  return API_SLUG_TO_JOURNEY[k] ?? null;
}

export function journeyCompanyIdToPartnerLabel(companyId) {
  switch (companyId) {
    case "bean-brew":
      return "Bean & Brew Co.";
    case "krativerse":
      return "Krativerse";
    case "seaside-travels":
      return "Seaside Travels";
    case "nexus-academy":
      return "Nexus Academy";
    default:
      return companyId || "Partner";
  }
}

/** Stable identity for localStorage partitioning (prefer email). */
export function getMarketplaceTrackingUserKey(user) {
  if (!user?.email) return null;
  return String(user.email).trim().toLowerCase();
}

/** @param {{ userKey: string, user: string }} payload */
export function persistCurrentTrackedUser(payload) {
  if (typeof window === "undefined" || !payload?.userKey) return;
  try {
    localStorage.setItem(LS_CURRENT_USER, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readCurrentTrackedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_CURRENT_USER);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.userKey === "string") return o;
    return null;
  } catch {
    return null;
  }
}

function normalizeAnalyticsVisitForJourney(v) {
  const idStr = v.itemId != null ? String(v.itemId) : "";
  const numericItemId = idStr && /^\d+$/.test(idStr) ? Number(idStr) : null;
  const visitType = v.type || "product";
  let action = v.action;
  if (action !== "open_storefront" && action !== "visit_external_website" && action !== "view_details") {
    if (visitType === "storefront") action = "open_storefront";
    else if (visitType === "external_website") action = "visit_external_website";
    else action = "view_details";
  }
  return {
    userKey: v.userId,
    userName: v.userName,
    companyId: v.companyId,
    companyName: v.companyName,
    itemId: v.itemId,
    itemSlug: null,
    numericItemId,
    itemName: v.itemName,
    path: v.path,
    timestamp: v.timestamp,
    visitType,
    action,
  };
}

function readAllVisits() {
  if (typeof window === "undefined") return [];
  return readAnalyticsVisits().map(normalizeAnalyticsVisitForJourney);
}

function writeLastVisitedLine(line) {
  localStorage.setItem(LS_LAST_VISITED, line);
}

export function readVisitsFiltered(userKey) {
  if (!userKey) return [];
  const all = readAllVisits();
  return all.filter((v) => v && v.userKey === userKey);
}

export function deriveMostRecentVisitRow(userKey) {
  const list = readVisitsFiltered(userKey);
  let best = null;
  let bestTs = "";
  for (const v of list) {
    if (!v?.timestamp) continue;
    if (String(v.timestamp) > bestTs) {
      bestTs = String(v.timestamp);
      best = v;
    }
  }
  return best;
}

export function deriveVisitedJourneyCompanyIds(userKey) {
  const ids = new Set();
  if (!userKey) return ids;
  for (const v of readVisitsFiltered(userKey)) {
    const cid = v.companyId;
    if (cid && JOURNEY_COMPANY_IDS.includes(cid)) ids.add(cid);
  }
  return ids;
}

export function derivePartnerVisitedFromTracking(userKey, partnerApiSlug) {
  const j = apiCompanySlugToJourneyCompanyId(partnerApiSlug);
  if (!j) return false;
  return deriveVisitedJourneyCompanyIds(userKey).has(j);
}

/**
 * Most recent visit line: `item • company`.
 * Stored `fusionhub_last_visited` is updated on append only for that user append.
 */
export function deriveMostRecentVisitLine(userKey) {
  const list = readVisitsFiltered(userKey);
  let best = null;
  let bestTs = "";
  for (const v of list) {
    if (!v?.timestamp) continue;
    if (String(v.timestamp) > bestTs) {
      bestTs = String(v.timestamp);
      best = v;
    }
  }
  if (!best) return "";
  const item = typeof best.itemName === "string" && best.itemName.trim() ? best.itemName.trim() : "(visit)";
  const co =
    typeof best.companyName === "string" && best.companyName.trim()
      ? best.companyName.trim()
      : journeyCompanyIdToPartnerLabel(best.companyId);
  return `${item} • ${co}`;
}

/** Most recent SPA path from visits where `path` starts with /. */
export function deriveMostRecentVisitPath(userKey) {
  const list = [...readVisitsFiltered(userKey)].sort((a, b) =>
    String(b.timestamp || "").localeCompare(String(a.timestamp || "")),
  );
  for (const v of list) {
    if (typeof v.path === "string" && v.path.startsWith("/")) return v.path;
  }
  return null;
}

export function deriveYourJourneyTopItems(userKey, limit = 5) {
  const list = [...readVisitsFiltered(userKey)].sort((a, b) =>
    String(b.timestamp || "").localeCompare(String(a.timestamp || "")),
  );
  const seen = new Set();
  const out = [];
  for (const v of list) {
    if (!v?.companyId) continue;
    if (v.visitType === "product" && v.itemId) {
      const key = `p|${v.companyId}|${String(v.itemId)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    } else if (v.visitType === "storefront") {
      const key = `s|${v.companyId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    } else if (v.visitType === "external_website") {
      const key = `e|${v.companyId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function appendLocalReview(record) {
  if (typeof window === "undefined" || !record?.userKey || record.productId == null) return;
  appendAnalyticsReview({
    userId: record.userKey,
    userName: record.user || "Member",
    companyId: record.companyId,
    companyName: record.companyName || journeyCompanyIdToPartnerLabel(record.companyId),
    itemId: String(record.productId),
    itemName: record.itemName || "Listing",
    rating: record.rating,
    comment: typeof record.comment === "string" ? record.comment : "",
  });
  emitTrackingUpdated();
}

export function countLocalReviewsForUser(userKey) {
  if (!userKey) return 0;
  return readAnalyticsReviews().filter((r) => r && r.userId === userKey).length;
}

export function trackingDisplayFirstName(user) {
  const name = user?.displayName?.trim();
  if (name) return name.split(/\s+/)[0] || name;
  const local = user?.email?.split("@")[0]?.trim();
  if (local) return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
  return "";
}

function displayUserLabel(user, hubFirstName) {
  const f = hubFirstName?.trim();
  if (f) return f;
  const fromUser = trackingDisplayFirstName(user);
  if (fromUser) return fromUser;
  return "You";
}

/**
 * Hub company-card actions: persists companyId, companyName, action, timestamp (+ userKey for filtering).
 * @param {"open_storefront"|"visit_external_website"} opts.action
 */
export function appendCompanySurfaceVisit({
  user,
  hubFirstName,
  companyId,
  companyName,
  action,
  path = null,
}) {
  if (typeof window === "undefined") return false;
  const userKey = getMarketplaceTrackingUserKey(user);
  if (!userKey || !JOURNEY_COMPANY_IDS.includes(companyId)) return false;
  const name = (companyName && String(companyName).trim()) || journeyCompanyIdToPartnerLabel(companyId);
  const itemName = action === "open_storefront" ? "Storefront" : "Original website";
  const label = displayUserLabel(user, hubFirstName);
  const isOpen = action === "open_storefront";
  appendAnalyticsVisit({
    userId: userKey,
    userName: label,
    companyId,
    companyName: name,
    itemId: null,
    itemName,
    type: isOpen ? "storefront" : "external_website",
    action: isOpen ? "open_storefront" : "visit_external_website",
    path: typeof path === "string" && path.startsWith("/") ? path : null,
  });
  writeLastVisitedLine(`${itemName} • ${name}`);
  persistCurrentTrackedUser({ userKey, user: label });
  emitTrackingUpdated();
  return true;
}

/**
 * @param {object} opts
 * @param {object|null} opts.user - Auth user (must include email when logged in)
 * @param {string} [opts.hubFirstName]
 * @param {string|null} opts.companySlug - API company slug (`srikavya-enterprise`, etc.)
 * @param {string} opts.action — e.g. view_details | open_storefront | visit_website | continue_journey | write_review
 * @param {string|null} [opts.itemSlug] - product slug preferred for `itemId` in persisted row
 * @param {number|string|null} [opts.numericItemId] - fallback when slug missing
 * @param {string|null} [opts.itemName]
 * @param {string|null} [opts.path]
 */
export function appendMarketplaceVisit({
  user,
  hubFirstName,
  companySlug,
  action,
  itemSlug = null,
  numericItemId = null,
  itemName = null,
  path = null,
}) {
  if (typeof window === "undefined") return false;
  if (action === "visit_website") action = "visit_external_website";
  const userKey = getMarketplaceTrackingUserKey(user);
  if (!userKey) return false;
  const companyId = apiCompanySlugToJourneyCompanyId(companySlug);
  if (!companyId) return false;
  const companyName = journeyCompanyIdToPartnerLabel(companyId);
  const resolvedName =
    typeof itemName === "string" && itemName.trim() ? itemName.trim() : resolveItemLabel(action, path);
  const label = displayUserLabel(user, hubFirstName);
  const pathOk = typeof path === "string" && path.startsWith("/") ? path : null;

  if (action === "open_storefront") {
    appendAnalyticsVisit({
      userId: userKey,
      userName: label,
      companyId,
      companyName,
      itemId: null,
      itemName: "Storefront",
      type: "storefront",
      action: "open_storefront",
      path: pathOk,
    });
    writeLastVisitedLine(`Storefront • ${companyName}`);
    persistCurrentTrackedUser({ userKey, user: label });
    emitTrackingUpdated();
    return true;
  }

  if (action === "continue_journey") {
    const productItemId =
      numericItemId != null && numericItemId !== "" ? String(numericItemId) : null;
    if (productItemId) {
      appendAnalyticsVisit({
        userId: userKey,
        userName: label,
        companyId,
        companyName,
        itemId: productItemId,
        itemName: resolvedName,
        type: "product",
        action: "view_details",
        path: pathOk,
      });
      writeLastVisitedLine(`${resolvedName} • ${companyName}`);
    } else {
      appendAnalyticsVisit({
        userId: userKey,
        userName: label,
        companyId,
        companyName,
        itemId: null,
        itemName: resolvedName,
        type: "storefront",
        action: "open_storefront",
        path: pathOk,
      });
      writeLastVisitedLine(`${resolvedName} • ${companyName}`);
    }
    persistCurrentTrackedUser({ userKey, user: label });
    emitTrackingUpdated();
    return true;
  }

  if (action === "visit_external_website" || action === "visit_website") {
    appendAnalyticsVisit({
      userId: userKey,
      userName: label,
      companyId,
      companyName,
      itemId: null,
      itemName: "Original website",
      type: "external_website",
      action: "visit_external_website",
      path: pathOk,
    });
    writeLastVisitedLine(`Original website • ${companyName}`);
    persistCurrentTrackedUser({ userKey, user: label });
    emitTrackingUpdated();
    return true;
  }

  if (action === "write_review") {
    writeLastVisitedLine(`${resolvedName} • ${companyName}`);
    persistCurrentTrackedUser({ userKey, user: label });
    emitTrackingUpdated();
    return true;
  }

  const productItemId =
    numericItemId != null && numericItemId !== "" ? String(numericItemId) : null;
  if (!productItemId) return false;

  appendAnalyticsVisit({
    userId: userKey,
    userName: label,
    companyId,
    companyName,
    itemId: productItemId,
    itemName: resolvedName,
    type: "product",
    action: "view_details",
    path: pathOk,
  });
  writeLastVisitedLine(`${resolvedName} • ${companyName}`);
  persistCurrentTrackedUser({ userKey, user: label });
  emitTrackingUpdated();
  return true;
}

function resolveItemLabel(action, path) {
  if (action === "open_storefront") return "Storefront";
  if (action === "visit_external_website") return "Original website";
  if (action === "visit_website") return "Partner website";
  if (action === "continue_journey") return "Continue journey";
  if (action === "write_review") return "Review";
  if (typeof path === "string" && path.includes("/listing/")) return "Listing";
  if (typeof path === "string" && path.includes("/products/")) return "Product";
  return "Explore";
}

export function marketplaceCompanyDisplayName(companySlug) {
  const j = apiCompanySlugToJourneyCompanyId(companySlug);
  if (j) return journeyCompanyIdToPartnerLabel(j);
  return displayCompanyName(companySlug);
}

/** Clears fusionhub_visits + fusionhub_reviews (+ last-visited line). Does not remove catalog or current user. */
export function resetLocalActivityStorage() {
  if (typeof window === "undefined") return;
  clearAnalyticsStorage();
  localStorage.removeItem(LS_LAST_VISITED);
  emitTrackingUpdated();
}

/** Dev / QA: full local tracking reset including legacy keys. */
export function resetDemoMarketplaceTracking() {
  if (typeof window === "undefined") return;
  resetLocalActivityStorage();
  localStorage.removeItem("fusionhub_user_visits");
  localStorage.removeItem(LEGACY_LS_VISITED);
  localStorage.removeItem(LEGACY_LS_PATH);
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("fusionhub_once_")) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
  emitTrackingUpdated();
}

/** Avoid duplicate rows when React Strict Mode double-invokes effects (per tab). */
export function consumeSessionOnceKey(key) {
  if (typeof window === "undefined" || !key) return false;
  try {
    const k = `fusionhub_once_${key}`;
    if (sessionStorage.getItem(k)) return false;
    sessionStorage.setItem(k, "1");
    return true;
  } catch {
    return true;
  }
}
