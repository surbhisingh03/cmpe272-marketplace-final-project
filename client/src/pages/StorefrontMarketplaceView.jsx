import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiExternalLink, FiHeart, FiSearch, FiStar, FiX } from "react-icons/fi";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { submitProductReviewToApi } from "../lib/submitProductReviewApi.js";
import { categoryRibbonLabel, marketplaceListingPath } from "../lib/marketplaceDisplay.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  apiCompanySlugToJourneyCompanyId,
  partnerOriginalWebsiteUrl,
  partnerStorefrontPath,
} from "../lib/marketplaceUserTracking.js";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";
import {
  compareListingsByPopularityDesc,
  getCompanyAnalytics,
  getCompanyRecentReviews,
  getProductAnalytics,
  getProductReviewDetail,
  subscribeAnalyticsUpdated,
} from "../lib/fusionhubAnalytics.js";
import {
  BEAN_BREW_STOREFRONT_SLUG,
  HUB_GRADIENT_HOVER,
  STOREFRONT_COMPANY_META,
  sortStorefrontProducts,
} from "../lib/storefrontBranding.js";

const BEAN_BREW_EXTERNAL_URL = "https://srikavyagelli.com/index.php";

const SORT_OPTIONS = [
  { key: "popular", label: "Most Popular" },
  { key: "rated", label: "Highest Rated" },
  { key: "reviewed", label: "Most Reviewed" },
  { key: "newest", label: "Newest" },
];

function visitCountLabel(n) {
  const v = Number(n) || 0;
  return `${v.toLocaleString()} ${v === 1 ? "visit" : "visits"}`;
}

function RatingStarsRow({ avg }) {
  const a = Math.min(5, Math.max(0, Number(avg) || 0));
  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${a.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, a - i));
        return (
          <span key={i} className="relative h-4 w-4 shrink-0">
            <FiStar className="absolute inset-0 h-4 w-4 text-slate-200" aria-hidden />
            {fill >= 1 ? <FiStar className="absolute inset-0 h-4 w-4 fill-current text-amber-400" aria-hidden /> : null}
            {fill > 0 && fill < 1 ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <FiStar className="h-4 w-4 fill-current text-amber-400" aria-hidden />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function Media({ src, className }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <div className={`bg-gradient-to-br from-slate-100 to-slate-200 ${className}`} />;
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setErr(true)}
    />
  );
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded p-0.5 ${n <= value ? "text-amber-500" : "text-slate-300 hover:text-slate-400"}`}
        >
          <FiStar className={`h-6 w-6 ${n <= value ? "fill-current" : ""}`} aria-hidden />
        </button>
      ))}
    </div>
  );
}

export default function StorefrontMarketplaceView({
  apiSlug,
  journeyId,
  company,
  products,
  internalStorefrontPath,
  heroGradientClass = "from-slate-700 via-violet-800 to-slate-950",
  companyOwnerDisplay = "",
  visitBumpNonce = 0,
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { recordCompanySurface, recordReview } = useMarketplaceUserTracking(user, isAuthenticated);

  const isBeanBrew = apiSlug === BEAN_BREW_STOREFRONT_SLUG;
  const storefrontBrandName = isBeanBrew ? "Bean & Brew Co." : company.name;
  const meta = STOREFRONT_COMPANY_META[apiSlug] || STOREFRONT_COMPANY_META["srikavya-enterprise"];
  const Icon = meta.Icon;
  const externalPartnerUrl = isBeanBrew
    ? BEAN_BREW_EXTERNAL_URL
    : (journeyId && partnerOriginalWebsiteUrl(journeyId)) || company.externalUrl || "#";

  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const [analyticsTick, setAnalyticsTick] = useState(0);

  const heroShellRef = useRef(null);
  const [orbOffset, setOrbOffset] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const [visitBadgeDisplay, setVisitBadgeDisplay] = useState(0);
  const [visitBadgeAnimating, setVisitBadgeAnimating] = useState(false);
  const visitBumpHandledRef = useRef(0);

  const tabRowRef = useRef(null);
  const tabBtnRefs = useRef([]);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const [favIds, setFavIds] = useState(() => new Set());
  const [heartPulseId, setHeartPulseId] = useState(null);

  const [quickOpenId, setQuickOpenId] = useState(null);
  const [quickStars, setQuickStars] = useState(0);
  const [quickBody, setQuickBody] = useState("");
  const [quickErr, setQuickErr] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const [sidebarReveal, setSidebarReveal] = useState(false);

  const [drawerId, setDrawerId] = useState(null);
  const [drawerLoad, setDrawerLoad] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState(null);
  const [ratingAgg, setRatingAgg] = useState({ average: 0, count: 0 });
  const [dist, setDist] = useState(null);
  const [stars, setStars] = useState(0);
  const [titleIn, setTitleIn] = useState("");
  const [bodyIn, setBodyIn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    const off = subscribeAnalyticsUpdated(() => setAnalyticsTick((t) => t + 1));
    return off;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavIds(new Set());
      return;
    }
    let cancelled = false;
    const legacyLsKey = "fh_company_storefront_favorites";
    (async () => {
      try {
        const rows = await apiFetch("/api/marketplace/favorites");
        if (cancelled) return;
        const next = new Set(
          (Array.isArray(rows) ? rows : []).map((r) => Number(r.id)).filter((n) => Number.isFinite(n)),
        );
        try {
          const raw = localStorage.getItem(legacyLsKey);
          const lsArr = raw ? JSON.parse(raw) : null;
          if (Array.isArray(lsArr) && lsArr.length) {
            for (const x of lsArr) {
              const pid = Number(x);
              if (!Number.isFinite(pid) || next.has(pid)) continue;
              try {
                await apiFetch(`/api/marketplace/favorites/${pid}`, { method: "POST" });
                next.add(pid);
              } catch {
                /* skip */
              }
            }
          }
        } catch {
          /* ignore */
        }
        try {
          localStorage.removeItem(legacyLsKey);
        } catch {
          /* ignore */
        }
        if (!cancelled) setFavIds(next);
      } catch {
        if (!cancelled) setFavIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const toggleStorefrontFavorite = useCallback(
    async (productId, e) => {
      e?.stopPropagation?.();
      const pid = Number(productId);
      if (!Number.isFinite(pid)) return;
      if (!isAuthenticated) {
        navigate("/login", { state: { from: internalStorefrontPath } });
        return;
      }
      const was = favIds.has(pid);
      try {
        if (was) {
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
      } catch {
        /* keep prior state */
      }
    },
    [isAuthenticated, navigate, internalStorefrontPath, favIds],
  );

  const productsLive = useMemo(() => {
    void analyticsTick;
    return products.map((p) => {
      const a = getProductAnalytics(p.id);
      return {
        ...p,
        visitCount: a.visits,
        reviewCount: a.reviewCount,
        avgRating: a.reviewCount > 0 ? a.avgRating : 0,
        popularityScore: a.popularity,
      };
    });
  }, [products, analyticsTick]);

  const companyStats = useMemo(() => {
    void analyticsTick;
    return journeyId ? getCompanyAnalytics(journeyId) : null;
  }, [journeyId, analyticsTick]);

  const listingsCount = products.length;
  const displayVisits = companyStats?.totalVisits ?? 0;
  const displayReviews = companyStats?.reviewCount ?? 0;
  const displayAvg = displayReviews > 0 ? companyStats?.avgRating ?? 0 : 0;

  useEffect(() => {
    setVisitBadgeDisplay(displayVisits);
  }, [displayVisits]);

  useEffect(() => {
    if (!visitBumpNonce || visitBumpNonce === visitBumpHandledRef.current) return;
    visitBumpHandledRef.current = visitBumpNonce;
    const target = journeyId ? getCompanyAnalytics(journeyId).totalVisits : displayVisits;
    const start = Math.max(0, target - 1);
    setVisitBadgeAnimating(true);
    setVisitBadgeDisplay(start);
    const tid = window.setTimeout(() => {
      setVisitBadgeDisplay(target);
      setVisitBadgeAnimating(false);
    }, 80);
    return () => clearTimeout(tid);
  }, [visitBumpNonce, journeyId, displayVisits]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSidebarReveal(true));
    return () => cancelAnimationFrame(id);
  }, [apiSlug]);

  const heroBanner = company.bannerUrl || meta.heroImage;

  const companyReviews = useMemo(() => {
    void analyticsTick;
    if (!journeyId) return [];
    return getCompanyRecentReviews(journeyId, 4).map((r) => ({
      body: r.comment,
      authorName: r.userName,
      productName: r.itemName,
      rating: r.rating,
      createdAt: r.timestamp,
    }));
  }, [journeyId, analyticsTick]);

  const topFive = useMemo(() => {
    const sorted = [...productsLive].sort(compareListingsByPopularityDesc);
    return sorted.slice(0, 5);
  }, [productsLive]);

  const categoryTabs = useMemo(() => {
    const set = new Set();
    for (const p of productsLive) {
      const c = String(p.category || "").trim();
      if (c) set.add(c);
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ key: "all", label: "All" }, ...sorted.map((c) => ({ key: c, label: c }))];
  }, [productsLive]);

  const filteredCatalog = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = productsLive.filter((p) => {
      if (activeCategory !== "all" && String(p.category || "") !== activeCategory) return false;
      if (s) {
        const blob = `${p.name} ${p.excerpt || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
    return sortStorefrontProducts(list, sort, apiSlug);
  }, [apiSlug, productsLive, q, activeCategory, sort]);

  const activeTabIndex = useMemo(() => {
    const i = categoryTabs.findIndex((t) => t.key === activeCategory);
    return i >= 0 ? i : 0;
  }, [categoryTabs, activeCategory]);

  const measureTabIndicator = useCallback(() => {
    const row = tabRowRef.current;
    const btn = tabBtnRefs.current[activeTabIndex];
    if (!row || !btn) return;
    const ro = row.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setTabIndicator({ left: br.left - ro.left + row.scrollLeft, width: br.width });
  }, [activeTabIndex]);

  useLayoutEffect(() => {
    measureTabIndicator();
  }, [measureTabIndicator, categoryTabs.length, activeCategory]);

  useEffect(() => {
    window.addEventListener("resize", measureTabIndicator);
    const row = tabRowRef.current;
    row?.addEventListener("scroll", measureTabIndicator, { passive: true });
    return () => {
      window.removeEventListener("resize", measureTabIndicator);
      row?.removeEventListener("scroll", measureTabIndicator);
    };
  }, [measureTabIndicator]);

  useEffect(() => {
    if (!categoryTabs.some((t) => t.key === activeCategory)) setActiveCategory("all");
  }, [categoryTabs, activeCategory]);

  const searchPlaceholder = meta.searchPlaceholder || "Search this storefront…";

  const closeDrawer = useCallback(() => setDrawerId(null), []);

  const refreshDrawerStats = useCallback(() => {
    if (!drawerId) return;
    const detail = getProductReviewDetail(drawerId);
    setRatingAgg({ average: detail.avg, count: detail.count });
    setDist(detail.dist);
  }, [drawerId]);

  useEffect(() => {
    if (!drawerId) {
      document.body.style.overflow = "";
      setDrawerProduct(null);
      setRatingAgg({ average: 0, count: 0 });
      setDist(null);
      setStars(0);
      setTitleIn("");
      setBodyIn("");
      setFormErr("");
      return;
    }
    document.body.style.overflow = "hidden";
    setDrawerLoad(true);
    apiFetch(`/api/marketplace/products/${drawerId}`)
      .then((pd) => {
        setDrawerProduct(pd.product);
        const detail = getProductReviewDetail(drawerId);
        setRatingAgg({ average: detail.avg, count: detail.count });
        setDist(detail.dist);
      })
      .catch(() => setDrawerProduct(null))
      .finally(() => setDrawerLoad(false));

    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerId]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && drawerId && closeDrawer();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [drawerId, closeDrawer]);

  const totalDist = Math.max(Number(dist?.total || 0), 1);

  async function submitReview(e) {
    e.preventDefault();
    setFormErr("");
    if (!isAuthenticated) {
      const from =
        drawerProduct?.slug != null
          ? `${marketplaceListingPath(drawerProduct.slug)}?review=1`
          : `/marketplace/products/${drawerId}?review=1`;
      navigate("/login", { state: { from } });
      return;
    }
    if (stars < 1) {
      setFormErr("Select a star rating.");
      return;
    }
    const b = bodyIn.trim();
    if (!b) {
      setFormErr("Add a short comment.");
      return;
    }
    if (!drawerProduct?.companySlug) {
      setFormErr("Missing listing.");
      return;
    }
    setSubmitting(true);
    try {
      await submitProductReviewToApi(drawerId, {
        title: titleIn.trim() || `Review · ${drawerProduct.name}`,
        body: b,
        rating: stars,
        recommend: true,
      });
      recordReview({
        rating: stars,
        productId: drawerId,
        productSlug: drawerProduct.slug ?? null,
        companySlug: drawerProduct.companySlug,
        itemName: drawerProduct.name,
        comment: b,
      });
      setStars(0);
      setTitleIn("");
      setBodyIn("");
      refreshDrawerStats();
      setAnalyticsTick((t) => t + 1);
    } catch (err) {
      setFormErr(err?.message || err?.payload?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitQuickReview(e, p) {
    e.preventDefault();
    setQuickErr("");
    if (!isAuthenticated) {
      const from = p.slug ? `${marketplaceListingPath(p.slug)}?review=1` : `/marketplace/products/${p.id}?review=1`;
      navigate("/login", { state: { from } });
      return;
    }
    if (quickStars < 1) {
      setQuickErr("Select a star rating.");
      return;
    }
    const b = quickBody.trim();
    if (!b) {
      setQuickErr("Add a short comment.");
      return;
    }
    const companySlug = p.companySlug || company.slug || apiSlug;
    if (!companySlug) {
      setQuickErr("Missing company.");
      return;
    }
    setQuickSubmitting(true);
    try {
      await submitProductReviewToApi(p.id, {
        title: `Review · ${p.name}`,
        body: b,
        rating: quickStars,
        recommend: true,
      });
      recordReview({
        rating: quickStars,
        productId: String(p.id),
        productSlug: p.slug ?? null,
        companySlug,
        itemName: p.name,
        comment: b,
      });
      setQuickOpenId(null);
      setQuickStars(0);
      setQuickBody("");
      setQuickErr("");
      setAnalyticsTick((t) => t + 1);
    } catch (err) {
      setQuickErr(err?.message || err?.payload?.error || "Submit failed.");
    } finally {
      setQuickSubmitting(false);
    }
  }

  function onHeroMouseMove(e) {
    const el = heroShellRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = e.clientX - r.left - r.width / 2;
    const cy = e.clientY - r.top - r.height / 2;
    setOrbOffset({
      x1: cx * 0.02,
      y1: cy * 0.02,
      x2: cx * -0.015,
      y2: cy * -0.015,
    });
  }

  const firstProductSlug = products[0]?.slug;
  const ownerLine = companyOwnerDisplay || meta.categoryLabel;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <div className="relative z-10">
        <MarketingNav />
        <style>{`
          @keyframes fh-visit-digit-flip {
            from { transform: perspective(420px) rotateX(90deg); opacity: 0.35; }
            to { transform: perspective(420px) rotateX(0deg); opacity: 1; }
          }
          .fh-visit-digit {
            display: inline-block;
            animation: fh-visit-digit-flip 0.4s ease-out both;
          }
        `}</style>
        <section
          ref={heroShellRef}
          onMouseMove={onHeroMouseMove}
          className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden border-b border-white/10 bg-gradient-to-br ${heroGradientClass}`}
        >
          <div
            className="pointer-events-none absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-white blur-3xl opacity-20"
            style={{ transform: `translate(${orbOffset.x1}px, ${orbOffset.y1}px)` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-[8%] right-[18%] h-96 w-96 rounded-full bg-cyan-200 blur-3xl opacity-20"
            style={{ transform: `translate(${orbOffset.x2}px, ${orbOffset.y2}px)` }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14),transparent_58%)]" aria-hidden />
          {heroBanner ? (
            <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
              <Media src={heroBanner} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="relative z-[1] mx-auto max-w-[1320px] px-6 pb-14 pt-10 lg:px-8">
            <Link
              to="/marketplace/explore"
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20"
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden />
              Back to Marketplace
            </Link>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/25">
              {meta.categoryLabel}
            </span>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white drop-shadow-md md:text-[2.75rem]">
              {storefrontBrandName}
            </h1>
            <p className="mt-2 text-sm font-medium text-white/70">{ownerLine}</p>
            {isBeanBrew ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-100/90">Bean &amp; Brew Co.</p>
            ) : null}
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/85">{meta.description}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur-md">
              <span aria-hidden>👁</span>
              <span key={`vd-${visitBadgeDisplay}-${visitBumpNonce}`} className="fh-visit-digit tabular-nums tracking-tight">
                {visitBadgeDisplay.toLocaleString()}
              </span>
              <span>visits</span>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-md">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-white/70">Avg rating</dt>
                <dd className="mt-1 text-xl font-black tabular-nums text-white">
                  {displayReviews > 0 ? displayAvg.toFixed(2) : "—"}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-md">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-white/70">Reviews</dt>
                <dd className="mt-1 text-xl font-black tabular-nums text-white">{displayReviews.toLocaleString()}</dd>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-md">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-white/70">Listings</dt>
                <dd className="mt-1 text-xl font-black tabular-nums text-white">{listingsCount}</dd>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur-md">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-white/70">Icon</dt>
                <dd className="mt-2 flex justify-center">
                  <span className={meta.accent.iconWrap + " flex h-12 w-12 items-center justify-center rounded-xl"}>
                    <Icon className="h-7 w-7" aria-hidden />
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={externalPartnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (isAuthenticated && user && journeyId) {
                    recordCompanySurface({
                      journeyCompanyId: journeyId,
                      companyName: storefrontBrandName,
                      action: "visit_external_website",
                      path: internalStorefrontPath,
                    });
                  }
                }}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25"
              >
                Visit Original Website <FiExternalLink className="h-4 w-4" />
              </a>
              {firstProductSlug ? (
                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated
                      ? navigate(`${marketplaceListingPath(firstProductSlug)}#write-review`)
                      : navigate("/login", {
                          state: { from: `${marketplaceListingPath(firstProductSlug)}?review=1` },
                        })
                  }
                  className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-white px-5 text-sm font-bold text-violet-800 shadow-md transition hover:brightness-105"
                >
                  Write a Review
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-[1320px] px-6 pb-16 pt-10 lg:px-8">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative min-w-0 flex-1">
                    <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/15"
                    />
                  </div>
                  <label className="sr-only" htmlFor="storefront-sort">
                    Sort
                  </label>
                  <select
                    id="storefront-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full min-w-[12rem] cursor-pointer rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 lg:w-auto"
                    style={{
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "12px",
                    }}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="mt-6">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Categories</p>
                <div ref={tabRowRef} className="relative flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 z-0 h-[3px] rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-500 shadow-md shadow-purple-500/30 transition-[left,width] duration-300 ease-out"
                    style={{ left: tabIndicator.left, width: tabIndicator.width }}
                  />
                  {categoryTabs.map((tab, i) => {
                    const active = activeCategory === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        ref={(el) => {
                          tabBtnRefs.current[i] = el;
                        }}
                        onClick={() => setActiveCategory(tab.key)}
                        className={`relative z-[1] shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                          active
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mt-10">
                <h2 className="font-display text-2xl font-bold text-slate-900">All Listings</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {filteredCatalog.length} listing{filteredCatalog.length === 1 ? "" : "s"} in this storefront
                </p>
                {filteredCatalog.length === 0 ? (
                  <p className="mt-10 text-center text-slate-500">No listings match your filters.</p>
                ) : (
                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCatalog.map((p) => {
                      const favOn = favIds.has(Number(p.id));
                      return (
                        <article
                          key={p.id}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
                        >
                          <div
                            className={`relative shrink-0 overflow-hidden bg-slate-100 ${
                              isBeanBrew ? "h-[200px] min-h-[200px] max-h-[200px]" : "aspect-[16/10]"
                            }`}
                          >
                            <Media
                              src={p.heroImage}
                              className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
                                isBeanBrew ? "min-h-[200px]" : ""
                              }`}
                            />
                            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 shadow-sm ring-1 ring-slate-200/80">
                              {categoryRibbonLabel(p.category)}
                            </span>
                            <button
                              type="button"
                              aria-label={favOn ? "Remove from favorites" : "Add to favorites"}
                              onClick={(e) => {
                                void toggleStorefrontFavorite(p.id, e);
                                setHeartPulseId(p.id);
                                window.setTimeout(() => {
                                  setHeartPulseId((cur) => (cur === p.id ? null : cur));
                                }, 260);
                              }}
                              className={`absolute right-2 top-2 rounded-full bg-white/95 p-2 shadow-md ring-1 ring-gray-200/90 transition-transform duration-200 hover:bg-white ${
                                heartPulseId === p.id ? "scale-125" : "scale-100"
                              } ${favOn ? "text-red-500" : "text-slate-400"}`}
                            >
                              <FiHeart className={`h-5 w-5 ${favOn ? "fill-current" : ""}`} aria-hidden />
                            </button>
                          </div>
                          <div className={`relative flex min-h-0 flex-1 flex-col ${isBeanBrew ? "p-3" : "p-4"}`}>
                            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">{p.name}</h3>
                            <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{p.excerpt || "Explore this listing."}</p>
                            <div className="mt-2">
                              <RatingStarsRow avg={Number(p.avgRating) || 0} />
                              <p className="mt-1 text-[11px] font-medium text-slate-500">
                                {Number(p.reviewCount || 0)} reviews · {visitCountLabel(p.visitCount)}
                              </p>
                            </div>
                            <div className="relative mt-3 h-11 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quickOpenId === p.id) {
                                    setQuickOpenId(null);
                                    setQuickErr("");
                                    return;
                                  }
                                  setQuickOpenId(p.id);
                                  setQuickStars(0);
                                  setQuickBody("");
                                  setQuickErr("");
                                }}
                                className="absolute inset-x-0 bottom-0 flex min-h-[38px] translate-y-full items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-xs font-bold text-violet-800 opacity-0 shadow-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                              >
                                Quick Review
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => p.slug && navigate(marketplaceListingPath(p.slug))}
                              className={`${isBeanBrew ? "mt-2" : "mt-3"} flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-bold text-white shadow-sm ${HUB_GRADIENT_HOVER}`}
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                p.slug
                                  ? isAuthenticated
                                    ? navigate(`${marketplaceListingPath(p.slug)}#write-review`)
                                    : navigate("/login", { state: { from: `${marketplaceListingPath(p.slug)}?review=1` } })
                                  : undefined
                              }
                              className="mt-2 w-full pb-1 text-center text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-950"
                            >
                              Write Review
                            </button>
                          </div>
                          <div
                            className="overflow-hidden border-t border-gray-100 bg-slate-50/90 transition-all duration-400"
                            style={{
                              maxHeight: quickOpenId === p.id ? 300 : 0,
                              opacity: quickOpenId === p.id ? 1 : 0,
                            }}
                          >
                            <form onSubmit={(e) => submitQuickReview(e, p)} className="space-y-3 p-4">
                              <p className="text-xs font-bold text-slate-800">Quick review</p>
                              <StarInput value={quickOpenId === p.id ? quickStars : 0} onChange={setQuickStars} />
                              <textarea
                                value={quickOpenId === p.id ? quickBody : ""}
                                onChange={(e) => setQuickBody(e.target.value)}
                                rows={3}
                                placeholder="Short comment"
                                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              {quickErr && quickOpenId === p.id ? <p className="text-xs text-red-600">{quickErr}</p> : null}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={quickSubmitting}
                                  className="flex-1 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-2 text-xs font-bold text-white disabled:opacity-50"
                                >
                                  {quickSubmitting ? "…" : "Submit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickOpenId(null);
                                    setQuickErr("");
                                  }}
                                  className="rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="sticky top-24 mt-10 hidden lg:mt-0 lg:block">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-bold text-slate-900">🏆 Top 5</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">By visits, reviews, and ratings.</p>
                {productsLive.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">No listings.</p>
                ) : (
                  <ul className="mt-4 flex list-none flex-col gap-3 p-0">
                    {topFive.map((p, idx) => {
                      const rankNumBase = "text-sm font-black tabular-nums bg-clip-text text-transparent";
                      const rankClass =
                        idx === 0
                          ? `${rankNumBase} bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700`
                          : idx === 1
                            ? `${rankNumBase} bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600`
                            : idx === 2
                              ? `${rankNumBase} bg-gradient-to-br from-amber-800 via-orange-800 to-amber-950`
                              : "text-sm font-black text-slate-500";
                      const to = p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`;
                      return (
                        <li
                          key={p.id}
                          className="list-none"
                          style={{
                            opacity: sidebarReveal ? 1 : 0,
                            transform: sidebarReveal ? "translateX(0)" : "translateX(20px)",
                            transition: "opacity 0.45s ease, transform 0.45s ease",
                            transitionDelay: `${idx * 60}ms`,
                          }}
                        >
                          <Link
                            to={to}
                            className="flex gap-3 rounded-xl border border-gray-100 bg-slate-50/80 p-3 transition hover:border-violet-200 hover:bg-white"
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-center ${rankClass}`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{p.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <RatingStarsRow avg={Number(p.avgRating) || 0} />
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-gray-200">
                                  👁 {Number(p.visitCount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
          </div>

          <section className="mt-10 lg:hidden">
            <h2 className="font-display text-lg font-bold text-slate-900">🏆 Top 5 in this storefront</h2>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0">
              {topFive.map((p, idx) => (
                <li key={p.id} className="list-none">
                  <Link
                    to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                  >
                    <span className="text-violet-600">#{idx + 1}</span>
                    <span className="ml-2 min-w-0 flex-1 truncate">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5 — Reviews */}
          <section className="mt-16 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Recent Reviews for {storefrontBrandName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">Reviews saved in this marketplace for this company.</p>
              </div>
              <Link
                to="/reviews"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-900 transition hover:border-violet-300"
              >
                View All Reviews
              </Link>
            </div>
            {companyReviews.length === 0 ? (
              <p className="mt-8 text-center text-sm font-medium text-slate-600">
                No reviews yet. Be the first to write one.
              </p>
            ) : (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {companyReviews.map((r, i) => (
                  <div
                    key={`${r.createdAt}-${i}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm"
                  >
                    <div className="flex text-amber-500" aria-label={`${r.rating} stars`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FiStar key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-current" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-900">&ldquo;{r.body || r.title}&rdquo;</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-wide text-violet-600">
                      {r.authorName} · {r.productName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <MarketingFooter />
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[100] flex justify-end ${drawerId ? "pointer-events-auto" : "pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sf-drawer-title"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={closeDrawer}
          className={`flex-1 bg-slate-900/40 transition-opacity ${drawerId ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
            drawerId ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Listing</span>
            <button type="button" onClick={closeDrawer} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <FiX size={22} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {drawerLoad ? (
              <div className="animate-pulse space-y-4 p-5">
                <div className="aspect-video rounded-2xl bg-slate-200" />
                <div className="h-8 rounded bg-slate-200" />
              </div>
            ) : drawerProduct ? (
              <div className="p-5 pb-10">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <Media src={drawerProduct.heroImage} className="aspect-video w-full object-cover" />
                </div>
                <h2 id="sf-drawer-title" className="mt-6 text-xl font-bold text-slate-900">
                  {drawerProduct.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-violet-700">
                  {isBeanBrew ? storefrontBrandName : drawerProduct.companyName}
                </p>
                <p className="text-xs font-medium text-slate-500">{categoryRibbonLabel(drawerProduct.category)}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {drawerProduct.description || drawerProduct.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap gap-4 border-y border-slate-100 py-4 text-sm">
                  <span className="font-semibold text-amber-600">
                    {ratingAgg.count > 0
                      ? `${Number(ratingAgg.average || 0).toFixed(1)}★ (${ratingAgg.count} reviews)`
                      : "No rating yet"}
                  </span>
                  <span className="text-slate-600">
                    {visitCountLabel(drawerId ? getProductAnalytics(drawerId).visits : 0)}
                  </span>
                </div>
                {(() => {
                  const pj = drawerProduct.companySlug ? apiCompanySlugToJourneyCompanyId(drawerProduct.companySlug) : null;
                  const ext =
                    pj === "bean-brew"
                      ? BEAN_BREW_EXTERNAL_URL
                      : (pj && partnerOriginalWebsiteUrl(pj)) || drawerProduct.companyUrl;
                  if (!ext) return null;
                  const sfPath = pj ? partnerStorefrontPath(pj) : internalStorefrontPath;
                  return (
                    <a
                      href={ext}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (isAuthenticated && user && pj) {
                          recordCompanySurface({
                            journeyCompanyId: pj,
                            companyName: isBeanBrew ? storefrontBrandName : drawerProduct.companyName,
                            action: "visit_external_website",
                            path: sfPath,
                          });
                        }
                      }}
                      className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:border-violet-300"
                    >
                      Visit Original Website <FiExternalLink size={16} />
                    </a>
                  );
                })()}

                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rating mix</p>
                  <div className="mt-3 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const key = `s${star}`;
                      const cnt = Number(dist?.[key] || 0);
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-slate-500">{star}★</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                              style={{ width: `${(cnt / totalDist) * 100}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-slate-500">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-bold text-slate-900">Write a review</p>
                  {!isAuthenticated ? (
                    <p className="mt-2 text-sm text-slate-600">
                      <Link
                        to="/login"
                        state={{
                          from:
                            drawerProduct?.slug != null
                              ? marketplaceListingPath(drawerProduct.slug)
                              : `/marketplace/products/${drawerId}`,
                        }}
                        className="font-bold text-violet-700 underline"
                      >
                        Sign in
                      </Link>{" "}
                      to submit.
                    </p>
                  ) : (
                    <form onSubmit={submitReview} className="mt-4 space-y-4">
                      <div>
                        <p className="mb-2 text-xs text-slate-500">Your rating</p>
                        <StarInput value={stars} onChange={setStars} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Title (optional)</label>
                        <input
                          value={titleIn}
                          onChange={(e) => setTitleIn(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                          maxLength={180}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Comment</label>
                        <textarea
                          value={bodyIn}
                          onChange={(e) => setBodyIn(e.target.value)}
                          rows={4}
                          className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      {formErr ? <p className="text-sm text-red-600">{formErr}</p> : null}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {submitting ? "Submitting…" : "Submit Review"}
                      </button>
                    </form>
                  )}
                </div>

                <Link
                  to={
                    drawerProduct?.slug != null
                      ? marketplaceListingPath(drawerProduct.slug)
                      : `/marketplace/products/${drawerId}`
                  }
                  onClick={() => closeDrawer()}
                  className="mt-6 block text-center text-sm font-semibold text-violet-700 underline"
                >
                  Open full page
                </Link>
              </div>
            ) : (
              <p className="p-8 text-center text-slate-500">Could not load product.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
