import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiEye,
  FiHeart,
  FiLayers,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiRadio,
  FiShoppingBag,
} from "react-icons/fi";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import { useCatalog } from "../../context/CatalogContext.jsx";
import { apiFetch } from "../../lib/api.js";
import { marketplaceListingPath } from "../../lib/marketplaceDisplay.js";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function formatActivityTime(iso) {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    };
  } catch {
    return { date: "", time: "" };
  }
}

function formatVisitChartDay(d) {
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(d ?? "");
  }
}

function Thumbnail({ src, className }) {
  const [hide, setHide] = useState(false);
  if (!src || hide) {
    return (
      <div
        className={`shrink-0 bg-gradient-to-br from-violet-100 via-slate-100 to-cyan-100 ring-1 ring-slate-200/80 ${className}`}
        aria-hidden
      />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={`shrink-0 object-cover ring-1 ring-slate-200/80 ${className}`}
      onError={() => setHide(true)}
    />
  );
}

const METRIC_ACCENTS = ["violet", "cyan", "fuchsia", "indigo", "teal"];
const METRIC_ICONS = [FiEye, FiShoppingBag, FiLayers, FiMessageCircle, FiHeart];
const CHART_COLORS = ["#7C3AED", "#06B6D4", "#EC4899", "#A855F7", "#6366F1"];

function MetricCard({ label, helper, value, index }) {
  const accent = METRIC_ACCENTS[index % METRIC_ACCENTS.length];
  const Icon = METRIC_ICONS[index % METRIC_ICONS.length];
  const borderAccent =
    accent === "violet"
      ? "border-violet-200/90 from-violet-50/80"
      : accent === "cyan"
        ? "border-cyan-200/90 from-cyan-50/80"
        : accent === "fuchsia"
          ? "border-fuchsia-200/90 from-fuchsia-50/80"
          : accent === "indigo"
            ? "border-indigo-200/90 from-indigo-50/80"
            : "border-teal-200/90 from-teal-50/80";

  return (
    <div
      className={`relative flex min-w-0 flex-col rounded-2xl border bg-gradient-to-b to-white p-4 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.18)] ring-1 ring-slate-100/90 ${borderAccent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 ${
            accent === "violet"
              ? "text-violet-600"
              : accent === "cyan"
                ? "text-cyan-600"
                : accent === "fuchsia"
                  ? "text-fuchsia-600"
                  : accent === "indigo"
                    ? "text-indigo-600"
                    : "text-teal-600"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight text-slate-900">
        <AnimatedNumber value={value} />
      </div>
      <p className="mt-2 text-xs leading-snug text-slate-600">{helper}</p>
    </div>
  );
}

const PERSONALIZATION_SIGNALS = [
  {
    title: "Visited listings",
    body: "Products and services you open help us understand your interests.",
  },
  {
    title: "Saved favorites",
    body: "Items you save are used as strong signals for future recommendations.",
  },
  {
    title: "Review activity",
    body: "Ratings and reviews help identify categories and companies you prefer.",
  },
  {
    title: "Company interest",
    body: "Repeated visits to the same partner company increase related recommendations.",
  },
];

export default function DashboardHome() {
  const [sum, setSum] = useState(null);
  const { searchProducts } = useCatalog();

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/user/summary")
      .then((d) => {
        if (!cancelled) setSum(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogFallbackPicks = useMemo(() => {
    const list = Array.isArray(searchProducts) ? searchProducts : [];
    const out = [];
    const seen = new Set();
    for (const p of list) {
      const id = Number(p?.id);
      if (!Number.isFinite(id) || seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        name: p.name,
        companyName: p.companyName ?? "Partner",
        heroImage: p.heroImage,
        slug: p.slug ?? null,
        reasonLabel: "Curated catalog pick",
      });
      if (out.length >= 5) break;
    }
    return out;
  }, [searchProducts]);

  if (!sum) {
    return (
      <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white text-slate-500 shadow-sm">
        <FiActivity className="h-8 w-8 animate-pulse text-violet-400" aria-hidden />
        <p className="text-sm font-medium">Loading marketplace command center…</p>
      </div>
    );
  }

  const hasCompanyVisits = Array.isArray(sum.visitsByCompany) && sum.visitsByCompany.length > 0;
  const pieData = hasCompanyVisits
    ? sum.visitsByCompany.map((c) => ({ name: c.companyName, value: c.visits }))
    : [];

  const areaData = [...(sum.visitHeatmap || [])]
    .sort((a, b) => new Date(a.d) - new Date(b.d))
    .map((h) => ({
      dayLabel: formatVisitChartDay(h.d),
      n: Number(h.n),
    }));

  const recentVisits = Array.isArray(sum.recentVisits) ? sum.recentVisits : [];
  const trendingServices = Array.isArray(sum.trendingServices) ? sum.trendingServices : [];
  const activityTimeline = Array.isArray(sum.activityTimeline) ? sum.activityTimeline : [];

  const hasHeatmapPoints = areaData.length > 0;
  const visitChartSparse = hasHeatmapPoints && areaData.length < 2;
  const useCatalogRail = trendingServices.length === 0 && catalogFallbackPicks.length > 0;
  const displayRail = useCatalogRail
    ? catalogFallbackPicks
    : trendingServices.map((p) => ({
        id: p.id,
        name: p.name,
        companyName: p.companyName,
        heroImage: p.heroImage,
        slug: p.slug ?? null,
        reasonLabel: "Trending across hub",
      }));

  const metricsSpec = [
    ["Total visits", sum.stats.totalVisits, "All recorded storefront & listing views"],
    ["Companies explored", sum.stats.companiesVisited, "Distinct partners you’ve opened"],
    ["Distinct services", sum.stats.productsVisited, "Unique listings you’ve engaged with"],
    ["Reviews authored", sum.stats.reviewsWritten, "Published feedback you’ve shared"],
    ["Pinned favorites", sum.stats.favorites, "Listings saved to your dashboard"],
  ];

  return (
    <div className="min-w-0 max-w-full space-y-6 pb-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-600 via-violet-700 to-cyan-700 p-6 shadow-[0_20px_50px_-24px_rgba(91,33,182,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-fuchsia-400/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-200" />
              </span>
              Live marketplace data
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Marketplace command center
            </h1>
            <p className="text-sm leading-relaxed text-violet-100 sm:text-[15px]">
              Track your visits, saved listings, reviews, and personalized marketplace recommendations.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              to="/marketplace/explore"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-violet-800 shadow-lg shadow-violet-950/20 transition hover:bg-violet-50"
            >
              Explore marketplace
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/dashboard/top-products"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              View top products
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        {metricsSpec.map(([label, val, helper], i) => (
          <MetricCard key={label} label={label} helper={helper} value={val} index={i} />
        ))}
      </div>

      {/* Analytics */}
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.2)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Visit distribution</div>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Where you spend time</h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">
                Share of your visits across partner companies. Hover slices for exact counts.
              </p>
            </div>
            <span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-800 ring-1 ring-violet-200/80">
              Donut
            </span>
          </div>
          {hasCompanyVisits ? (
            <>
              <div className="mt-4 h-[220px] w-full min-w-0 sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={4}
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v} visits`, ""]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        fontSize: 12,
                        color: "#111827",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {pieData.map((row, i) => (
                  <li
                    key={row.name}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      aria-hidden
                    />
                    <span className="max-w-[140px] truncate">{row.name}</span>
                    <span className="tabular-nums text-slate-500">{row.value}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-gradient-to-b from-violet-50/50 to-white px-6 py-12 text-center">
              <FiBarChart2 className="h-10 w-10 text-violet-400" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-800">No company mix yet</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-600">
                More activity will appear here as you browse partner listings and storefronts.
              </p>
              <Link
                to="/dashboard/companies"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-4 py-2.5 text-xs font-bold text-white shadow-md"
              >
                View companies
              </Link>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.2)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Listing views</div>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Visits over time</h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">
                This chart shows how many marketplace listings you viewed by date.
              </p>
            </div>
            <span className="rounded-lg bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-900 ring-1 ring-cyan-200/80">
              Area
            </span>
          </div>
          {hasHeatmapPoints ? (
            <>
              <div className="mt-4 h-[220px] w-full min-w-0 sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="visHomeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.75} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="dayLabel" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => (typeof label === "string" ? label : "")}
                      formatter={(value) => [`${value}`, "Listings viewed"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        fontSize: 12,
                        color: "#111827",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="n"
                      stroke="#7C3AED"
                      fillOpacity={1}
                      fill="url(#visHomeArea)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {visitChartSparse ? (
                <div className="mt-4 space-y-2 rounded-xl border border-cyan-200/90 bg-cyan-50/90 px-4 py-3 pb-3.5 text-left shadow-sm">
                  {areaData.length === 1 ? (
                    <p className="text-xs font-semibold leading-relaxed text-slate-800">
                      Only one visit date is available right now. More points will appear as you browse on different days.
                    </p>
                  ) : null}
                  <p className="text-xs leading-relaxed text-slate-700">
                    More activity over multiple days will make this trend line more meaningful.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-cyan-200 bg-gradient-to-b from-cyan-50/40 to-white px-6 py-12 text-center">
              <FiActivity className="h-10 w-10 text-cyan-500" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-800">No daily visits in this window yet</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-600">
                More activity will appear here as you browse partner listings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity + recommendations */}
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="flex min-h-[420px] min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Storefront feed</div>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Latest storefront stops</h2>
            </div>
            <FiMapPin className="hidden h-5 w-5 text-violet-400 sm:block" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-slate-600 sm:text-sm">
            Recent listing views from your account — each row opens the product detail you last touched.
          </p>
          <div className="mt-4 flex flex-1 flex-col gap-2.5">
            {recentVisits.length > 0 ? (
              recentVisits.map((v) => {
                const { date, time } = formatActivityTime(v.at);
                return (
                  <Link
                    key={`${v.at}-${v.productId}`}
                    to={`/marketplace/products/${v.productId}`}
                    className="group flex min-h-[4.5rem] min-w-0 gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 p-3 shadow-sm ring-1 ring-slate-100/80 transition hover:border-violet-300 hover:bg-white hover:shadow-md"
                  >
                    <Thumbnail src={v.heroImage} className="h-14 w-[4.5rem] rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900 ring-1 ring-violet-200/70">
                          Visit
                        </span>
                        <span className="text-[10px] font-medium tabular-nums text-slate-400 sm:hidden">
                          {date} · {time}
                        </span>
                      </div>
                      <div className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-violet-900">
                        {v.productName}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-600">{v.companyName}</div>
                    </div>
                    <div className="hidden w-[5.5rem] shrink-0 flex-col items-end justify-center text-right sm:flex">
                      <span className="text-[11px] font-semibold tabular-nums text-slate-700">{date}</span>
                      <span className="text-[10px] tabular-nums text-slate-400">{time}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                <FiPackage className="h-11 w-11 text-slate-400" aria-hidden />
                <p className="mt-3 font-display text-base font-bold text-slate-900">No stops yet</p>
                <p className="mt-1 max-w-xs text-sm text-slate-600">
                  Your recent listing visits will appear here as you explore partner storefronts.
                </p>
                <Link
                  to="/dashboard/companies"
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-5 text-sm font-bold text-white shadow-md"
                >
                  Go to companies
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[420px] min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Recommendations</div>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Recommended next</h2>
            </div>
            <FiRadio className="hidden h-5 w-5 text-cyan-500 sm:block" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-slate-600 sm:text-sm">
            {useCatalogRail
              ? "Live trending data wasn’t available — showing curated catalog picks from FusionHub partners."
              : "Pulse from global marketplace momentum — open any row to view details."}
          </p>
          <div className="mt-4 flex flex-1 flex-col gap-2.5">
            {displayRail.length > 0 ? (
              displayRail.map((p) => {
                const href = p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`;
                return (
                  <div
                    key={p.id}
                    className="flex min-h-[4.5rem] min-w-0 gap-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 p-3 shadow-sm ring-1 ring-slate-100/80 transition hover:border-cyan-300/80 hover:shadow-md"
                  >
                    <Thumbnail src={p.heroImage} className="h-14 w-[4.5rem] rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{p.name}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-600">{p.companyName}</div>
                      <div className="mt-2">
                        <span className="inline-flex rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-900 ring-1 ring-cyan-200/70">
                          {p.reasonLabel}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={href}
                      className="inline-flex h-9 shrink-0 items-center self-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      View
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                <FiShoppingBag className="h-11 w-11 text-slate-400" aria-hidden />
                <p className="mt-3 font-display text-base font-bold text-slate-900">Build your rail</p>
                <p className="mt-1 max-w-xs text-sm text-slate-600">
                  Explore the marketplace to seed recommendations and trending picks.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link
                    to="/marketplace/explore"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-4 text-sm font-bold text-white shadow-md"
                  >
                    Explore
                  </Link>
                  <Link
                    to="/dashboard/top-products"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
                  >
                    Top products
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.16)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Event log</div>
            <h2 className="mt-1 font-display text-lg font-bold text-slate-900">Activity timeline</h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-600 sm:text-sm">
              Visits and reviews from your account, newest first.
            </p>
          </div>
        </div>
        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activityTimeline.length > 0 ? (
            activityTimeline.slice(0, 9).map((a, idx) => {
              const { date, time } = formatActivityTime(a.at);
              const kind = String(a.type).toLowerCase();
              return (
                <div
                  key={`${a.at}-${idx}`}
                  className="flex min-h-[5rem] flex-col justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-sm ring-1 ring-slate-100/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex max-w-[70%] truncate rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                        kind === "review"
                          ? "bg-emerald-50 text-emerald-900 ring-emerald-200/70"
                          : "bg-violet-50 text-violet-900 ring-violet-200/70"
                      }`}
                    >
                      {a.type}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-400">
                      {date} · {time}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-snug text-slate-900">{a.label}</p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center">
              <FiLayers className="h-10 w-10 text-slate-400" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-800">No events in the log yet</p>
              <p className="mt-1 text-xs text-slate-600">Visits and reviews will populate this grid automatically.</p>
            </div>
          )}
        </div>
      </div>

      {/* Personalization explainer */}
      <div className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-cyan-50/70 p-5 shadow-[0_12px_40px_-28px_rgba(91,33,182,0.2)] sm:p-7">
        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
          How FusionHub personalizes your marketplace
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-[15px]">
          FusionHub uses your visits, saved listings, reviews, and partner-company activity to recommend services that
          match your browsing behavior.
        </p>
        <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PERSONALIZATION_SIGNALS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-xl border border-white/80 bg-white/85 p-4 shadow-md shadow-violet-500/5 ring-1 ring-slate-200/70 backdrop-blur-[1px]"
            >
              <span className="text-sm font-bold text-violet-900">{item.title}</span>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/marketplace/explore"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/25"
          >
            Explore marketplace
            <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/dashboard/companies"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-violet-200"
          >
            View companies
          </Link>
        </div>
      </div>
    </div>
  );
}
