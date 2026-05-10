import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../lib/api.js";
import { subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { globalTopListingsFromCatalog } from "../../../lib/adminMarketplaceAggregates.js";
import { ENGAGEMENT_SCORE_FORMULA_TEXT } from "../../../lib/engagementScore.js";
import { marketplaceListingPath } from "../../../lib/marketplaceDisplay.js";

export default function AdminRankingsPage() {
  const [catalog, setCatalog] = useState([]);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const { items } = await apiFetch("/api/marketplace/catalog");
      setCatalog(Array.isArray(items) ? items : []);
    } catch {
      setCatalog([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const top = useMemo(() => globalTopListingsFromCatalog(catalog, 5), [catalog, tick]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Top 5 rankings</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
        Global marketplace top five from live catalog analytics (same engagement ranking as the admin dashboard).{" "}
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{ENGAGEMENT_SCORE_FORMULA_TEXT}</span>
      </p>
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {top.length === 0 ? (
          <li className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">No catalog or no activity.</li>
        ) : (
          top.map((row, i) => (
            <li
              key={row.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <div className="text-xs font-black text-violet-700">#{i + 1}</div>
              <p className="mt-2 line-clamp-2 font-bold text-slate-900">{row.name}</p>
              <p className="mt-1 text-xs text-slate-500">{row.companyName}</p>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt>Visits</dt>
                  <dd className="font-bold tabular-nums text-slate-900">{row.visitCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Reviews</dt>
                  <dd className="font-bold tabular-nums text-slate-900">{row.reviewCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Avg rating</dt>
                  <dd className="font-bold text-slate-900">{row.reviewCount > 0 ? row.avgRating.toFixed(2) : "No rating yet"}</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                  <dt>Engagement score</dt>
                  <dd className="font-black tabular-nums text-violet-800">{Math.round(row.popularityScore)}</dd>
                </div>
              </dl>
              <Link to={marketplaceListingPath(row.slug)} className="mt-3 inline-block text-xs font-bold text-violet-700 underline">
                Open listing
              </Link>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
