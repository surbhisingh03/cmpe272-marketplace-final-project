import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiExternalLink, FiSearch, FiStar, FiX } from "react-icons/fi";
import LeaderboardListRow from "../components/marketplace/LeaderboardListRow.jsx";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
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
  productMatchesStorefrontChip,
  sortStorefrontProducts,
} from "../lib/storefrontBranding.js";

const BEAN_BREW_EXTERNAL_URL = "https://srikavyagelli.com/index.php";

const BEAN_BREW_COFFEE_HERO_IMAGE =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85";

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
  const [storeChip, setStoreChip] = useState("all");
  const [sort, setSort] = useState("popular");
  const [analyticsTick, setAnalyticsTick] = useState(0);

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

  const filteredCatalog = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = productsLive.filter((p) => {
      if (!productMatchesStorefrontChip(apiSlug, storeChip, p)) return false;
      if (s) {
        const blob = `${p.name} ${p.excerpt || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
    return sortStorefrontProducts(list, sort, apiSlug);
  }, [apiSlug, productsLive, q, storeChip, sort]);

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

  function submitReview(e) {
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
      setFormErr(err?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstProductSlug = products[0]?.slug;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <div className="relative z-10">
        <MarketingNav />

        <main className="mx-auto max-w-[1320px] px-6 pb-16 pt-8 lg:px-8">
          {/* Section 1 — Hero */}
          <section
            className={`overflow-hidden border border-slate-200/90 bg-gradient-to-br ${meta.accent.softBg} ${
              isBeanBrew
                ? "rounded-[28px] shadow-[0_28px_64px_-26px_rgba(146,64,14,0.38),0_22px_56px_-32px_rgba(15,23,42,0.18)] ring-2 ring-amber-200/55"
                : `rounded-[1.75rem] shadow-[0_20px_55px_-28px_rgba(15,23,42,0.18)] ring-1 ${meta.accent.heroRing}`
            }`}
          >
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <Link
                  to="/marketplace/explore"
                  className="mb-6 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:border-violet-300 hover:bg-white"
                >
                  <FiArrowLeft className="h-4 w-4" aria-hidden />
                  Back to Marketplace
                </Link>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${meta.accent.badge}`}
                >
                  {meta.categoryLabel}
                </span>
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-[2.1rem]">
                  {storefrontBrandName}
                </h1>
                {isBeanBrew ? (
                  <p className="mt-2 text-sm font-semibold tracking-wide text-amber-900/85">Bean &amp; Brew Co.</p>
                ) : null}
                <p className="mt-4 text-[16px] leading-relaxed text-slate-600">{meta.description}</p>
                <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Avg rating</dt>
                    <dd className={`mt-1 text-xl font-black tabular-nums ${meta.accent.stat}`}>
                      {displayReviews > 0 ? displayAvg.toFixed(2) : "No rating yet"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Reviews</dt>
                    <dd className="mt-1 text-xl font-black tabular-nums text-slate-900">
                      {displayReviews.toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Visits</dt>
                    <dd className="mt-1 text-xl font-black tabular-nums text-slate-900">
                      {displayVisits.toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Listings</dt>
                    <dd className="mt-1 text-xl font-black tabular-nums text-slate-900">{listingsCount}</dd>
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
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm transition hover:border-violet-300"
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
                      className={`inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 text-sm font-bold text-white shadow-md ${HUB_GRADIENT_HOVER}`}
                    >
                      Write a Review
                    </button>
                  ) : null}
                </div>
              </div>
              {isBeanBrew ? (
                <div className="relative min-h-[300px] lg:min-h-[440px]">
                  <img
                    src={BEAN_BREW_COFFEE_HERO_IMAGE}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-950/50 via-amber-600/38 to-orange-100/50" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/45 via-amber-900/10 to-amber-50/30" />
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_rgba(251,191,36,0.2)]" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-amber-200/25" />
                  <div className="absolute bottom-6 right-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/95 shadow-[0_12px_40px_-8px_rgba(180,83,9,0.35)] ring-2 ring-amber-100/90">
                    <span className={meta.accent.iconWrap + " flex h-16 w-16 items-center justify-center rounded-xl"}>
                      <Icon className="h-9 w-9" aria-hidden />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative min-h-[280px] lg:min-h-[420px]">
                  <Media src={heroBanner} className="h-full min-h-[280px] w-full object-cover lg:absolute lg:inset-0 lg:min-h-0" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent lg:from-slate-900/35" />
                  <div className="absolute bottom-6 right-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/95 shadow-xl ring-2 ring-white/80">
                    <span className={meta.accent.iconWrap + " flex h-16 w-16 items-center justify-center rounded-xl"}>
                      <Icon className="h-9 w-9" aria-hidden />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2 — Top 5 */}
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-slate-900">🏆 Top 5 in this Storefront</h2>
            <p className="mt-2 max-w-3xl text-[15px] text-slate-600">
              Top listings based on visits, reviews, and ratings for this company.
            </p>
            <p className="mt-1 max-w-3xl text-[13px] font-medium text-slate-500">Ranked by marketplace engagement.</p>
            {productsLive.length === 0 ? (
              <p className="mt-6 max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-5 py-4 text-sm text-slate-600">
                No listings loaded for this storefront.
              </p>
            ) : null}
            <div className="mt-8 max-w-3xl">
              <ul className="flex list-none flex-col gap-3 p-0">
                {topFive.map((p, idx) => (
                  <li key={p.id} className="list-none">
                    <LeaderboardListRow
                      rank={idx + 1}
                      title={p.name}
                      subtitle={null}
                      category={p.category}
                      reviewCount={p.reviewCount}
                      avgRating={p.avgRating}
                      to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 3 — Search & filters */}
          <section className="mt-14 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none ring-violet-500/20 placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2"
                />
              </div>
              <label className="sr-only" htmlFor="storefront-sort">
                Sort
              </label>
              <select
                id="storefront-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full min-w-[12rem] cursor-pointer rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 lg:w-auto"
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
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="mr-2 w-full text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:w-auto sm:self-center">
                Browse
              </span>
              {meta.filterChips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setStoreChip(c.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    storeChip === c.key
                      ? "bg-violet-100 text-violet-900 ring-2 ring-violet-300/70"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Section 4 — Catalog */}
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold text-slate-900">All Listings</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {filteredCatalog.length} listing{filteredCatalog.length === 1 ? "" : "s"} in this storefront
            </p>
            {filteredCatalog.length === 0 ? (
              <p className="mt-10 text-center text-slate-500">No listings match your filters.</p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCatalog.map((p) => (
                  <article
                    key={p.id}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
                  >
                    <div
                      className={`relative shrink-0 overflow-hidden bg-slate-100 ${
                        isBeanBrew ? "h-[220px] min-h-[220px] max-h-[220px]" : "aspect-[16/10]"
                      }`}
                    >
                      <Media
                        src={p.heroImage}
                        className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
                          isBeanBrew ? "min-h-[220px]" : ""
                        }`}
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 shadow-sm ring-1 ring-slate-200/80">
                        {categoryRibbonLabel(p.category)}
                      </span>
                    </div>
                    <div className={`flex min-h-0 flex-1 flex-col ${isBeanBrew ? "p-3" : "p-4"}`}>
                      <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">{p.name}</h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{p.excerpt || "Explore this listing."}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-semibold text-amber-600">
                          {Number(p.reviewCount || 0) > 0 ? `${Number(p.avgRating || 0).toFixed(1)}★` : "No rating yet"}
                        </span>
                        <span className="mx-1">·</span>
                        {Number(p.reviewCount || 0)} reviews
                        <span className="mx-1">·</span>
                        {visitCountLabel(p.visitCount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => p.slug && navigate(marketplaceListingPath(p.slug))}
                        className={`${isBeanBrew ? "mt-3" : "mt-4"} flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-bold text-white shadow-sm ${HUB_GRADIENT_HOVER}`}
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
                  </article>
                ))}
              </div>
            )}
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
