/**
 * Authoritative marketplace analytics in localStorage (visits + reviews).
 * Keys: fusionhub_visits, fusionhub_reviews (fusionhub_current_user unchanged in marketplaceUserTracking).
 */

import { calculateEngagementScoreFromCounts } from "./engagementScore.js";

export const LS_ANALYTICS_VISITS = "fusionhub_visits";
export const LS_ANALYTICS_REVIEWS = "fusionhub_reviews";

const ANALYTICS_EVENT = "fusionhub-analytics-updated";

export function emitAnalyticsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT));
}

export function subscribeAnalyticsUpdated(handler) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ANALYTICS_EVENT, handler);
  return () => window.removeEventListener(ANALYTICS_EVENT, handler);
}

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function readAnalyticsVisitsRaw() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_ANALYTICS_VISITS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function readAnalyticsReviewsRaw() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_ANALYTICS_REVIEWS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** @param {object} v */
function isAnalyticsVisit(v) {
  if (!v || typeof v.userId !== "string" || !v.companyId) return false;
  const t = v.type;
  return t === "storefront" || t === "product" || t === "external_website";
}

/** @param {object} r */
function isAnalyticsReview(r) {
  return r && typeof r.userId === "string" && r.itemId != null && typeof r.rating === "number";
}

export function readAnalyticsVisits() {
  return readAnalyticsVisitsRaw().filter(isAnalyticsVisit);
}

export function readAnalyticsReviews() {
  return readAnalyticsReviewsRaw().filter(isAnalyticsReview);
}

/**
 * @param {{
 *   userId: string,
 *   userName?: string,
 *   companyId: string,
 *   companyName: string,
 *   itemId: string|null,
 *   itemName: string,
 *   type: "storefront"|"product"|"external_website",
 *   action?: "open_storefront"|"visit_external_website"|"view_details",
 *   path?: string|null
 * }} payload
 */
/** Skip duplicate visit rows within this window (same user, company, type, item, action). */
const VISIT_DEDUPE_MS = 60_000;

export function appendAnalyticsVisit(payload) {
  if (typeof window === "undefined" || !payload?.userId || !payload?.companyId) return null;
  const typeRaw = payload.type;
  const type =
    typeRaw === "storefront" || typeRaw === "external_website" || typeRaw === "product"
      ? typeRaw
      : "product";
  let action = payload.action;
  if (action !== "open_storefront" && action !== "visit_external_website" && action !== "view_details") {
    if (type === "storefront") action = "open_storefront";
    else if (type === "external_website") action = "visit_external_website";
    else action = "view_details";
  }
  const row = {
    id: genId(),
    userId: payload.userId,
    userName: String(payload.userName || "").trim() || "Member",
    companyId: payload.companyId,
    companyName: String(payload.companyName || "").trim() || payload.companyId,
    itemId: payload.itemId != null && payload.itemId !== "" ? String(payload.itemId) : null,
    itemName:
      String(payload.itemName || "").trim() ||
      (type === "storefront" ? "Storefront" : type === "external_website" ? "Original website" : "Listing"),
    type,
    action,
    path: typeof payload.path === "string" && payload.path.startsWith("/") ? payload.path : null,
    timestamp: new Date().toISOString(),
  };
  const all = readAnalyticsVisitsRaw();
  const now = Date.now();
  const itemKey = String(row.itemId ?? "");
  const scanFrom = Math.max(0, all.length - 250);
  for (let i = all.length - 1; i >= scanFrom; i--) {
    const e = all[i];
    if (!e || e.userId !== row.userId) continue;
    if (e.companyId !== row.companyId || e.type !== row.type || e.action !== row.action) continue;
    if (String(e.itemId ?? "") !== itemKey) continue;
    const t = new Date(e.timestamp).getTime();
    if (Number.isFinite(t) && now - t < VISIT_DEDUPE_MS) {
      return e;
    }
  }
  all.push(row);
  localStorage.setItem(LS_ANALYTICS_VISITS, JSON.stringify(all));
  emitAnalyticsUpdated();
  return row;
}

/**
 * @param {{ userId: string, userName: string, companyId: string, companyName: string, itemId: string|number, itemName: string, rating: number, comment: string }} payload
 */
export function appendAnalyticsReview(payload) {
  if (typeof window === "undefined" || !payload?.userId || payload.itemId == null) return null;
  const r = Number(payload.rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) return null;
  const row = {
    id: genId(),
    userId: payload.userId,
    userName: String(payload.userName || "").trim() || "Member",
    companyId: payload.companyId,
    companyName: String(payload.companyName || "").trim() || payload.companyId,
    itemId: String(payload.itemId),
    itemName: String(payload.itemName || "").trim() || "Listing",
    rating: r,
    comment: String(payload.comment || "").trim(),
    timestamp: new Date().toISOString(),
  };
  const all = readAnalyticsReviewsRaw();
  all.push(row);
  localStorage.setItem(LS_ANALYTICS_REVIEWS, JSON.stringify(all));
  emitAnalyticsUpdated();
  return row;
}

/** @deprecated Prefer calculateEngagementScore / calculateEngagementScoreFromCounts from engagementScore.js */
export function marketplacePopularityScore(visitCount, reviewCount, avgRatingWithReviews) {
  return calculateEngagementScoreFromCounts(visitCount, reviewCount, avgRatingWithReviews);
}

export { calculateEngagementScore, calculateEngagementScoreFromCounts } from "./engagementScore.js";

/** Sort key: higher engagement score first. Tie-break: avg rating, review count, visits. */
export function compareListingsByPopularityDesc(a, b) {
  const key = (p) => {
    const v = Number(p.visitCount ?? p.visits ?? 0) || 0;
    const rc = Number(p.reviewCount ?? 0) || 0;
    const ar = rc > 0 ? Number(p.avgRating ?? 0) || 0 : 0;
    const score = calculateEngagementScoreFromCounts(v, rc, ar);
    return { score, ar, rc, v };
  };
  const ka = key(a);
  const kb = key(b);
  if (kb.score !== ka.score) return kb.score - ka.score;
  if (kb.ar !== ka.ar) return kb.ar - ka.ar;
  if (kb.rc !== ka.rc) return kb.rc - ka.rc;
  return kb.v - ka.v;
}

export function getProductAnalytics(itemId) {
  const id = String(itemId);
  const visits = readAnalyticsVisits().filter((v) => v.type === "product" && v.itemId === id).length;
  const revs = readAnalyticsReviews().filter((r) => r.itemId === id);
  const reviewCount = revs.length;
  const avgRating = reviewCount > 0 ? revs.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  return {
    visits,
    reviewCount,
    avgRating,
    popularity: calculateEngagementScoreFromCounts(visits, reviewCount, avgRating),
  };
}

/** Distribution + recent rows for drawer UI (all from localStorage reviews). */
export function getProductReviewDetail(itemId) {
  const id = String(itemId);
  const revs = readAnalyticsReviews().filter((r) => r.itemId === id);
  const count = revs.length;
  const avg = count > 0 ? revs.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = { total: count, s5: 0, s4: 0, s3: 0, s2: 0, s1: 0 };
  for (const r of revs) {
    const k = `s${r.rating}`;
    if (k in dist) dist[k] += 1;
  }
  const recent = [...revs].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 12);
  return { avg, count, dist, recent };
}

/** All marketplace reviews in localStorage — for public /reviews and admin summaries. */
export function getGlobalMarketplaceReviewStats() {
  const revs = readAnalyticsReviews();
  const count = revs.length;
  const avg = count > 0 ? revs.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = { total: count, s5: 0, s4: 0, s3: 0, s2: 0, s1: 0 };
  for (const r of revs) {
    const k = `s${r.rating}`;
    if (k in dist) dist[k] += 1;
  }
  const sorted = [...revs].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return { avg, count, dist, latest: sorted[0] || null, allSorted: sorted };
}

export function getCompanyAnalytics(companyId) {
  if (!companyId) {
    return {
      storefrontVisits: 0,
      productVisits: 0,
      reviewCount: 0,
      avgRating: 0,
      totalVisits: 0,
    };
  }
  const visits = readAnalyticsVisits().filter((v) => v.companyId === companyId);
  const storefrontVisits = visits.filter(
    (v) => v.type === "storefront" && String(v.itemName || "").trim() === "Storefront",
  ).length;
  const productVisits = visits.filter((v) => v.type === "product").length;
  const revs = readAnalyticsReviews().filter((r) => r.companyId === companyId);
  const reviewCount = revs.length;
  const avgRating = reviewCount > 0 ? revs.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  return {
    storefrontVisits,
    productVisits,
    reviewCount,
    avgRating,
    /** All visit rows for this company (every user): storefront, external site, and product/detail views */
    totalVisits: visits.length,
  };
}

/** Recent reviews for a company (newest first). */
export function getCompanyRecentReviews(companyId, limit = 8) {
  if (!companyId) return [];
  return readAnalyticsReviews()
    .filter((r) => r.companyId === companyId)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, limit);
}

export function clearAnalyticsStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_ANALYTICS_VISITS);
  localStorage.removeItem(LS_ANALYTICS_REVIEWS);
  emitAnalyticsUpdated();
}

