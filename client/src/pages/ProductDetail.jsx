import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiHeart } from "react-icons/fi";
import PublicShell from "../components/layout/PublicShell.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getProductAnalytics,
  getProductReviewDetail,
  readAnalyticsReviews,
  readAnalyticsVisits,
  subscribeAnalyticsUpdated,
} from "../lib/fusionhubAnalytics.js";
import {
  apiCompanySlugToJourneyCompanyId,
  appendCompanySurfaceVisit,
  appendMarketplaceVisit,
  consumeSessionOnceKey,
  getMarketplaceTrackingUserKey,
  partnerOriginalWebsiteUrl,
  partnerStorefrontPath,
  trackingDisplayFirstName,
} from "../lib/marketplaceUserTracking.js";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";
import ReviewModal from "../components/reviews/ReviewModal.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";

const tabs = ["Overview", "Reviews", "Activity"];

const LS_REVIEW_HELPFUL = "fh_review_helpful_v1";

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-violet-500 to-fuchsia-600",
  "bg-gradient-to-br from-sky-500 to-indigo-600",
  "bg-gradient-to-br from-amber-500 to-rose-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-orange-500 to-red-600",
  "bg-gradient-to-br from-cyan-500 to-blue-600",
];

function easeOutQuart(t) {
  return 1 - (1 - t) ** 4;
}

function hashToIndex(str, mod) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return mod ? h % mod : 0;
}

function readHelpfulMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_REVIEW_HELPFUL);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeHelpfulMap(map) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_REVIEW_HELPFUL, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function initialsFromName(name) {
  const parts = String(name || "Member")
    .trim()
    .split(/\s+/);
  const a = parts[0]?.[0] || "M";
  const b = parts.length > 1 ? parts[1][0] : "";
  return (a + b).toUpperCase().slice(0, 2);
}

function reviewerVisitedCompany(reviewUserId, companyId) {
  if (!reviewUserId || !companyId) return false;
  return readAnalyticsVisits().some((v) => v.userId === reviewUserId && v.companyId === companyId);
}

function listingPath(p) {
  if (p?.slug) return `/marketplace/listing/${encodeURIComponent(p.slug)}`;
  return `/marketplace/products/${p.id}`;
}

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewQueryConsumed = useRef(false);
  const { isAuthenticated, user } = useAuth();
  const { recordReview } = useMarketplaceUserTracking(user, isAuthenticated);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [favIds, setFavIds] = useState(() => new Set());
  const [lsTick, setLsTick] = useState(0);
  const [catalogItems, setCatalogItems] = useState([]);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewStarFilter, setReviewStarFilter] = useState(null);
  const [feedSort, setFeedSort] = useState("newest");
  const [feedStarFilter, setFeedStarFilter] = useState(null);
  const [feedOpaque, setFeedOpaque] = useState(true);
  const [countAnim, setCountAnim] = useState(0);
  const [starsReveal, setStarsReveal] = useState(false);
  const [barWidths, setBarWidths] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState(() => readHelpfulMap());
  const carouselRef = useRef(null);
  const [optimisticStats, setOptimisticStats] = useState(null);
  const feedFilterSkip = useRef(true);
  const countAnimRef = useRef(0);

  useEffect(() => {
    reviewQueryConsumed.current = false;
  }, [id]);

  useEffect(() => {
    const off = subscribeAnalyticsUpdated(() => setLsTick((t) => t + 1));
    return off;
  }, []);

  useEffect(() => {
    setHelpfulMap(readHelpfulMap());
  }, [lsTick]);

  useEffect(() => {
    if (!data || !isAuthenticated || reviewQueryConsumed.current) return;
    if (searchParams.get("review") !== "1") return;
    reviewQueryConsumed.current = true;
    setReviewOpen(true);
    setTab("Reviews");
    const next = new URLSearchParams(searchParams);
    next.delete("review");
    setSearchParams(next, { replace: true });
  }, [data, isAuthenticated, searchParams, setSearchParams]);

  const reload = useCallback(async () => {
    const p = await apiFetch(`/api/marketplace/products/${id}`, { method: "GET" });
    setData(p);
  }, [id]);

  const lsProductStats = useMemo(() => getProductAnalytics(Number(id)), [id, lsTick]);
  const lsReviewDetail = useMemo(() => getProductReviewDetail(Number(id)), [id, lsTick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch {
        /* handled by empty state */
      }
    })();
    if (isAuthenticated) {
      apiFetch("/api/marketplace/favorites")
        .then((rows) => {
          if (cancelled) return;
          setFavIds(new Set(rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n))));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, reload]);

  useEffect(() => {
    const p = data?.product;
    if (!p?.companySlug || !isAuthenticated || !user || p.id == null) return;
    const uk = getMarketplaceTrackingUserKey(user);
    if (!uk || !consumeSessionOnceKey(`${uk}|product|${p.id}`)) return;
    appendMarketplaceVisit({
      user,
      hubFirstName: trackingDisplayFirstName(user),
      companySlug: p.companySlug,
      action: "view_details",
      itemSlug: p.slug ?? null,
      numericItemId: p.id,
      itemName: p.name,
      path: `/marketplace/products/${p.id}`,
    });
  }, [data?.product, isAuthenticated, user]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/marketplace/catalog")
      .then((d) => {
        if (!cancelled) setCatalogItems(Array.isArray(d?.items) ? d.items : []);
      })
      .catch(() => {
        if (!cancelled) setCatalogItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setStarsReveal(false);
    const r = requestAnimationFrame(() => setStarsReveal(true));
    return () => cancelAnimationFrame(r);
  }, [id, data?.ratingStats?.count, lsReviewDetail.count]);

  useEffect(() => {
    setBarWidths(false);
    const t = requestAnimationFrame(() => setBarWidths(true));
    return () => cancelAnimationFrame(t);
  }, [id, isAuthenticated, data?.product?.id]);

  const isFav = useMemo(() => favIds.has(Number(id)), [favIds, id]);

  async function toggleFav() {
    if (!isAuthenticated) {
      nav("/login");
      return;
    }
    const pid = Number(id);
    try {
      if (isFav) {
        await apiFetch(`/api/marketplace/favorites/${pid}`, { method: "DELETE" });
        setFavIds((s) => {
          const n = new Set(s);
          n.delete(pid);
          return n;
        });
      } else {
        await apiFetch(`/api/marketplace/favorites/${pid}`, { method: "POST" });
        setFavIds((s) => new Set(s).add(pid));
      }
      await reload();
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (feedFilterSkip.current) {
      feedFilterSkip.current = false;
      return undefined;
    }
    setFeedOpaque(false);
    const t = window.setTimeout(() => {
      setFeedSort(reviewSort);
      setFeedStarFilter(reviewStarFilter);
      setFeedOpaque(true);
    }, 300);
    return () => window.clearTimeout(t);
  }, [reviewSort, reviewStarFilter]);

  const ratingStats = data?.ratingStats;
  const serverCount = Number(ratingStats?.count ?? 0);
  const serverAvg = Number(ratingStats?.average ?? 0);
  const lsCount = lsReviewDetail.count;
  const lsAvg = Number(lsReviewDetail.avg || 0);
  const displayReviewCount = Math.max(serverCount, lsCount);
  let displayAvg = 0;
  if (displayReviewCount > 0) {
    if (optimisticStats) {
      displayAvg = optimisticStats.avg;
    } else if (lsCount > serverCount) {
      displayAvg = lsAvg;
    } else if (serverCount > 0) {
      displayAvg = serverAvg;
    } else {
      displayAvg = lsAvg;
    }
  }

  const countTarget = optimisticStats ? optimisticStats.count : displayReviewCount;

  useEffect(() => {
    countAnimRef.current = 0;
    setCountAnim(0);
  }, [id]);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    let rafId = 0;
    const from = countAnimRef.current;
    const to = countTarget;
    const tick = (now) => {
      const u = Math.min(1, (now - start) / duration);
      const te = easeOutQuart(u);
      const v = Math.round(from + (to - from) * te);
      setCountAnim(v);
      if (u < 1) rafId = requestAnimationFrame(tick);
      else {
        countAnimRef.current = to;
        setCountAnim(to);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [countTarget, id]);

  const allReviewsRaw = useMemo(() => {
    const pid = String(id);
    return readAnalyticsReviews()
      .filter((r) => String(r.itemId) === pid)
      .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
  }, [id, lsTick]);

  const displayedReviews = useMemo(() => {
    let rows = [...allReviewsRaw];
    if (feedStarFilter != null) {
      rows = rows.filter((r) => r.rating === feedStarFilter);
    }
    const helpful = helpfulMap;
    if (feedSort === "newest") {
      rows.sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    } else if (feedSort === "highest") {
      rows.sort((a, b) => b.rating - a.rating || String(b.timestamp).localeCompare(String(a.timestamp)));
    } else if (feedSort === "lowest") {
      rows.sort((a, b) => a.rating - b.rating || String(b.timestamp).localeCompare(String(a.timestamp)));
    } else if (feedSort === "helpful") {
      rows.sort(
        (a, b) =>
          (Number(helpful[b.id] || 0) - Number(helpful[a.id] || 0)) ||
          String(b.timestamp).localeCompare(String(a.timestamp)),
      );
    }
    return rows;
  }, [allReviewsRaw, feedSort, feedStarFilter, helpfulMap]);

  const maxCatalogMeta = useMemo(() => {
    const list = catalogItems.length ? catalogItems : [];
    let maxV = 1;
    let maxR = 1;
    let maxA = 1;
    let maxF = 1;
    for (const it of list) {
      maxV = Math.max(maxV, Number(it.visitCount ?? 0) || 0);
      maxR = Math.max(maxR, Number(it.reviewCount ?? 0) || 0);
      maxA = Math.max(maxA, Number(it.avgRating ?? 0) || 0);
      maxF = Math.max(maxF, Number(it.favoriteCount ?? 0) || 0);
    }
    if (data?.product) {
      const p = data.product;
      const rs = data.ratingStats;
      maxV = Math.max(maxV, Number(p.uniqueVisitorCount ?? p.visitCount ?? 0) || 0);
      maxR = Math.max(maxR, Number(rs?.count ?? 0) || 0);
      maxA = Math.max(maxA, Number(rs?.average ?? 0) || 0);
      maxF = Math.max(maxF, Number(p.favoriteCount ?? 0) || 0);
    }
    return { maxV, maxR, maxA: Math.max(maxA, 0.01), maxF: Math.max(maxF, 1) };
  }, [catalogItems, data?.product, data?.ratingStats]);

  const carouselProducts = useMemo(() => {
    if (!data?.product) return [];
    const p = data.product;
    const seen = new Map();
    for (const r of data.related || []) {
      if (r.id !== p.id) seen.set(r.id, r);
    }
    for (const it of catalogItems) {
      if (it.id === p.id) continue;
      if (it.companySlug === p.companySlug || it.category === p.category) {
        if (!seen.has(it.id)) seen.set(it.id, it);
      }
    }
    return [...seen.values()].slice(0, 24);
  }, [data?.product, data?.related, catalogItems]);

  if (!data) {
    return (
      <PublicShell>
        <div className="flex min-h-[40vh] items-center justify-center text-[#6B7280]">
          Calibrating product intelligence…
        </div>
      </PublicShell>
    );
  }

  const { product, related } = data;
  if (product?.slug) {
    return <Navigate to={`/marketplace/listing/${encodeURIComponent(product.slug)}`} replace />;
  }
  const dist = lsReviewDetail.dist;
  const journeyCompanyId = apiCompanySlugToJourneyCompanyId(product.companySlug);
  const partnerExternalUrl =
    (journeyCompanyId && partnerOriginalWebsiteUrl(journeyCompanyId)) || product.companyUrl;
  const storefrontReturnPath = journeyCompanyId
    ? partnerStorefrontPath(journeyCompanyId)
    : `/marketplace/companies/${product.companySlug}`;

  const viewsMetric = Number(product.uniqueVisitorCount ?? product.visitCount ?? 0) || 0;
  const reviewsMetric = displayReviewCount;
  const avgMetric = displayReviewCount > 0 ? displayAvg : 0;
  const savesMetric = Number(product.favoriteCount ?? 0) || 0;

  const pct = (v, max) => `${barWidths ? Math.min(100, Math.round((v / max) * 100)) : 0}%`;

  return (
    <PublicShell>
      <div className="relative">
        <section>
          <div className="relative h-[420px] w-full overflow-hidden">
            <img src={product.heroImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#0f172a]/35 to-[#0f172a]/55" />
            <div className="absolute bottom-0 left-0 right-0">
              <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pb-10 lg:px-6">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/80">{product.companyName}</div>
                  <h1 className="mt-2 font-display text-4xl font-bold text-white md:text-5xl drop-shadow-sm">
                    {product.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-white/90">{product.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-white">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => {
                        const filled = displayReviewCount > 0 && i <= Math.round(displayAvg);
                        return (
                          <span
                            key={i}
                            className={`text-2xl transition-[opacity,transform] duration-300 ease-out ${
                              filled ? "text-amber-400" : "text-white/35"
                            } ${starsReveal ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                            style={{
                              transitionDelay: `${(i - 1) * 150}ms`,
                              transitionProperty: "opacity, transform",
                            }}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-lg font-semibold tabular-nums">
                      {displayReviewCount > 0 ? displayAvg.toFixed(2) : "—"}
                    </span>
                    <span className="text-sm text-white/80">
                      {countAnim} review{displayReviewCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleFav}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
                  >
                    <FiHeart className={`h-5 w-5 ${isFav ? "fill-current text-hub-cyan" : ""}`} aria-hidden />
                    {isFav ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => (isAuthenticated ? setReviewOpen(true) : nav("/login"))}
                    className="rounded-2xl bg-gradient-to-r from-hub-violet to-hub-cyan px-4 py-2 text-sm font-semibold text-white shadow-glowSm"
                  >
                    Write review
                  </button>
                  {partnerExternalUrl ? (
                    <a
                      href={partnerExternalUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (!isAuthenticated || !user || !journeyCompanyId) return;
                        appendCompanySurfaceVisit({
                          user,
                          hubFirstName: trackingDisplayFirstName(user),
                          companyId: journeyCompanyId,
                          companyName: product.companyName,
                          action: "visit_external_website",
                          path: storefrontReturnPath,
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                    >
                      Visit Original Website <FiExternalLink />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
            {isAuthenticated ? (
              <div className="mb-8 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { icon: "👁", label: "views", value: viewsMetric, max: maxCatalogMeta.maxV },
                    { icon: "⭐", label: "rating", value: avgMetric, max: maxCatalogMeta.maxA, format: (v) => v.toFixed(1) },
                    { icon: "💬", label: "reviews", value: reviewsMetric, max: maxCatalogMeta.maxR },
                    { icon: "❤️", label: "saves", value: savesMetric, max: maxCatalogMeta.maxF },
                  ].map((m) => (
                    <div key={m.label} className="min-w-0">
                      <div className="text-xs text-slate-600">
                        {m.icon}{" "}
                        <span className="font-semibold tabular-nums text-slate-800">
                          {m.format ? m.format(m.value) : m.value}
                        </span>{" "}
                        {m.label}
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-400 transition-all duration-700 ease-out"
                          style={{ width: pct(m.value, m.max) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    tab === t
                      ? "bg-violet-100 text-violet-900"
                      : "text-[#6B7280] hover:bg-slate-100 hover:text-[#111827]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "Overview" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"
              >
                <GlassCard className="p-8">
                  <h2 className="font-display text-xl font-semibold text-[#111827]">Details</h2>
                  <p className="mt-4 leading-relaxed text-[#6B7280]">{product.description}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="text-xs text-[#6B7280]">Category</div>
                      <div className="mt-1 text-sm font-medium text-[#111827]">{product.category}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="text-xs text-[#6B7280]">Total visits</div>
                      <div className="mt-1 text-sm font-medium text-[#111827]">
                        <AnimatedNumber value={lsProductStats.visits} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="text-xs text-[#6B7280]">Reviews</div>
                      <div className="mt-1 text-sm font-medium text-[#111827]">
                        <AnimatedNumber value={lsReviewDetail.count} />
                      </div>
                    </div>
                  </div>
                </GlassCard>
                <div className="space-y-6">
                  <GlassCard className="p-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">
                      Reputation
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="font-display text-4xl font-bold text-[#111827]">
                        {lsReviewDetail.count > 0 ? Number(lsReviewDetail.avg || 0).toFixed(2) : "—"}
                      </div>
                      <div className="text-sm text-[#6B7280]">
                        {lsReviewDetail.count > 0
                          ? `${lsReviewDetail.count} review${lsReviewDetail.count === 1 ? "" : "s"}`
                          : "No rating yet"}
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                        style={{
                          width: `${lsReviewDetail.count > 0 ? Math.min(100, (Number(lsReviewDetail.avg) / 5) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </GlassCard>
                  <GlassCard className="p-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Related</div>
                    <ul className="mt-3 space-y-2">
                      {related.map((r) => (
                        <li key={r.id}>
                          <Link
                            to={listingPath(r)}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm transition hover:border-[#7C3AED]/30 hover:bg-white"
                          >
                            <span className="font-medium text-[#111827]">{r.name}</span>
                            <span className="text-[10px] font-semibold text-[#7c3aed]">view</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {tab === "Reviews" && (
              <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
                <GlassCard className="p-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Distribution</div>
                  <div className="mt-4 space-y-2 text-sm text-[#111827]">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const key = `s${s}`;
                      const val = dist ? Number(dist[key] || 0) : 0;
                      const total = Math.max(Number(dist?.total || 0), 1);
                      const pctx = Math.round((val / total) * 100);
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className="w-6 text-xs text-[#6B7280]">{s}★</div>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                              style={{ width: `${pctx}%` }}
                            />
                          </div>
                          <div className="w-8 text-right text-xs text-[#6B7280]">{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 text-sm text-[#374151]">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Sort</span>
                      <select
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#111827] outline-none ring-2 ring-transparent focus:ring-violet-200"
                      >
                        <option value="newest">Newest</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                        <option value="helpful">Most Helpful</option>
                      </select>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map((s) => {
                        const active = reviewStarFilter === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewStarFilter(active ? null : s)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              active
                                ? "border-amber-400 bg-amber-50 text-amber-900"
                                : "border-slate-200 bg-white text-[#6B7280] hover:border-violet-200"
                            }`}
                          >
                            {"★".repeat(s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className={`space-y-4 transition-all duration-300 ${
                      feedOpaque ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {displayedReviews.length === 0 ? (
                      <GlassCard className="p-6" hover={false}>
                        <p className="text-sm text-[#6B7280]">No reviews match these filters yet.</p>
                      </GlassCard>
                    ) : (
                      displayedReviews.map((rv) => (
                        <ReviewFeedCard
                          key={rv.id}
                          rv={rv}
                          productName={product.name}
                          companyId={rv.companyId}
                          helpfulCount={Number(helpfulMap[rv.id] || 0)}
                          onHelpful={() => {
                            const m = { ...readHelpfulMap() };
                            m[rv.id] = (m[rv.id] || 0) + 1;
                            writeHelpfulMap(m);
                            setHelpfulMap(m);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "Activity" && (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <GlassCard className="p-6">
                  <div className="text-xs text-[#6B7280]">Listing visits</div>
                  <div className="mt-2 font-display text-3xl font-bold text-[#111827]">
                    <AnimatedNumber value={lsProductStats.visits} />
                  </div>
                  <p className="mt-2 text-xs text-[#6B7280]">
                    Visits recorded when signed-in users open this listing.
                  </p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="text-xs text-[#6B7280]">Reviews</div>
                  <div className="mt-2 font-display text-3xl font-bold text-[#111827]">
                    <AnimatedNumber value={lsReviewDetail.count} />
                  </div>
                  <p className="mt-2 text-xs text-[#6B7280]">
                    Reviews submitted on the marketplace for this listing.
                  </p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="text-xs text-[#6B7280]">Average rating</div>
                  <div className="mt-2 font-display text-3xl font-bold text-[#111827]">
                    {lsReviewDetail.count > 0 ? Number(lsReviewDetail.avg || 0).toFixed(2) : "—"}
                  </div>
                  <p className="mt-2 text-xs text-[#6B7280]">
                    {lsReviewDetail.count > 0 ? "From submitted star ratings." : "No rating yet."}
                  </p>
                </GlassCard>
              </div>
            )}

            {carouselProducts.length > 0 ? (
              <div className="group relative mt-12">
                <h3 className="mb-4 font-display text-lg font-semibold text-[#111827]">Related listings</h3>
                <button
                  type="button"
                  aria-label="Scroll left"
                  onClick={() => carouselRef.current?.scrollBy({ left: -280, behavior: "smooth" })}
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 opacity-0 shadow-md transition hover:bg-white group-hover:opacity-100"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() => carouselRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 opacity-0 shadow-md transition hover:bg-white group-hover:opacity-100"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
                <div
                  ref={carouselRef}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth"
                >
                  {carouselProducts.map((item) => (
                    <Link
                      key={item.id}
                      to={listingPath(item)}
                      className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] transition hover:border-violet-200 hover:bg-white"
                    >
                      <img src={item.heroImage} alt="" className="h-28 w-full object-cover" />
                      <div className="p-3">
                        <div className="line-clamp-2 text-sm font-semibold text-[#111827]">{item.name}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-[#6B7280]">{item.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        productId={Number(id)}
        productName={product.name}
        onSubmitted={({ rating, title: reviewTitle, body: reviewBody }) => {
          const comment = [reviewTitle, reviewBody].filter(Boolean).join("\n\n") || reviewBody || "";
          const before = getProductReviewDetail(Number(id));
          const nextCount = before.count + 1;
          const nextAvg = nextCount > 0 ? (before.avg * before.count + rating) / nextCount : rating;
          setOptimisticStats({ avg: nextAvg, count: nextCount });
          recordReview({
            rating,
            productId: Number(id),
            productSlug: product.slug ?? null,
            companySlug: product.companySlug,
            itemName: product.name,
            comment,
          });
          setLsTick((t) => t + 1);
          reload()
            .then(() => {
              setOptimisticStats(null);
            })
            .catch(() => {
              setOptimisticStats(null);
            });
        }}
      />
    </PublicShell>
  );
}

function ReviewFeedCard({ rv, productName, companyId, helpfulCount, onHelpful }) {
  const [expanded, setExpanded] = useState(false);
  const [bounce, setBounce] = useState(false);
  const verified = reviewerVisitedCompany(rv.userId, companyId);
  const gIdx = hashToIndex(rv.userName, AVATAR_GRADIENTS.length);
  const comment = rv.comment || "";

  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR_GRADIENTS[gIdx]}`}
        >
          {initialsFromName(rv.userName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-[#111827]">{rv.userName || "Member"}</div>
            {verified ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Verified visit
              </span>
            ) : null}
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/80">
              {rv.rating}★
            </span>
          </div>
          <div className="text-xs text-[#6B7280]">{productName}</div>
          <p
            className={`mt-3 text-sm leading-relaxed text-[#6B7280] transition-all duration-300 ease-out whitespace-pre-wrap ${
              expanded ? "max-h-[2000px]" : "line-clamp-3"
            }`}
          >
            {comment || "—"}
          </p>
          {comment.length > 120 ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={() => {
                onHelpful();
                setBounce(true);
                window.setTimeout(() => setBounce(false), 450);
              }}
              animate={bounce ? { scale: [1, 1.14, 1] } : { scale: 1 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-[#374151] transition hover:border-violet-200"
            >
              Helpful? 👍 <span className="tabular-nums">{helpfulCount}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
