import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import PublicShell from "../components/layout/PublicShell.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";
import { apiFetch } from "../lib/api.js";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const TABS = [
  { key: "rating", label: "By Rating" },
  { key: "visits", label: "By Visits" },
  { key: "reviews", label: "By Reviews" },
];

/** Deterministic "random" rank delta in [-2, 2] from product id (per spec). */
function rankDeltaFromProductId(productId) {
  const str = String(productId ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = ((h >>> 0) % 10_000) / 10_000;
  return Math.floor(u * 5) - 2;
}

const COMPANY_GRADIENT = {
  "srikavya-enterprise": "from-amber-500 via-orange-500 to-amber-700",
  krativerse: "from-fuchsia-500 via-purple-600 to-violet-800",
  "travel-agency": "from-sky-400 via-blue-500 to-indigo-700",
  "nexus-academy": "from-emerald-400 via-teal-500 to-emerald-800",
};

function companyGradient(slug) {
  return COMPANY_GRADIENT[slug] || "from-slate-500 to-slate-700";
}

function productPath(p) {
  return p?.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`;
}

function sortCatalog(items, mode) {
  const copy = [...items];
  if (mode === "rating") {
    copy.sort(
      (a, b) =>
        (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0) ||
        (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0),
    );
  } else if (mode === "visits") {
    copy.sort((a, b) => (Number(b.visitCount) || 0) - (Number(a.visitCount) || 0));
  } else {
    copy.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
  }
  return copy;
}

function PodiumBlock({ rank, product, delayMs, heightClass, elevate }) {
  const [grown, setGrown] = useState(false);
  const slug = product?.companySlug;
  const g = companyGradient(slug);

  useEffect(() => {
    setGrown(false);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [product?.id, rank]);

  const rating =
    product && Number(product.reviewCount) > 0 && product.avgRating != null
      ? Number(product.avgRating).toFixed(1)
      : "—";

  const hasProduct = Boolean(product?.name);

  return (
    <div
      className={`flex w-full max-w-[10rem] flex-col items-center sm:max-w-[11rem] ${
        elevate ? "-translate-y-4" : ""
      }`}
    >
      <div className="relative z-10 mb-2 w-full rounded-xl border border-white/20 bg-white/95 px-2 py-2 text-center shadow-md backdrop-blur-sm">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">#{rank}</div>
        {hasProduct ? (
          <>
            <div className="mt-0.5 line-clamp-2 text-xs font-bold leading-tight text-slate-900">{product.name}</div>
            <div className="mt-1 flex items-center justify-center gap-0.5 text-amber-500">
              <span className="text-[11px]" aria-hidden>
                ★
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-slate-700">{rating}</span>
            </div>
            <div className="mt-1 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
              {product.companyName || product.companySlug}
            </div>
          </>
        ) : (
          <div className="mt-1 text-xs font-medium text-slate-400">—</div>
        )}
      </div>
      <div
        className={`w-full rounded-t-xl bg-gradient-to-t ${hasProduct ? g : "from-slate-400 to-slate-600"} shadow-inner transition-all duration-700 ease-out ${
          grown ? heightClass : "h-0"
        }`}
        style={{ transitionDelay: `${delayMs}ms` }}
      />
    </div>
  );
}

function LeaderboardTable({ rows, mode, listOpaque, onRowNavigate }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 transition-opacity duration-150 ${
        listOpaque ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span>Rank</span>
        <span>Listing</span>
        <span className="text-center">Δ</span>
        <span className="text-right">Metric</span>
      </div>
      {rows.map((p, idx) => {
        const rank = idx + 1;
        const delta = rankDeltaFromProductId(p.id);
        const deltaNode =
          delta === 0 ? (
            <span className="text-slate-300">—</span>
          ) : delta > 0 ? (
            <span className="font-semibold text-emerald-600">▲{delta}</span>
          ) : (
            <span className="font-semibold text-rose-600">▼{Math.abs(delta)}</span>
          );
        const rowBg = rank % 2 === 1 ? "bg-white" : "bg-gray-50";
        const metricMain =
          mode === "rating"
            ? Number(p.reviewCount) > 0 && p.avgRating != null
              ? `${Number(p.avgRating).toFixed(1)}★`
              : "—"
            : mode === "visits"
              ? Number(p.visitCount ?? 0).toLocaleString()
              : Number(p.reviewCount ?? 0).toLocaleString();
        const badgeLabel = mode === "rating" ? "Rating" : mode === "visits" ? "Visits" : "Reviews";

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onRowNavigate(p)}
            className={`grid w-full grid-cols-[auto_1fr_auto_1fr] gap-2 border-b border-slate-100 px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:cursor-pointer hover:bg-purple-50 ${rowBg}`}
          >
            <span className="w-8 pt-0.5 text-center text-lg font-black tabular-nums text-violet-700">{rank}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-900">{p.name}</span>
              <span className="block truncate text-xs text-slate-500">{p.companyName}</span>
            </span>
            <span className="flex w-10 items-center justify-center text-sm">{deltaNode}</span>
            <span className="flex flex-col items-end justify-center gap-1 text-right">
              <span className="text-sm font-bold tabular-nums text-slate-900">{metricMain}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                {badgeLabel}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Leaderboards() {
  const { companies } = useCatalog();
  const nav = useNavigate();
  const [boardData, setBoardData] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [tab, setTab] = useState("rating");
  const [listOpaque, setListOpaque] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetch("/api/marketplace/leaderboards"), apiFetch("/api/marketplace/catalog")])
      .then(([lb, cat]) => {
        if (cancelled) return;
        setBoardData(lb);
        setCatalogItems(Array.isArray(cat?.items) ? cat.items : []);
      })
      .catch(() => {
        if (!cancelled) {
          setBoardData(null);
          setCatalogItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedTop10 = useMemo(() => sortCatalog(catalogItems, tab).slice(0, 10), [catalogItems, tab]);

  const podiumSlots = useMemo(() => {
    const top = sortedTop10;
    const second = top[1];
    const first = top[0];
    const third = top[2];
    return [
      { rank: 2, product: second, delayMs: 100, heightClass: "h-24", elevate: false },
      { rank: 1, product: first, delayMs: 300, heightClass: "h-36", elevate: true },
      { rank: 3, product: third, delayMs: 200, heightClass: "h-16", elevate: false },
    ];
  }, [sortedTop10]);

  const onTabChange = useCallback((key) => {
    if (key === tab) return;
    setListOpaque(false);
    window.setTimeout(() => {
      setTab(key);
      setListOpaque(true);
    }, 150);
  }, [tab]);

  const onRowNavigate = useCallback(
    (p) => {
      nav(productPath(p));
    },
    [nav],
  );

  const chartData = useMemo(
    () =>
      sortCatalog(catalogItems, "visits")
        .slice(0, 8)
        .map((p) => ({
          name: p.name.slice(0, 18),
          visits: Number(p.visitCount) || 0,
        })),
    [catalogItems],
  );

  const miniCompanies = useMemo(() => companies.slice(0, 4), [companies]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Live leaderboards
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
            Top listings by rating, visits, and reviews. Rankings use the full marketplace catalog.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-1 border-b-2 border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={`mb-[-2px] border-b-2 px-4 py-3 text-sm transition-colors ${
                tab === t.key
                  ? "border-purple-600 font-bold text-purple-700"
                  : "border-transparent font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className="mt-10">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-slate-900">Podium</h2>
            <FiAward className="text-violet-600" aria-hidden />
          </div>
          <GlassCard className="overflow-hidden p-6 sm:p-10" hover={false}>
            <div className="flex items-end justify-center gap-4 sm:gap-8">
              {podiumSlots.map((s) => (
                <PodiumBlock
                  key={`${tab}-${s.rank}-${s.product?.id ?? "empty"}`}
                  rank={s.rank}
                  product={s.product}
                  delayMs={s.delayMs}
                  heightClass={s.heightClass}
                  elevate={s.elevate}
                />
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-slate-900">Top 10</h2>
          <p className="mt-1 text-sm text-slate-500">Click a row to open the listing.</p>
          <div className="mt-4">
            {sortedTop10.length > 0 ? (
              <LeaderboardTable
                rows={sortedTop10}
                mode={tab}
                listOpaque={listOpaque}
                onRowNavigate={onRowNavigate}
              />
            ) : (
              <p className="text-sm text-slate-500">Load the catalog to see rankings.</p>
            )}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-slate-900">Per company · #1 pick</h2>
          <p className="mt-1 text-sm text-slate-500">Each partner&apos;s current top listing from engagement rankings.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {miniCompanies.map((c) => {
              const top = boardData?.perCompany?.[String(c.id)]?.[0];
              const g = companyGradient(c.slug);
              const rating =
                top && Number(top.reviewCount) > 0 && top.avgRating != null
                  ? Number(top.avgRating).toFixed(1)
                  : "—";
              return (
                <div
                  key={c.slug}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${g} p-5 text-white shadow-lg`}
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-white/80">{c.name}</div>
                  {top ? (
                    <>
                      <div className="mt-2 font-display text-lg font-bold leading-snug">{top.name}</div>
                      <div className="mt-2 flex items-center gap-1 text-amber-200">
                        <span aria-hidden>★</span>
                        <span className="text-sm font-semibold tabular-nums">{rating}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-white/85">No ranked listing yet.</p>
                  )}
                  <Link
                    to={`/marketplace/companies/${c.slug}`}
                    className="mt-4 inline-flex text-sm font-bold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
                  >
                    See full Top 5 →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-14">
          <GlassCard className="p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Momentum viz</div>
            <div className="mt-2 font-display text-xl font-bold text-[#111827]">Visits by listing</div>
            <div className="mt-6 h-[280px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        color: "#111827",
                      }}
                    />
                    <Bar dataKey="visits" radius={[10, 10, 0, 0]} fill="url(#barGradLeader)" />
                    <defs>
                      <linearGradient id="barGradLeader" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">No visit data to chart yet.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </PublicShell>
  );
}
