import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell.jsx";
import ActivityFeed from "../components/ActivityFeed/ActivityFeed.jsx";
import { ActivityToastProvider } from "../components/ActivityFeed/ActivityToast.jsx";
import { ActivityFeedRuntimeProvider, useActivityFeedContext } from "../components/ActivityFeed/ActivityFeedProvider.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";

function statsPath() {
  return "/api/marketplace/activity-stats";
}

function leadersPath() {
  return "/api/marketplace/activity-leaders";
}

export default function ActivityPage() {
  const { user, isAuthenticated } = useAuth();
  const { visits } = useMarketplaceUserTracking(user, isAuthenticated);

  const visitedProductIds = useMemo(() => {
    const s = new Set();
    for (const v of visits) {
      if (v.numericItemId != null) s.add(Number(v.numericItemId));
    }
    return s;
  }, [visits]);

  return (
    <ActivityToastProvider>
      <ActivityFeedRuntimeProvider visitedProductIds={visitedProductIds}>
        <ActivityPageBody />
      </ActivityFeedRuntimeProvider>
    </ActivityToastProvider>
  );
}

function ActivityPageBody() {
  const [stats, setStats] = useState({
    visitCountToday: 0,
    reviewCountToday: 0,
    signupCountToday: 0,
  });
  const [leaders, setLeaders] = useState({ topReviewersToday: [], mostVisitedToday: [] });

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch(statsPath());
      setStats({
        visitCountToday: Number(data.visitCountToday) || 0,
        reviewCountToday: Number(data.reviewCountToday) || 0,
        signupCountToday: Number(data.signupCountToday) || 0,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const loadLeaders = useCallback(async () => {
    try {
      const data = await apiFetch(leadersPath());
      setLeaders({
        topReviewersToday: data.topReviewersToday || [],
        mostVisitedToday: data.mostVisitedToday || [],
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadLeaders();
    const id = window.setInterval(() => {
      loadStats();
      loadLeaders();
    }, 30000);
    return () => window.clearInterval(id);
  }, [loadStats, loadLeaders]);

  const feed = useActivityFeedContext();
  const liveEvents = feed?.activities?.length ?? 0;

  return (
    <PublicShell>
      <div
        className="w-full border-b border-white/10 px-6 py-12 text-white"
        style={{ background: "var(--grad-hero, linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%))" }}
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">FusionHub</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Live Marketplace Activity</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
            Watching <span className="font-semibold text-white">{liveEvents}</span> buffered events across 4 companies (polls
            every 5s).
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total today</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              <AnimatedNumber value={stats.visitCountToday + stats.reviewCountToday + stats.signupCountToday} />
            </p>
            <p className="mt-1 text-xs text-slate-500">Visits + reviews + signups</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviews today</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              <AnimatedNumber value={stats.reviewCountToday} />
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">New members today</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              <AnimatedNumber value={stats.signupCountToday} />
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-10 lg:items-start">
          <div className="lg:col-span-7">
            <h2 className="text-lg font-bold text-slate-900">Activity stream</h2>
            <p className="mt-1 text-sm text-slate-600">All types, updating every 5 seconds.</p>
            <div className="mt-4">
              <ActivityFeed maxHeight="none" showHeader compact={false} filterCompany={null} />
            </div>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Top reviewers today</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-700">
                {(leaders.topReviewersToday || []).slice(0, 5).map((r, i) => (
                  <li key={`${r.userName}-${i}`}>
                    <span className="font-medium">{r.userName}</span>{" "}
                    <span className="text-slate-500">({r.reviewCount})</span>
                  </li>
                ))}
                {!leaders.topReviewersToday?.length ? <li className="list-none text-slate-500">No data yet.</li> : null}
              </ol>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Most visited today</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {(leaders.mostVisitedToday || []).slice(0, 5).map((r, i) => (
                  <li key={`${r.productName}-${i}`} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate font-medium text-slate-900" title={r.productName}>
                      {r.productName}
                    </span>
                    <span className="shrink-0 text-slate-500">{r.visitCount}</span>
                  </li>
                ))}
                {!leaders.mostVisitedToday?.length ? <li className="text-slate-500">No data yet.</li> : null}
              </ul>
            </div>
            <Link to="/marketplace/explore" className="text-sm font-semibold text-violet-700 hover:underline">
              ← Back to Explore
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
