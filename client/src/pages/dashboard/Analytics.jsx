import { useEffect, useMemo, useState } from "react";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { subscribeAnalyticsUpdated } from "../../lib/fusionhubAnalytics.js";
import {
  countLocalReviewsForUser,
  getMarketplaceTrackingUserKey,
  journeyCompanyIdToPartnerLabel,
  readVisitsFiltered,
} from "../../lib/marketplaceUserTracking.js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

const EMPTY_SUM = {
  stats: {
    totalVisits: 0,
    companiesVisited: 0,
    productsVisited: 0,
    reviewsWritten: 0,
    favorites: 0,
  },
  visitsByCompany: [],
  visitHeatmap: [],
};

function localYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalize DB or ISO strings to YYYY-MM-DD for charting. */
function canonicalDayKey(raw) {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim();
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return localYmd(new Date(t));
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

function normalizeHeatmap(heatmap) {
  if (!Array.isArray(heatmap)) return [];
  return heatmap
    .map((h) => ({
      d: canonicalDayKey(h.d),
      n: Number(h.n) || 0,
    }))
    .filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.d));
}

/** Last N calendar days (local), including zeros so line/bar charts read as a real series. */
function fillDailySeries(heatmap, daysBack = 14) {
  const byKey = new Map(normalizeHeatmap(heatmap).map((h) => [h.d, h.n]));
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = daysBack - 1; i >= 0; i -= 1) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - i);
    const key = localYmd(dt);
    out.push({ d: key, n: byKey.get(key) || 0 });
  }
  return out;
}

function formatDayTick(iso) {
  const k = canonicalDayKey(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return "";
  const [, month, day] = k.split("-");
  return `${month}/${day}`;
}

/** When the API has no visit rows yet, derive listing-visit stats from browser analytics (same source as Explore). */
function buildLocalListingVisitSummary(userKey) {
  if (!userKey) return null;
  const rows = readVisitsFiltered(userKey).filter(
    (v) => v.visitType === "product" && v.numericItemId != null,
  );
  if (rows.length === 0) return null;
  const productIds = new Set();
  const companyIds = new Set();
  const byCo = new Map();
  for (const v of rows) {
    productIds.add(String(v.numericItemId));
    if (v.companyId) companyIds.add(v.companyId);
    const name =
      (v.companyName && String(v.companyName).trim()) ||
      journeyCompanyIdToPartnerLabel(v.companyId) ||
      "Partner";
    byCo.set(name, (byCo.get(name) || 0) + 1);
  }
  const visitsByCompany = [...byCo.entries()]
    .map(([companyName, visits]) => ({ companyName, visits }))
    .sort((a, b) => b.visits - a.visits);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 20);
  cutoff.setHours(0, 0, 0, 0);
  const byDay = new Map();
  for (const v of rows) {
    if (!v.timestamp) continue;
    const dt = new Date(v.timestamp);
    if (Number.isNaN(dt.getTime()) || dt < cutoff) continue;
    const key = localYmd(dt);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  const visitHeatmap = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, n]) => ({ d, n }));
  return {
    stats: {
      totalVisits: rows.length,
      companiesVisited: companyIds.size,
      productsVisited: productIds.size,
      reviewsWritten: countLocalReviewsForUser(userKey),
    },
    visitsByCompany,
    visitHeatmap,
  };
}

function mergeSummaryForDisplay(serverSum, user) {
  const base = serverSum && typeof serverSum === "object" ? serverSum : EMPTY_SUM;
  const st = base.stats || EMPTY_SUM.stats;
  const serverTotal = Number(st.totalVisits) || 0;
  const serverByCo = Array.isArray(base.visitsByCompany) ? base.visitsByCompany : [];
  const serverHasVisits = serverTotal > 0 || serverByCo.some((r) => Number(r.visits) > 0);

  const userKey = user ? getMarketplaceTrackingUserKey(user) : null;
  const local = userKey ? buildLocalListingVisitSummary(userKey) : null;

  const favorites = Number(st.favorites) || 0;
  const serverReviews = Number(st.reviewsWritten) || 0;

  if (serverHasVisits || !local) {
    return {
      preferLocalVisitFallback: false,
      stats: {
        totalVisits: serverTotal,
        companiesVisited: Number(st.companiesVisited) || 0,
        productsVisited: Number(st.productsVisited) || 0,
        reviewsWritten: serverReviews,
        favorites,
      },
      visitsByCompany: serverByCo.map((r) => ({
        ...r,
        visits: Number(r.visits) || 0,
      })),
      visitHeatmap: normalizeHeatmap(Array.isArray(base.visitHeatmap) ? base.visitHeatmap : []),
    };
  }

  return {
    preferLocalVisitFallback: true,
    stats: {
      totalVisits: local.stats.totalVisits,
      companiesVisited: local.stats.companiesVisited,
      productsVisited: local.stats.productsVisited,
      reviewsWritten: Math.max(serverReviews, local.stats.reviewsWritten),
      favorites,
    },
    visitsByCompany: local.visitsByCompany,
    visitHeatmap: normalizeHeatmap(local.visitHeatmap || []),
  };
}

export default function DashboardAnalytics() {
  const { user } = useAuth();
  const [sum, setSum] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => subscribeAnalyticsUpdated(() => setRefreshKey((k) => k + 1)), []);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/user/summary")
      .then((d) => {
        if (!cancelled) {
          setSum(d && typeof d === "object" ? d : EMPTY_SUM);
          setFetchedAt(new Date());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSum(EMPTY_SUM);
          setFetchedAt(new Date());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const display = useMemo(() => mergeSummaryForDisplay(sum, user), [sum, user, refreshKey]);
  const preferLocalVisitFallback = Boolean(display.preferLocalVisitFallback);

  if (!sum) {
    return <div className="text-sm text-[#6B7280]">Loading your stats…</div>;
  }

  const stats = display.stats || EMPTY_SUM.stats;
  const companiesVisited = Number(stats.companiesVisited) || 0;
  const productsVisited = Number(stats.productsVisited) || 0;
  const reviewsWritten = Number(stats.reviewsWritten) || 0;
  const totalVisits = Number(stats.totalVisits) || 0;
  const favorites = Number(stats.favorites) || 0;

  const visitsByCompanyRaw = display.visitsByCompany || [];
  const visitsByCompany = visitsByCompanyRaw.map((r) => ({
    ...r,
    visits: Number(r.visits) || 0,
    nameShort:
      String(r.companyName || "").length > 16
        ? `${String(r.companyName).slice(0, 14)}…`
        : String(r.companyName || "—"),
  }));

  const heatmapSorted = normalizeHeatmap(display.visitHeatmap).sort((a, b) => a.d.localeCompare(b.d));
  const dailySeries = fillDailySeries(heatmapSorted, 14);
  const chartDaily = dailySeries.map((h) => ({
    label: formatDayTick(h.d),
    fullDate: h.d,
    visits: h.n,
    v: h.n,
  }));
  const hasAnyVisitDay = dailySeries.some((x) => x.n > 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Analytics</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#111827]">Your marketplace activity</h1>
        <p className="mt-2 max-w-xl text-sm text-[#6B7280]">
          These numbers match your <span className="font-semibold text-slate-700">Home</span> dashboard: visits,
          companies and listings you&apos;ve opened, reviews you&apos;ve posted, and saved favorites.
          {fetchedAt ? (
            <>
              {" "}
              Last updated{" "}
              {fetchedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}.
            </>
          ) : null}{" "}
          They update automatically when you browse listings while signed in.
        </p>
        {preferLocalVisitFallback ? (
          <p className="mt-2 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Visit totals below include <strong>listing views stored in this browser</strong> because the API has no visit
            rows yet. Open listings while signed in and they will sync to the database; then these numbers match the API
            exactly.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Total visits",
            value: totalVisits,
            ring: "border-violet-200/90",
            bg: "bg-gradient-to-b from-violet-50 via-white to-violet-50/30",
          },
          {
            label: "Companies explored",
            value: companiesVisited,
            ring: "border-cyan-200/90",
            bg: "bg-gradient-to-b from-cyan-50 via-white to-cyan-50/30",
          },
          {
            label: "Distinct services",
            value: productsVisited,
            ring: "border-indigo-200/90",
            bg: "bg-gradient-to-b from-indigo-50 via-white to-indigo-50/30",
          },
          {
            label: "Reviews authored",
            value: reviewsWritten,
            ring: "border-fuchsia-200/90",
            bg: "bg-gradient-to-b from-fuchsia-50 via-white to-fuchsia-50/30",
          },
          {
            label: "Pinned favorites",
            value: favorites,
            ring: "border-amber-200/90",
            bg: "bg-gradient-to-b from-amber-50 via-white to-amber-50/30",
          },
        ].map(({ label, value, ring, bg }) => (
          <div
            key={label}
            className={`flex min-h-[128px] flex-col items-center justify-center rounded-2xl border ${ring} ${bg} px-3 py-5 text-center shadow-[0_10px_36px_-24px_rgba(15,23,42,0.35)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-22px_rgba(91,33,182,0.2)]`}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</div>
            <div className="mt-3 font-display text-3xl font-bold tabular-nums tracking-tight text-slate-900">
              <AnimatedNumber value={value} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Visits by company</div>
          <p className="mt-1 text-xs text-slate-500">How many listing opens you&apos;ve logged with each partner.</p>
          <div className="mt-6 h-[300px] w-full">
            {visitsByCompany.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 text-center text-sm text-slate-500">
                No listing visits yet. Sign in and open products from{" "}
                <span className="font-semibold text-slate-700"> Explore</span> (drawer) or a listing page — activity
                appears here and syncs to your account.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitsByCompany} margin={{ bottom: 8, left: 0, right: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="nameShort"
                    stroke="#64748b"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      color: "#111827",
                    }}
                    formatter={(value) => [`${value}`, "Visits"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.companyName ?? ""}
                  />
                  <defs>
                    <linearGradient id="uxBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="visits" radius={[18, 18, 0, 0]} fill="url(#uxBar)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Visits by day</div>
          <p className="mt-1 text-xs text-slate-500">Last 14 days (your local calendar). Days with no visits show as 0.</p>
          <div className="mt-6 h-[300px] w-full">
            {!hasAnyVisitDay ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 text-center text-sm text-slate-500">
                No listing visits recorded in the last 14 days. Browse the marketplace while signed in to build this
                chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDaily} margin={{ bottom: 8, left: 0, right: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 9 }} interval={2} />
                  <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      color: "#111827",
                    }}
                    formatter={(value) => [`${value}`, "Listing visits"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
                  />
                  <defs>
                    <linearGradient id="heatBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="visits" radius={[10, 10, 0, 0]} fill="url(#heatBar)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Visit trend</div>
        <p className="mt-1 text-xs text-slate-500">Same daily counts as above, shown as a line for the last 14 days.</p>
        <div className="mt-6 h-[260px] w-full">
          {!hasAnyVisitDay ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 text-center text-sm text-slate-500">
              Trend appears after you have at least one listing visit in the last two weeks.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDaily} margin={{ bottom: 8, left: 0, right: 8 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 9 }} interval={2} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    color: "#111827",
                  }}
                  formatter={(value) => [`${value}`, "Visits"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#EC4899" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
