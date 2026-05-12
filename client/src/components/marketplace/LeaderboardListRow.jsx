import { Link } from "react-router-dom";
import { getLeaderboardCategoryBadge, rankNumberStyle } from "../../lib/leaderboardRowUi.js";

const rowClass =
  "flex w-full items-center rounded-[14px] border border-[#f0f0f0] bg-white text-left transition-all duration-150 hover:border-[rgba(124,58,237,0.2)] hover:-translate-y-px";

/**
 * Single Top-5 row: rank, title, optional subtitle, star + avg, category pill.
 */
export default function LeaderboardListRow({
  rank,
  title,
  subtitle,
  category,
  reviewCount,
  avgRating,
  to,
}) {
  const badge = getLeaderboardCategoryBadge(category);
  const rc = Number(reviewCount) || 0;
  const hasRating = rc > 0 && avgRating != null;
  const ratingNum = hasRating ? Number(avgRating).toFixed(1) : "—";

  return (
    <Link
      to={to}
      className={rowClass}
      style={{ padding: "13px 16px", gap: 12 }}
    >
      <span
        className="w-7 shrink-0 text-center text-lg tabular-nums leading-none"
        style={rankNumberStyle(rank)}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
        {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="leading-none" style={{ color: "#f59e0b", fontSize: 13 }} aria-hidden>
          ★
        </span>
        <span className="tabular-nums" style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
          {ratingNum}
        </span>
      </div>
      <span
        className="shrink-0 whitespace-nowrap font-bold"
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 20,
          background: badge.bg,
          color: badge.color,
        }}
      >
        {badge.label}
      </span>
    </Link>
  );
}
