/**
 * Engagement score (aligned with client `engagementScore.js`):
 * visits + (reviews × 10) + (averageRating × 100), with averageRating treated as 0 when reviewCount is 0.
 */
export function computePopularityScore(visitCount, avgRating = 0, reviewCount = 0) {
  const v = Number(visitCount) || 0;
  const rc = Number(reviewCount) || 0;
  const a = rc > 0 ? Number(avgRating) || 0 : 0;
  return +(v + rc * 10 + a * 100).toFixed(4);
}
