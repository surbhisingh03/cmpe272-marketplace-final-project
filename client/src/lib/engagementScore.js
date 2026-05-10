/**
 * Single definition of marketplace listing engagement (used for Top 5, admin, storefront).
 * When reviewCount is 0, average rating is treated as 0 so the score is visits + reviews×10 only.
 */

/** Admin-only helper text for tooltips (never show on customer marketplace pages). */
export const ENGAGEMENT_SCORE_FORMULA_TEXT =
  "Engagement Score = visits + reviews × 10 + average rating × 100";

/**
 * @param {object} listing
 * @param {number} [listing.visitCount]
 * @param {number} [listing.visits]
 * @param {number} [listing.analyticsVisits]
 * @param {number} [listing.reviewCount]
 * @param {number} [listing.analyticsReviewCount]
 * @param {number|null} [listing.averageRating]
 * @param {number|null} [listing.avgRating]
 * @param {number|null} [listing.analyticsAvgRating]
 */
export function calculateEngagementScore(listing) {
  if (!listing || typeof listing !== "object") return 0;
  const visits = Number(listing.visitCount ?? listing.visits ?? listing.analyticsVisits ?? 0) || 0;
  const reviews = Number(listing.reviewCount ?? listing.analyticsReviewCount ?? 0) || 0;
  const rawAvg = listing.averageRating ?? listing.avgRating ?? listing.analyticsAvgRating;
  const avgRating = reviews > 0 ? Number(rawAvg) || 0 : 0;
  return calculateEngagementScoreFromCounts(visits, reviews, avgRating);
}

export function calculateEngagementScoreFromCounts(visits, reviewCount, averageRating) {
  const v = Number(visits) || 0;
  const rc = Number(reviewCount) || 0;
  const a = rc > 0 ? Number(averageRating) || 0 : 0;
  return v + rc * 10 + a * 100;
}
