import { useCallback, useEffect, useState } from "react";
import { apiPath } from "../../lib/api.js";

function statsUrl() {
  const custom = import.meta.env.VITE_ACTIVITY_STATS_URL;
  if (custom && String(custom).trim()) return String(custom).replace(/\/$/, "");
  return apiPath("/api/marketplace/activity-stats");
}

const defaultStats = {
  visitCountToday: 0,
  reviewCountToday: 0,
  userCount: 0,
  activeUsersToday: 0,
  topProductName: "—",
  topProductWeekName: "—",
};

export default function LiveStatsTicker() {
  const [stats, setStats] = useState(defaultStats);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${statsUrl()}?t=${Date.now()}`, { credentials: "omit" });
      if (!res.ok) throw new Error("bad");
      const data = await res.json();
      setStats({
        visitCountToday: Number(data.visitCountToday) || 0,
        reviewCountToday: Number(data.reviewCountToday) || 0,
        userCount: Number(data.userCount) || 0,
        activeUsersToday: Number(data.activeUsersToday) || 0,
        topProductName: data.topProductName || "—",
        topProductWeekName: data.topProductWeekName || data.topProductName || "—",
      });
    } catch {
      /* keep last */
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, [load]);

  const visits = stats.visitCountToday;
  const reviews = stats.reviewCountToday;
  const users = stats.activeUsersToday;
  const topProduct = stats.topProductName;
  const topWeek = stats.topProductWeekName;

  const segment = (
    <>
      <span className="px-6 text-xs font-medium text-gray-300">
        🟢 <span className="text-emerald-400">Live</span>
        <span className="mx-2 text-gray-600">·</span>
        👁 <span className="font-semibold text-white">{visits.toLocaleString()}</span> visits today
        <span className="mx-2 text-gray-600">·</span>
        ⭐ <span className="font-semibold text-white">{reviews.toLocaleString()}</span> reviews
        <span className="mx-2 text-gray-600">·</span>
        🔥 Trending: <span className="font-semibold text-white">{topProduct}</span>
        <span className="mx-2 text-gray-600">·</span>
        👥 <span className="font-semibold text-white">{users.toLocaleString()}</span> active users
        <span className="mx-2 text-gray-600">·</span>
        🏆 #1 this week: <span className="font-semibold text-white">{topWeek}</span>
        <span className="mx-2 text-gray-600">·</span>
      </span>
    </>
  );

  return (
    <div className="h-9 w-full overflow-hidden bg-gray-900 text-white">
      <style>{`
        @keyframes fh-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .fh-ticker-inner {
          display: flex;
          width: max-content;
          animation: fh-ticker 30s linear infinite;
        }
        .fh-ticker-inner:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="fh-ticker-inner items-center">
        {segment}
        {segment}
        {segment}
      </div>
    </div>
  );
}
