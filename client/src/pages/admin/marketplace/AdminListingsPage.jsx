import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../lib/api.js";
import { subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { listingRowsForAdminTable } from "../../../lib/adminMarketplaceAggregates.js";
import { categoryRibbonLabel, displayCompanyName, marketplaceListingPath, pillarKeyFromCategory } from "../../../lib/marketplaceDisplay.js";
import { apiCompanySlugToJourneyCompanyId, partnerStorefrontPath } from "../../../lib/marketplaceUserTracking.js";

const COMPANIES = [
  { value: "", label: "All companies" },
  { value: "srikavya-enterprise", label: "Bean & Brew Co." },
  { value: "krativerse", label: "Krativerse" },
  { value: "travel-agency", label: "Seaside Travels" },
  { value: "nexus-academy", label: "Nexus Academy" },
];

const TYPES = [
  { value: "", label: "All types" },
  { value: "coffee", label: "Coffee" },
  { value: "creative", label: "Creative" },
  { value: "travel", label: "Travel" },
  { value: "education", label: "Education" },
];

const RATINGS = [
  { value: "", label: "All ratings" },
  { value: "4", label: "4+ stars avg" },
  { value: "3", label: "3+ stars avg" },
  { value: "2", label: "2+ stars avg" },
  { value: "1", label: "1+ stars avg" },
];

const HAS = [
  { value: "", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "visited", label: "Most Visited" },
  { value: "rated", label: "Highest Rated" },
  { value: "reviewed", label: "Most Reviewed" },
  { value: "newest", label: "Newest" },
];

const PAGE_SIZE = 10;

function pillarLabel(category) {
  const k = pillarKeyFromCategory(category);
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

function MediaThumb({ src, name }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return <div className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 ring-1 ring-slate-200/80" aria-hidden />;
  }
  return (
    <img
      src={src}
      alt=""
      className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80 transition duration-300 hover:scale-105"
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

export default function AdminListingsPage() {
  const [catalog, setCatalog] = useState([]);
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [hasReviews, setHasReviews] = useState("");
  const [hasVisits, setHasVisits] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(0);

  const reload = useCallback(async () => {
    try {
      const { items } = await apiFetch("/api/marketplace/catalog");
      setCatalog(Array.isArray(items) ? items : []);
    } catch {
      setCatalog([]);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const rows = useMemo(() => listingRowsForAdminTable(catalog), [catalog, tick]);

  const categories = useMemo(() => {
    const s = new Set(catalog.map((c) => c.category).filter(Boolean));
    return [{ value: "", label: "All categories" }, ...[...s].sort().map((c) => ({ value: c, label: c }))];
  }, [catalog]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (company && r.companySlug !== company) return false;
      if (category && r.category !== category) return false;
      if (type && pillarKeyFromCategory(r.category) !== type) return false;
      if (ratingMin) {
        const min = Number(ratingMin);
        if (!(r.analyticsReviewCount > 0 && r.analyticsAvgRating >= min)) return false;
      }
      if (hasReviews === "yes" && r.analyticsReviewCount === 0) return false;
      if (hasReviews === "no" && r.analyticsReviewCount > 0) return false;
      if (hasVisits === "yes" && r.analyticsVisits === 0) return false;
      if (hasVisits === "no" && r.analyticsVisits > 0) return false;
      if (needle) {
        const blob = `${r.name} ${r.excerpt || ""} ${r.companyName}`.toLowerCase();
        if (!blob.includes(needle)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sort === "visited") sorted.sort((a, b) => b.analyticsVisits - a.analyticsVisits);
    else if (sort === "rated")
      sorted.sort((a, b) => {
        const ar = a.analyticsReviewCount > 0 ? a.analyticsAvgRating : -1;
        const br = b.analyticsReviewCount > 0 ? b.analyticsAvgRating : -1;
        return br - ar;
      });
    else if (sort === "reviewed") sorted.sort((a, b) => b.analyticsReviewCount - a.analyticsReviewCount);
    else if (sort === "newest")
      sorted.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    else sorted.sort((a, b) => b.rankingScore - a.rankingScore);

    return sorted;
  }, [rows, q, company, category, type, ratingMin, hasReviews, hasVisits, sort]);

  useEffect(() => {
    setPage(0);
  }, [q, company, category, type, ratingMin, hasReviews, hasVisits, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const pageRows = useMemo(() => {
    const start = pageSafe * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  useEffect(() => {
    if (page !== pageSafe) setPage(pageSafe);
  }, [page, pageSafe]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Listing analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin-only analytics for every listing. Visits, reviews, ratings, and scores reflect real marketplace activity
          captured for reporting.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.12)] lg:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:col-span-2">
            Search listings
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search listings…"
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
              {COMPANIES.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              {categories.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              {TYPES.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Rating
            <select
              value={ratingMin}
              onChange={(e) => setRatingMin(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              {RATINGS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Has reviews
            <select
              value={hasReviews}
              onChange={(e) => setHasReviews(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              {HAS.map((o) => (
                <option key={`hr-${o.value || "a"}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Has visits
            <select
              value={hasVisits}
              onChange={(e) => setHasVisits(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              {HAS.map((o) => (
                <option key={`hv-${o.value || "a"}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
            >
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-18px_rgba(15,23,42,0.12)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Visits</th>
                <th className="px-4 py-3">Reviews</th>
                <th className="px-4 py-3">Avg rating</th>
                <th className="px-4 py-3">Engagement score</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No listings match your filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const jid = apiCompanySlugToJourneyCompanyId(r.companySlug);
                  const sf = jid ? partnerStorefrontPath(jid) : `/marketplace/companies/${r.companySlug}`;
                  const listingUrl = marketplaceListingPath(r.slug);
                  const reviewsUrl = `${listingUrl}#customer-reviews`;
                  return (
                    <tr key={r.id} className="border-t border-slate-100 transition hover:bg-violet-50/50">
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <MediaThumb src={r.heroImage} name={r.name} />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">{r.name}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.excerpt || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
                          {displayCompanyName(r.companySlug)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-violet-900 ring-1 ring-violet-100">
                          {categoryRibbonLabel(r.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{pillarLabel(r.category)}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-800">{r.analyticsVisits}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-800">{r.analyticsReviewCount}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.analyticsReviewCount > 0 ? r.analyticsAvgRating.toFixed(2) : "No rating yet"}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-bold text-slate-900">{Math.round(r.rankingScore)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatWhen(r.lastActivity)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <Link
                            to={listingUrl}
                            className="text-xs font-bold text-violet-700 underline-offset-2 hover:underline"
                          >
                            View listing
                          </Link>
                          <Link to={sf} className="text-xs font-bold text-cyan-700 underline-offset-2 hover:underline">
                            Open storefront
                          </Link>
                          <Link to={reviewsUrl} className="text-xs font-bold text-slate-700 underline-offset-2 hover:underline">
                            View reviews
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Page <span className="font-bold tabular-nums text-slate-900">{pageSafe + 1}</span> of{" "}
              <span className="font-bold tabular-nums text-slate-900">{totalPages}</span>
              <span className="mx-2 text-slate-300">·</span>
              {filtered.length} listings
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageSafe <= 0}
                className="inline-flex min-h-[36px] min-w-[88px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageSafe >= totalPages - 1}
                className="inline-flex min-h-[36px] min-w-[88px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
