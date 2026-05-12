import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { getGlobalMarketplaceReviewStats, subscribeAnalyticsUpdated } from "../lib/fusionhubAnalytics.js";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";
import { journeyCompanyIdToPartnerLabel, JOURNEY_COMPANY_IDS } from "../lib/marketplaceUserTracking.js";
import { HUB_GRADIENT_HOVER } from "../lib/storefrontBranding.js";

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso || "");
  }
}

function initials(name) {
  const s = String(name || "M").trim();
  const p = s.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
  return s.slice(0, 2).toUpperCase() || "M";
}

function DistBars({ dist, total }) {
  const rows = [5, 4, 3, 2, 1].map((n) => ({ n, c: dist[`s${n}`] || 0 }));
  const max = Math.max(1, ...rows.map((r) => r.c));
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.c / total) * 100) : 0;
        const w = total > 0 ? Math.round((r.c / max) * 100) : 0;
        return (
          <div key={r.n} className="flex items-center gap-2 text-xs">
            <span className="w-14 shrink-0 font-semibold text-slate-600">{r.n} stars</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all" style={{ width: `${w}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right tabular-nums text-slate-500">
              {r.c}
              {total > 0 ? ` (${pct}%)` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MarketplaceReviews() {
  const [catalog, setCatalog] = useState([]);
  const [tick, setTick] = useState(0);
  const [company, setCompany] = useState("");
  const [stars, setStars] = useState("");
  const [q, setQ] = useState("");

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

  const slugByProductId = useMemo(() => {
    const m = new Map();
    for (const c of catalog) m.set(String(c.id), c.slug);
    return m;
  }, [catalog]);

  const stats = useMemo(() => getGlobalMarketplaceReviewStats(), [tick]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stats.allSorted.filter((r) => {
      if (company && r.companyId !== company) return false;
      if (stars && String(r.rating) !== stars) return false;
      if (needle) {
        const blob = `${r.userName} ${r.comment} ${r.itemName} ${r.companyName}`.toLowerCase();
        if (!blob.includes(needle)) return false;
      }
      return true;
    });
  }, [stats.allSorted, company, stars, q]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Marketplace Reviews</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
          Verified reviews from users across all partner companies. Ratings reflect real submissions stored in{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">fusionhub_reviews</code>.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-28px_rgba(15,23,42,0.18)]">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Overall marketplace rating</h2>
            {stats.count === 0 ? (
              <p className="mt-6 text-center text-lg font-semibold text-slate-600">No reviews yet. Be the first to write one.</p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <p className="font-display text-5xl font-black text-slate-900">{stats.avg.toFixed(1)}</p>
                  <div className="flex pb-1 text-amber-500" aria-hidden>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FiStar key={s} className={`h-6 w-6 ${s <= Math.round(stats.avg) ? "fill-current" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {stats.count} review{stats.count === 1 ? "" : "s"} total
                </p>
                <div className="mt-6">
                  <DistBars dist={stats.dist} total={stats.count} />
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-28px_rgba(15,23,42,0.18)]">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Recent review highlight</h2>
            {!stats.latest ? (
              <p className="mt-6 text-center text-sm font-semibold text-slate-600">No reviews yet. Be the first to write one.</p>
            ) : (
              <article className="mt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-bold text-slate-900">{stats.latest.userName || "Member"}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {stats.latest.itemName} · {stats.latest.companyName || journeyCompanyIdToPartnerLabel(stats.latest.companyId)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                    Verified Marketplace User
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-amber-600">{stats.latest.rating} out of 5</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-800">{stats.latest.comment || "—"}</p>
                <p className="mt-3 text-xs text-slate-500">{formatWhen(stats.latest.timestamp)}</p>
              </article>
            )}
          </section>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:col-span-2">
              Search reviews
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search reviews…"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Company
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
              >
                <option value="">All Companies</option>
                {JOURNEY_COMPANY_IDS.map((id) => (
                  <option key={id} value={id}>
                    {journeyCompanyIdToPartnerLabel(id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Rating
              <select
                value={stars}
                onChange={(e) => setStars(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
              >
                <option value="">All</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} stars
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            {stats.count === 0 ? (
              <>
                <p className="text-lg font-bold text-slate-900">No reviews yet. Be the first to review a product or service.</p>
                <Link
                  to="/marketplace/explore"
                  className={`mt-6 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-sm font-bold text-white shadow-md ${HUB_GRADIENT_HOVER}`}
                >
                  Explore Marketplace
                </Link>
              </>
            ) : (
              <p className="text-lg font-bold text-slate-900">No reviews match your filters.</p>
            )}
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const slug = slugByProductId.get(String(r.itemId));
              return (
                <li
                  key={r.id}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.12)] transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-black text-white shadow-md">
                      {initials(r.userName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold text-slate-900">{r.userName || "Member"}</p>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                          Verified Marketplace User
                        </span>
                      </div>
                      <div className="mt-1 flex text-amber-500" aria-label={`${r.rating} stars`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FiStar key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-current" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{r.itemName}</p>
                      <p className="text-xs text-slate-500">{r.companyName || journeyCompanyIdToPartnerLabel(r.companyId)}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">{r.comment || "—"}</p>
                  <p className="mt-3 text-[11px] text-slate-500">{formatWhen(r.timestamp)}</p>
                  {slug ? (
                    <Link
                      to={marketplaceListingPath(slug)}
                      className={`mt-4 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-bold text-white shadow-sm ${HUB_GRADIENT_HOVER}`}
                    >
                      View Listing
                    </Link>
                  ) : (
                    <p className="mt-4 text-center text-xs text-slate-400">Listing unavailable</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
