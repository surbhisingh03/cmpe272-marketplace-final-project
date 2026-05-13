import { Component, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACTIVITY_META, COMPANY_COLORS } from "../../hooks/useActivityFeed.js";
import { useActivityFeedContext } from "./ActivityFeedProvider.jsx";

function timeAgo(ts) {
  const t = Number(ts);
  if (!Number.isFinite(t)) return "";
  const now = Math.floor(Date.now() / 1000);
  const sec = Math.max(0, now - t);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const d = new Date(t * 1000);
  const y = new Date().getFullYear();
  if (d.getFullYear() === y) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-purple-500 to-indigo-500",
  "from-teal-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-blue-500 to-sky-500",
  "from-green-500 to-emerald-500",
];

function avatarGradient(username) {
  const u = String(username || "A");
  const idx = u.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function companySlugForColors(item) {
  return item.company_slug || null;
}

function companyColorClasses(item) {
  const slug = companySlugForColors(item);
  if (slug && COMPANY_COLORS[slug]) return COMPANY_COLORS[slug];
  return {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-200",
  };
}

const ActivityItem = memo(function ActivityItem({ item, compact, highlighted }) {
  const meta = ACTIVITY_META[item.type] || ACTIVITY_META.visit;
  const colors = companyColorClasses(item);
  const slug = companySlugForColors(item);
  const label = typeof meta.label === "function" ? meta.label(item) : "";

  return (
    <div
      className={[
        "flex cursor-pointer gap-3 border-b border-gray-50 transition-colors duration-150 last:border-b-0 hover:bg-gray-50",
        compact ? "px-3 py-2" : "px-4 py-3",
        highlighted ? "new-item border-l-2 border-purple-400" : "",
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
          compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
          avatarGradient(item.user_name),
        ].join(" ")}
      >
        {initialsFromName(item.user_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={compact ? "text-xs font-semibold text-gray-900" : "text-sm font-semibold text-gray-900"}>
          {item.user_name || "Member"}
        </p>
        <p className={compact ? "text-xs text-gray-500" : "text-sm text-gray-500"}>{label}</p>
        {!compact && item.company_name && slug ? (
          <span
            className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {item.company_name}
          </span>
        ) : null}
        {item.type === "review" && Number(item.rating) > 0 ? (
          <div className={`mt-1 flex gap-0.5 text-xs ${compact ? "text-amber-500" : "text-amber-500"}`} aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= Number(item.rating) ? "text-amber-500" : "text-gray-300"}>
                ★
              </span>
            ))}
          </div>
        ) : null}
        {!compact && item.type === "review" && item.review_text ? (
          <p className="mt-0.5 text-xs italic text-gray-400">
            {String(item.review_text).length > 60 ? `${String(item.review_text).slice(0, 60)}…` : item.review_text}
          </p>
        ) : null}
        <p className={`mt-0.5 text-gray-400 ${compact ? "text-[10px]" : "text-xs"}`}>{timeAgo(item.timestamp)}</p>
      </div>
      <div
        className={`flex shrink-0 items-center justify-center rounded-full text-sm ${meta.bgColor} ${compact ? "h-6 w-6 text-xs" : "h-7 w-7"}`}
      >
        {meta.icon}
      </div>
    </div>
  );
});

class ActivityFeedErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
          Feed temporarily unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}

function ActivityFeedInner({
  maxHeight = "480px",
  showHeader = true,
  compact = false,
  filterCompany = null,
}) {
  const feed = useActivityFeedContext();
  if (!feed) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
        Live activity is unavailable on this view.
      </div>
    );
  }
  const {
    activities,
    isConnected,
    isLoading,
    isPaused,
    newCount,
    error,
    highlightKeys,
    pause,
    resume,
    markAllRead,
    refetch,
  } = feed;

  const scrollRef = useRef(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [bannerIn, setBannerIn] = useState(false);

  useEffect(() => {
    if (newCount > 0 && isPaused) {
      const id = requestAnimationFrame(() => setBannerIn(true));
      return () => cancelAnimationFrame(id);
    }
    setBannerIn(false);
  }, [newCount, isPaused]);

  const filtered = useMemo(() => {
    let rows = activities;
    if (filterCompany) {
      rows = rows.filter((a) => a.company_slug === filterCompany || a.company_name === filterCompany);
    }
    if (typeFilter === "review") rows = rows.filter((a) => a.type === "review");
    else if (typeFilter === "visit") rows = rows.filter((a) => a.type === "visit");
    else if (typeFilter === "signup") rows = rows.filter((a) => a.type === "signup");
    return rows;
  }, [activities, filterCompany, typeFilter]);

  const onScrollTop = useCallback(() => {
    if (scrollRef.current && scrollRef.current.scrollTop < 8) markAllRead();
  }, [markAllRead]);

  const keyOf = (item) => `${item.type}-${item.id}`;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <style>{`
        @keyframes fadeHighlight {
          0%, 50% { background-color: #f5f3ff; }
          100% { background-color: #ffffff; }
        }
        .new-item {
          animation: fadeHighlight 3s forwards;
        }
      `}</style>
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm font-bold text-gray-900">Live Activity</span>
            <span className={`h-2 w-2 shrink-0 rounded-full ${isConnected ? "animate-pulse bg-green-500" : "bg-gray-300"}`} />
            <span className={`text-xs font-medium ${isConnected ? "text-green-600" : "text-gray-400"}`}>
              {isConnected ? "Live" : "Reconnecting…"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            >
              <option value="all">All Activity</option>
              <option value="review">Reviews only</option>
              <option value="visit">Visits only</option>
              <option value="signup">New members</option>
            </select>
            {isPaused ? (
              <button
                type="button"
                onClick={resume}
                className="rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
              >
                ▶ Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pause}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
              >
                ⏸ Pause
              </button>
            )}
          </div>
        </div>
      ) : null}

      {newCount > 0 && isPaused ? (
        <button
          type="button"
          onClick={() => {
            resume();
            scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`block w-full bg-purple-600 py-2 text-center text-sm font-medium text-white transition-transform duration-300 ${
            bannerIn ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          ▲ {newCount} new update{newCount > 1 ? "s" : ""} — click to resume
        </button>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={onScrollTop}
        style={maxHeight === "none" ? undefined : { maxHeight }}
        className={
          maxHeight === "none"
            ? "overflow-visible"
            : "overflow-y-auto [scrollbar-color:rgb(229_231_235)_transparent] [scrollbar-width:thin]"
        }
      >
        {isLoading && !activities.length ? (
          <div className="flex flex-col items-center py-16">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Connecting to live feed…</p>
          </div>
        ) : null}

        {error && !isLoading ? (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-red-400">⚠ Feed unavailable — retrying…</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-xs text-purple-600 underline">
              Retry now
            </button>
          </div>
        ) : null}

        {!isLoading && !filtered.length && !error ? (
          <p className="py-10 text-center text-sm text-gray-400">No activity yet.</p>
        ) : null}

        {filtered.map((item) => (
          <ActivityItem
            key={keyOf(item)}
            item={item}
            compact={compact}
            highlighted={highlightKeys.includes(keyOf(item))}
          />
        ))}
      </div>
    </div>
  );
}

export default function ActivityFeed(props) {
  return (
    <ActivityFeedErrorBoundary>
      <ActivityFeedInner {...props} />
    </ActivityFeedErrorBoundary>
  );
}
