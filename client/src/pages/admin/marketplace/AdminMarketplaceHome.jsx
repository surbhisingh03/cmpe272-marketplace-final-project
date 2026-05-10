import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiActivity,
  FiAperture,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCoffee,
  FiHelpCircle,
  FiLayers,
  FiNavigation,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { apiFetch } from "../../../lib/api.js";
import { readAnalyticsReviews, subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { displayCompanyName, marketplaceListingPath } from "../../../lib/marketplaceDisplay.js";
import { journeyCompanyIdToPartnerLabel } from "../../../lib/marketplaceUserTracking.js";
import {
  aggregateActivityTypeBreakdown,
  aggregateReviewsByCompany,
  aggregateVisitsByCompany,
  averageRatingAllMarketplaceReviews,
  companyAggregatedStats,
  globalTopListingsFromCatalog,
  listingRowsForAdminTable,
  recentMarketplaceActivity,
  top5PerCompanyFromCatalog,
} from "../../../lib/adminMarketplaceAggregates.js";
import { ENGAGEMENT_SCORE_FORMULA_TEXT } from "../../../lib/engagementScore.js";

const CARD =
  "rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)]";

const COMPANY_IDS = ["bean-brew", "krativerse", "seaside-travels", "nexus-academy"];

const COMPANY_ICONS = {
  "bean-brew": FiCoffee,
  krativerse: FiAperture,
  "seaside-travels": FiNavigation,
  "nexus-academy": FiBookOpen,
};

function formatShortTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function ScoreTip() {
  return (
    <span className="inline-flex items-center text-[#94a3b8]" title={ENGAGEMENT_SCORE_FORMULA_TEXT}>
      <FiHelpCircle className="h-4 w-4" aria-hidden />
    </span>
  );
}

function ListingThumb({ src, className = "h-10 w-10" }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return <div className={`${className} shrink-0 rounded-lg bg-[#f1f5f9] ring-1 ring-[#e2e8f0]`} aria-hidden />;
  }
  return (
    <img
      src={src}
      alt=""
      className={`${className} shrink-0 rounded-lg object-cover ring-1 ring-[#e2e8f0]`}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

function ActionBadge({ action }) {
  const a = String(action || "").toLowerCase();
  let pill = "border-slate-200 bg-slate-50 text-slate-700";
  let short = action;
  if (a.includes("submitted review")) {
    pill = "border-emerald-200 bg-emerald-50 text-emerald-900";
    short = "Review";
  } else if (a.includes("opened storefront")) {
    pill = "border-violet-200 bg-violet-50 text-violet-900";
    short = "Storefront";
  } else if (a.includes("visited partner")) {
    pill = "border-cyan-200 bg-cyan-50 text-cyan-900";
    short = "Partner site";
  } else if (a.includes("viewed listing") || a.includes("viewed")) {
    pill = "border-amber-200 bg-amber-50 text-amber-950";
    short = "Listing";
  }
  return (
    <span
      className={`inline-flex max-w-full shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill}`}
      title={action}
    >
      {short}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, helper }) {
  return (
    <div className={`${CARD} flex flex-col p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/12 to-cyan-500/12 text-violet-700 ring-1 ring-violet-100">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="mt-1 font-display text-2xl font-black tracking-tight text-[#0f172a] tabular-nums">{value}</p>
      <p className="mt-2 text-[11px] leading-snug text-[#94a3b8]">{helper}</p>
    </div>
  );
}

export default function AdminMarketplaceHome() {
  const [catalog, setCatalog] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overviewErr, setOverviewErr] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const { items } = await apiFetch("/api/marketplace/catalog");
      setCatalog(Array.isArray(items) ? items : []);
    } catch {
      setCatalog([]);
    }
    try {
      const o = await apiFetch("/api/admin/overview", { admin: true });
      setOverview(o);
      setOverviewErr(false);
    } catch {
      setOverview(null);
      setOverviewErr(true);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const visitsByCo = useMemo(() => aggregateVisitsByCompany(), [tick]);
  const reviewsByCo = useMemo(() => aggregateReviewsByCompany(), [tick]);
  const visitsChartData = useMemo(() => visitsByCo.map((r) => ({ name: r.label, count: r.count })), [visitsByCo]);
  const reviewsChartData = useMemo(() => reviewsByCo.map((r) => ({ name: r.label, count: r.count })), [reviewsByCo]);
  const activityBreakdown = useMemo(() => aggregateActivityTypeBreakdown(), [tick]);
  const activityBreakdownTotal = useMemo(() => activityBreakdown.reduce((s, x) => s + x.value, 0), [activityBreakdown]);

  const totalVisits = useMemo(() => visitsByCo.reduce((s, x) => s + x.count, 0), [visitsByCo]);
  const totalReviews = useMemo(() => readAnalyticsReviews().length, [tick]);
  const avgMarket = useMemo(() => averageRatingAllMarketplaceReviews(), [tick]);

  const top5 = useMemo(() => globalTopListingsFromCatalog(catalog, 5), [catalog, tick]);
  const topByCompany = useMemo(() => top5PerCompanyFromCatalog(catalog), [catalog, tick]);
  const activity = useMemo(() => recentMarketplaceActivity(10), [tick]);
  const slugByProductId = useMemo(() => {
    const m = new Map();
    for (const c of catalog) m.set(String(c.id), c.slug);
    return m;
  }, [catalog]);

  const recentReviews = useMemo(() => {
    return [...readAnalyticsReviews()]
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 5);
  }, [tick]);

  const listingPreview = useMemo(() => {
    const rows = listingRowsForAdminTable(catalog);
    return [...rows].sort((a, b) => b.rankingScore - a.rankingScore).slice(0, 8);
  }, [catalog, tick]);

  const registeredUsersDisplay = overviewLoading ? "…" : overviewErr ? "—" : String(overview?.counts?.users ?? 0);

  const kpis = [
    {
      icon: FiUsers,
      label: "Total Users",
      value: registeredUsersDisplay,
      helper: "People who have created an account in FusionHub.",
    },
    {
      icon: FiActivity,
      label: "Total Visits",
      value: totalVisits,
      helper: "Storefront, listing, and partner-site visits recorded for reporting.",
    },
    {
      icon: FiStar,
      label: "Total Reviews",
      value: totalReviews,
      helper: "Reviews submitted by signed-in users across the marketplace.",
    },
    {
      icon: FiLayers,
      label: "Total Listings",
      value: catalog.length,
      helper: "Products and services in the live catalog.",
    },
    {
      icon: FiBriefcase,
      label: "Partner Companies",
      value: 4,
      helper: "Active partner storefronts on FusionHub.",
    },
    {
      icon: FiAward,
      label: "Average Rating",
      value: avgMarket.hasRating ? avgMarket.avg.toFixed(2) : "No rating yet",
      helper: avgMarket.hasRating ? "Mean of all submitted star ratings." : "Ratings appear after the first review.",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">Marketplace Admin Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#64748b]">
          Monitor marketplace visits, reviews, ratings, listings, and partner performance across all companies.
        </p>
        {overviewErr ? (
          <p className="mt-3 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
            Summary stats could not be loaded. Check that you are signed in as admin and the server is running, then
            refresh this page.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.label} icon={k.icon} label={k.label} value={k.value} helper={k.helper} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className={`${CARD} flex min-h-[260px] flex-col p-4 sm:p-5`}>
          <h2 className="text-sm font-bold text-[#0f172a]">Visits by Company</h2>
          <p className="mt-1 text-xs text-[#64748b]">Recorded visits per partner storefront and listings.</p>
          <div className="mt-2 min-h-[200px] flex-1">
            {totalVisits === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] text-center text-xs text-[#64748b]">
                No visits recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart layout="vertical" data={visitsChartData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="adminDashVisitsGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#e2e8f0" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11, fill: "#475569" }} stroke="#e2e8f0" />
                  <Tooltip
                    cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
                    formatter={(v) => [v, "Visits"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="url(#adminDashVisitsGrad)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className={`${CARD} flex min-h-[260px] flex-col p-4 sm:p-5`}>
          <h2 className="text-sm font-bold text-[#0f172a]">Reviews by Company</h2>
          <p className="mt-1 text-xs text-[#64748b]">Submitted reviews attributed to each partner.</p>
          <div className="mt-2 min-h-[200px] flex-1">
            {totalReviews === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] text-center text-xs text-[#64748b]">
                No reviews yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart layout="vertical" data={reviewsChartData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="adminDashReviewsGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#e2e8f0" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11, fill: "#475569" }} stroke="#e2e8f0" />
                  <Tooltip
                    cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
                    formatter={(v) => [v, "Reviews"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="url(#adminDashReviewsGrad)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className={`${CARD} flex min-h-[260px] flex-col p-4 sm:p-5`}>
          <h2 className="text-sm font-bold text-[#0f172a]">Activity type breakdown</h2>
          <p className="mt-1 text-xs text-[#64748b]">Mix of visit actions and review submissions.</p>
          <div className="mt-2 flex min-h-[200px] flex-1 flex-col items-center justify-center">
            {activityBreakdownTotal === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] text-center text-xs text-[#64748b]">
                No activity recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Tooltip
                    formatter={(v, _n, p) => [v, p?.payload?.name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Pie
                    data={activityBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {activityBreakdown.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} stroke="#fff" strokeWidth={1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            {activityBreakdownTotal > 0 ? (
              <ul className="mt-1 flex w-full flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[#64748b]">
                {activityBreakdown.map((b) => (
                  <li key={b.key} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.fill }} aria-hidden />
                    {b.name}: {b.value}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <section className={`${CARD} overflow-hidden p-0`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] px-5 py-4">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[#0f172a]">Marketplace Top 5</h2>
                <ScoreTip />
              </div>
              <p className="mt-0.5 text-xs text-[#64748b]">Leading listings by engagement score.</p>
            </div>
          </div>
        </div>
        {top5.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#64748b]">No listings in the catalog yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed text-left text-sm">
              <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                <tr>
                  <th className="w-[52px] px-3 py-3 pl-4">#</th>
                  <th className="w-[56px] px-1 py-3"> </th>
                  <th className="px-2 py-3">Listing</th>
                  <th className="w-[22%] px-2 py-3">Company</th>
                  <th className="w-[10%] px-2 py-3 text-center">Rating</th>
                  <th className="w-[9%] px-2 py-3 text-center">Visits</th>
                  <th className="w-[9%] px-2 py-3 text-center">Reviews</th>
                  <th className="w-[11%] px-2 py-3 text-center">Engagement Score</th>
                  <th className="w-[120px] px-3 py-3 pr-4 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {top5.map((row, idx) => (
                  <tr key={row.id} className="border-t border-[#e2e8f0] transition hover:bg-violet-50/50">
                    <td className="px-3 py-3 pl-4 align-middle">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-xs font-black text-white shadow-sm">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-1 py-2 align-middle">
                      <ListingThumb src={row.heroImage} className="h-11 w-11" />
                    </td>
                    <td className="min-w-0 px-2 py-2 align-middle">
                      <p className="truncate font-semibold text-[#0f172a]">{row.name}</p>
                    </td>
                    <td className="min-w-0 px-2 py-2 align-middle">
                      <p className="truncate text-[#64748b]">{row.companyName}</p>
                    </td>
                    <td className="px-2 py-2 text-center align-middle">
                      <span className="font-semibold text-amber-600 tabular-nums">
                        {row.reviewCount > 0 ? row.avgRating.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center align-middle tabular-nums text-[#0f172a]">{row.visitCount}</td>
                    <td className="px-2 py-2 text-center align-middle tabular-nums text-[#0f172a]">{row.reviewCount}</td>
                    <td className="px-2 py-2 text-center align-middle">
                      <span className="font-bold tabular-nums text-violet-800">{Math.round(row.popularityScore)}</span>
                    </td>
                    <td className="px-3 py-2 pr-4 text-right align-middle">
                      <Link
                        to={marketplaceListingPath(row.slug)}
                        className="inline-flex min-h-[32px] items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-3 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                      >
                        View listing
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className={`${CARD} flex min-h-[380px] flex-col overflow-hidden p-0 lg:min-h-[400px]`}>
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-[#e2e8f0] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">Recent Activity</h2>
              <p className="mt-0.5 text-xs text-[#64748b]">Latest 10 storefront, listing, partner, and review events.</p>
            </div>
            <Link
              to="/admin/activity"
              className="inline-flex min-h-[32px] shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3 text-[11px] font-bold text-violet-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            >
              View All Activity
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                <tr>
                  <th className="w-[13%] px-3 py-2.5 pl-4">User</th>
                  <th className="w-[14%] px-2 py-2.5">Action</th>
                  <th className="w-[18%] px-2 py-2.5">Company</th>
                  <th className="w-[30%] px-2 py-2.5">Listing</th>
                  <th className="w-[25%] px-3 py-2.5 pr-4 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#64748b]">
                      No activity yet.
                    </td>
                  </tr>
                ) : (
                  activity.map((row) => (
                    <tr key={`${row.kind}-${row.id}`} className="border-t border-[#e2e8f0] align-middle transition hover:bg-violet-50/40">
                      <td className="max-w-0 px-3 py-2.5 pl-4">
                        <span className="block truncate font-medium text-[#0f172a]" title={row.user}>
                          {row.user}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <ActionBadge action={row.action} />
                      </td>
                      <td className="max-w-0 px-2 py-2.5">
                        <span className="block truncate text-[#64748b]" title={row.company}>
                          {row.company}
                        </span>
                      </td>
                      <td className="max-w-0 px-2 py-2.5">
                        <span className="block truncate text-[#64748b]" title={row.listing}>
                          {row.listing}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 pr-4 text-left text-xs tabular-nums text-[#64748b]">
                        {formatShortTime(row.time)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${CARD} flex min-h-[380px] flex-col p-0 lg:min-h-[400px]`}>
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-[#e2e8f0] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">Recent Reviews</h2>
              <p className="mt-0.5 text-xs text-[#64748b]">Newest 5 submissions.</p>
            </div>
            <Link
              to="/admin/reviews"
              className="inline-flex min-h-[32px] shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3 text-[11px] font-bold text-violet-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            >
              View All Reviews
            </Link>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
            {recentReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-4 py-10 text-center">
                <FiStar className="h-8 w-8 text-[#cbd5e1]" aria-hidden />
                <p className="mt-2 text-sm font-semibold text-[#0f172a]">No reviews yet</p>
                <p className="mt-1 max-w-[16rem] text-xs text-[#64748b]">Reviews will appear here after users submit them on listings.</p>
              </div>
            ) : (
              recentReviews.map((r) => (
                <article
                  key={r.id}
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 shadow-sm transition hover:border-violet-200 hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-1.5">
                    <p className="text-xs font-bold text-[#0f172a]">{r.userName || "Member"}</p>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-900">
                      Verified
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#64748b]">
                    {r.itemName} · {r.companyName}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">{r.rating}★</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-[#334155]">{r.comment || "—"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] tabular-nums text-[#94a3b8]">{formatShortTime(r.timestamp)}</span>
                    {slugByProductId.get(String(r.itemId)) ? (
                      <Link
                        to={marketplaceListingPath(slugByProductId.get(String(r.itemId)))}
                        className="text-[11px] font-bold text-violet-700 underline-offset-2 hover:underline"
                      >
                        View listing
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-[#0f172a]">Top 5 by Company</h2>
          <ScoreTip />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {COMPANY_IDS.map((jid) => {
            const label = journeyCompanyIdToPartnerLabel(jid);
            const Icon = COMPANY_ICONS[jid] || FiAward;
            const rows = topByCompany[jid] || [];
            const co = companyAggregatedStats(jid);
            return (
              <div key={jid} className={`${CARD} flex h-full min-h-[380px] flex-col p-4 sm:p-5`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/90 to-cyan-600/90 text-white shadow-md">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold leading-tight text-[#0f172a]">{label}</h3>
                    <dl className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-[#64748b]">
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">Avg</dt>
                        <dd className="font-bold text-amber-600 tabular-nums text-[#0f172a]">
                          {co.hasRating ? co.avgRating.toFixed(1) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">Visits</dt>
                        <dd className="font-bold tabular-nums text-[#0f172a]">{co.visits}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">Reviews</dt>
                        <dd className="font-bold tabular-nums text-[#0f172a]">{co.reviewCount}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2">
                  {rows.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#64748b]">No ranked listings yet.</p>
                  ) : (
                    <ol className="space-y-2">
                      {rows.map((row, idx) => (
                        <li
                          key={row.id}
                          className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-[11px] transition hover:border-violet-200"
                        >
                          <span className="w-5 shrink-0 text-center font-black text-violet-700">{idx + 1}</span>
                          <ListingThumb src={row.heroImage} className="h-8 w-8 rounded-md" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[#0f172a]">{row.name}</p>
                            <p className="truncate text-[10px] text-[#64748b]">
                              {row.reviewCount > 0 ? `${row.avgRating.toFixed(1)}★` : "No rating"} · {row.visitCount} visits ·{" "}
                              {row.reviewCount} reviews
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={`${CARD} overflow-hidden p-0`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 text-violet-700 ring-1 ring-violet-100">
              <FiBarChart2 className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-[#0f172a]">Listing Analytics</h2>
                <ScoreTip />
              </div>
              <p className="text-xs text-[#64748b]">Top listings by engagement score across the marketplace.</p>
            </div>
          </div>
          <Link
            to="/admin/listings"
            className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-xs font-bold text-violet-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
          >
            View Full Listing Analytics
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="w-[20%] px-3 py-3">Company</th>
                <th className="w-16 px-2 py-3 text-center">Visits</th>
                <th className="w-16 px-2 py-3 text-center">Reviews</th>
                <th className="w-24 px-2 py-3 text-center">Avg Rating</th>
                <th className="w-[7.5rem] px-2 py-3 text-center">Engagement Score</th>
                <th className="w-[100px] px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {listingPreview.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#64748b]">
                    No listings yet.
                  </td>
                </tr>
              ) : (
                listingPreview.map((r) => (
                  <tr key={r.id} className="border-t border-[#e2e8f0] transition hover:bg-violet-50/40">
                    <td className="px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <ListingThumb src={r.heroImage} className="h-9 w-9" />
                        <span className="truncate font-semibold text-[#0f172a]">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="line-clamp-2 break-words text-xs text-[#64748b]">{displayCompanyName(r.companySlug)}</span>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[#0f172a]">{r.analyticsVisits}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[#0f172a]">{r.analyticsReviewCount}</td>
                    <td className="px-2 py-2.5 text-center text-amber-700 tabular-nums">
                      {r.analyticsReviewCount > 0 ? r.analyticsAvgRating.toFixed(1) : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold tabular-nums text-violet-800">{Math.round(r.rankingScore)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={marketplaceListingPath(r.slug)}
                        className="text-xs font-bold text-violet-700 underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
