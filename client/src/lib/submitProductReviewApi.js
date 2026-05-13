import { apiFetch } from "./api.js";

/**
 * Persists a review to the FusionHub API (required for live activity feed + “reviews today” stats).
 * @param {number|string} productId
 * @param {{ title?: string, body: string, rating: number, recommend?: boolean }} payload
 */
export async function submitProductReviewToApi(productId, { title, body, rating, recommend = true }) {
  const b = typeof body === "string" ? body.trim() : "";
  if (!b) throw new Error("Add a short comment.");
  const t = (typeof title === "string" && title.trim()) || "Marketplace review";
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) throw new Error("Select a star rating.");
  return apiFetch(`/api/reviews/products/${Number(productId)}`, {
    method: "POST",
    body: JSON.stringify({
      title: t.slice(0, 180),
      body: b,
      rating: r,
      recommend: Boolean(recommend),
    }),
  });
}
