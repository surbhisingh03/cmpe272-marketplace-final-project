/**
 * Shared Top 5 ranking for FusionHub Marketplace explore + dashboard Top Products.
 * Source of truth matches ExploreMarketplace: `/api/marketplace/catalog` items enriched with
 * `getProductAnalytics` (local visits/reviews) and sorted by `compareListingsByPopularityDesc`.
 */

import { calculateEngagementScore } from "./engagementScore.js";
import { compareListingsByPopularityDesc, getProductAnalytics } from "./fusionhubAnalytics.js";
import { displayCompanyName, marketplaceListingPath } from "./marketplaceDisplay.js";

/** Same row shape as `hubTopFiveMerged` on Explore (for LeaderboardListRow / marquee). */
export function mapCatalogItemsToExploreItemsLive(items) {
  const list = Array.isArray(items) ? items : [];
  return list.map((it) => {
    const a = getProductAnalytics(it.id);
    const visitCount = a.visits;
    const reviewCount = a.reviewCount;
    const avgRating = reviewCount > 0 ? a.avgRating : 0;
    return {
      ...it,
      visitCount,
      reviewCount,
      avgRating,
      popularityScore: calculateEngagementScore({
        visitCount,
        reviewCount,
        averageRating: avgRating,
      }),
    };
  });
}

export function getExploreHubTopFiveMergedRows(itemsLive) {
  const live = Array.isArray(itemsLive) ? itemsLive : [];
  const sorted = [...live].sort(compareListingsByPopularityDesc);
  return sorted.slice(0, 5).map((row, i) => ({
    rank: i + 1,
    slug: row.slug,
    id: row.id,
    companySlug: row.companySlug,
    title: row.name,
    companyLabel: displayCompanyName(row.companySlug),
    heroImage: row.heroImage,
    category: row.category,
    ratingDisplay: row.reviewCount > 0 ? row.avgRating : 0,
    reviewsDisplay: row.reviewCount,
    visitsDisplay: row.visitCount,
    popularityScore: row.popularityScore ?? 0,
    listingTo: row.slug != null ? marketplaceListingPath(row.slug) : `/marketplace/products/${row.id}`,
  }));
}

export function getExplorePartnerCompanyTopListings(itemsLive, companySlug) {
  const live = Array.isArray(itemsLive) ? itemsLive : [];
  const sub = live.filter((i) => i.companySlug === companySlug);
  return [...sub].sort(compareListingsByPopularityDesc).slice(0, 5);
}
