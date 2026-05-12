/** Rank digit styles for Top 5 rows (1–3 gradient text, 4–5 muted). */
export function rankNumberStyle(rank) {
  const r = Number(rank);
  if (r === 1) {
    return {
      fontWeight: 800,
      backgroundImage: "linear-gradient(135deg,#f59e0b,#ef4444)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    };
  }
  if (r === 2) {
    return {
      fontWeight: 800,
      backgroundImage: "linear-gradient(135deg,#9ca3af,#6b7280)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    };
  }
  if (r === 3) {
    return {
      fontWeight: 800,
      backgroundImage: "linear-gradient(135deg,#d97706,#b45309)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    };
  }
  return { fontWeight: 700, color: "#d1d5db" };
}

/**
 * Maps DB `products.category` → compact badge for leaderboard rows.
 * Pill styles: Course / Travel|Package / Design / Service.
 */
export function getLeaderboardCategoryBadge(category) {
  const c = String(category || "").trim();

  if (c === "Education") {
    return { label: "Course", bg: "#eff6ff", color: "#1d4ed8" };
  }
  if (c === "Travel" || c === "Travel Booking") {
    return { label: "Travel", bg: "#f0fdf4", color: "#065f46" };
  }
  if (c === "Creative Package") {
    return { label: "Package", bg: "#f0fdf4", color: "#065f46" };
  }
  if (["Video Production", "Photography", "Creative Branding", "Creative"].includes(c)) {
    return { label: "Design", bg: "#fff7ed", color: "#9a3412" };
  }
  return { label: "Service", bg: "#fffbeb", color: "#92400e" };
}
