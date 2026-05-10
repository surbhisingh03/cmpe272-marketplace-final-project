import {
  compareListingsByPopularityDesc,
  getProductAnalytics,
  readAnalyticsReviews,
  readAnalyticsVisits,
} from "./fusionhubAnalytics.js";
import { calculateEngagementScoreFromCounts } from "./engagementScore.js";
import {
  apiCompanySlugToJourneyCompanyId,
  journeyCompanyIdToApiSlug,
  journeyCompanyIdToPartnerLabel,
} from "./marketplaceUserTracking.js";
import { displayCompanyName } from "./marketplaceDisplay.js";

const PARTNER_ORDER = ["bean-brew", "krativerse", "seaside-travels", "nexus-academy"];

function companyLabelFromVisitRow(v) {
  const id = v.companyId;
  if (id && PARTNER_ORDER.includes(id)) return journeyCompanyIdToPartnerLabel(id);
  return v.companyName || id || "—";
}

/** Visits count grouped by journey company id (matches fusionhub_visits.companyId). */
export function aggregateVisitsByCompany() {
  const visits = readAnalyticsVisits();
  return PARTNER_ORDER.map((jid) => ({
    journeyId: jid,
    label: journeyCompanyIdToPartnerLabel(jid),
    count: visits.filter((x) => x.companyId === jid).length,
  }));
}

export function aggregateReviewsByCompany() {
  return PARTNER_ORDER.map((jid) => {
    const revs = readAnalyticsReviews().filter((r) => r.companyId === jid);
    return {
      journeyId: jid,
      label: journeyCompanyIdToPartnerLabel(jid),
      count: revs.length,
    };
  });
}

export function uniqueMarketplaceUserIds() {
  const ids = new Set();
  for (const v of readAnalyticsVisits()) {
    if (v.userId) ids.add(v.userId);
  }
  for (const r of readAnalyticsReviews()) {
    if (r.userId) ids.add(r.userId);
  }
  return [...ids];
}

function visitActionLabel(v) {
  const a = v.action || "";
  if (a === "open_storefront") return "opened storefront";
  if (a === "visit_external_website") return "visited partner website";
  if (a === "view_details") return "viewed listing";
  return v.type === "product" ? "viewed listing" : a || "activity";
}

function marketplaceActivityMerged() {
  const visits = readAnalyticsVisits()
    .map((v) => ({
      id: v.id,
      user: v.userName || v.userId || "Member",
      action: visitActionLabel(v),
      company: companyLabelFromVisitRow(v),
      listing: v.itemName || "—",
      time: v.timestamp,
      kind: "visit",
    }))
    .sort((a, b) => String(b.time).localeCompare(String(a.time)));

  const reviews = readAnalyticsReviews()
    .map((r) => ({
      id: r.id,
      user: r.userName || r.userId || "Member",
      action: "submitted review",
      company: journeyCompanyIdToPartnerLabel(r.companyId) || r.companyName || "—",
      listing: r.itemName || "—",
      time: r.timestamp,
      kind: "review",
    }))
    .sort((a, b) => String(b.time).localeCompare(String(a.time)));

  return [...visits, ...reviews].sort((a, b) => String(b.time).localeCompare(String(a.time)));
}

/** All merged visit + review activity rows, newest first. */
export function allMarketplaceActivity() {
  return marketplaceActivityMerged();
}

export function recentMarketplaceActivity(limit = 25) {
  const merged = marketplaceActivityMerged();
  const cap = limit == null || limit === Infinity ? merged.length : limit;
  return merged.slice(0, Math.min(cap, merged.length));
}

/** Counts for activity-type donut: storefront opens, listing views, partner site visits, review submissions. */
export function aggregateActivityTypeBreakdown() {
  const visits = readAnalyticsVisits();
  let storefrontOpens = 0;
  let listingViews = 0;
  let partnerSiteVisits = 0;
  for (const v of visits) {
    const a = v.action;
    if (a === "open_storefront") storefrontOpens += 1;
    else if (a === "visit_external_website") partnerSiteVisits += 1;
    else if (a === "view_details") listingViews += 1;
    else if (v.type === "storefront") storefrontOpens += 1;
    else if (v.type === "external_website") partnerSiteVisits += 1;
    else if (v.type === "product") listingViews += 1;
  }
  const reviewSubmissions = readAnalyticsReviews().length;
  return [
    { key: "storefront", name: "Storefront opens", value: storefrontOpens, fill: "#7c3aed" },
    { key: "listing", name: "Listing views", value: listingViews, fill: "#6366f1" },
    { key: "partner", name: "Partner website visits", value: partnerSiteVisits, fill: "#0ea5e9" },
    { key: "reviews", name: "Review submissions", value: reviewSubmissions, fill: "#14b8a6" },
  ];
}

export function globalTopListingsFromCatalog(catalogItems, n = 5) {
  if (!Array.isArray(catalogItems)) return [];
  const enriched = catalogItems.map((item) => {
    const a = getProductAnalytics(item.id);
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      companySlug: item.companySlug,
      companyName: item.companyName || displayCompanyName(item.companySlug),
      category: item.category,
      heroImage: item.heroImage,
      visitCount: a.visits,
      reviewCount: a.reviewCount,
      avgRating: a.reviewCount > 0 ? a.avgRating : 0,
      popularityScore: a.popularity,
    };
  });
  return [...enriched].sort(compareListingsByPopularityDesc).slice(0, n);
}

export function top5PerCompanyFromCatalog(catalogItems) {
  if (!Array.isArray(catalogItems)) return {};
  /** @type {Record<string, ReturnType<typeof globalTopListingsFromCatalog>>} */
  const out = {};
  for (const jid of PARTNER_ORDER) {
    const apiSlug = journeyCompanyIdToApiSlug(jid);
    if (!apiSlug) continue;
    const subset = catalogItems.filter((i) => i.companySlug === apiSlug);
    out[jid] = globalTopListingsFromCatalog(subset, 5);
  }
  return out;
}

export function averageRatingAllMarketplaceReviews() {
  const revs = readAnalyticsReviews();
  if (!revs.length) return { avg: 0, count: 0, hasRating: false };
  const sum = revs.reduce((s, r) => s + r.rating, 0);
  return { avg: sum / revs.length, count: revs.length, hasRating: true };
}

/** Visits, review count, and average rating for one partner (journey company id). */
export function companyAggregatedStats(journeyCompanyId) {
  const visits = readAnalyticsVisits().filter((v) => v.companyId === journeyCompanyId).length;
  const revs = readAnalyticsReviews().filter((r) => r.companyId === journeyCompanyId);
  const reviewCount = revs.length;
  const avgRating = reviewCount > 0 ? revs.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  return { visits, reviewCount, avgRating, hasRating: reviewCount > 0 };
}

export function listingRowsForAdminTable(catalogItems) {
  if (!Array.isArray(catalogItems)) return [];
  return catalogItems.map((item) => {
    const a = getProductAnalytics(item.id);
    const visits = readAnalyticsVisits();
    const lastProduct = [...visits]
      .filter((v) => v.type === "product" && String(v.itemId) === String(item.id))
      .sort((x, y) => String(y.timestamp).localeCompare(String(x.timestamp)))[0];
    const lastAny = [...visits]
      .filter((v) => v.companyId === apiCompanySlugToJourneyCompanyId(item.companySlug))
      .sort((x, y) => String(y.timestamp).localeCompare(String(x.timestamp)))[0];
    const lastReview = [...readAnalyticsReviews()]
      .filter((r) => String(r.itemId) === String(item.id))
      .sort((x, y) => String(y.timestamp).localeCompare(String(x.timestamp)))[0];
    const candidates = [lastProduct?.timestamp, lastReview?.timestamp, lastAny?.timestamp].filter(Boolean);
    const lastActivity =
      candidates.length > 0 ? candidates.sort((x, y) => String(y).localeCompare(String(x)))[0] : null;
    const score = calculateEngagementScoreFromCounts(a.visits, a.reviewCount, a.avgRating);
    return {
      ...item,
      analyticsVisits: a.visits,
      analyticsReviewCount: a.reviewCount,
      analyticsAvgRating: a.reviewCount > 0 ? a.avgRating : 0,
      rankingScore: score,
      lastActivity,
    };
  });
}
