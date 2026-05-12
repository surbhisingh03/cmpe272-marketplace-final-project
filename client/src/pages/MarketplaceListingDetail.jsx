import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";
import {
  getProductAnalytics,
  getProductReviewDetail,
  readAnalyticsReviews,
  subscribeAnalyticsUpdated,
} from "../lib/fusionhubAnalytics.js";
import {
  appendMarketplaceVisit,
  apiCompanySlugToJourneyCompanyId,
  consumeSessionOnceKey,
  getMarketplaceTrackingUserKey,
  partnerOriginalWebsiteUrl,
  partnerStorefrontPath,
  trackingDisplayFirstName,
} from "../lib/marketplaceUserTracking.js";
import { categoryRibbonLabel, displayCompanyName, marketplaceListingPath } from "../lib/marketplaceDisplay.js";
import { HUB_GRADIENT_HOVER } from "../lib/storefrontBranding.js";

const SHELL = "mx-auto w-full max-w-[1320px] px-6 lg:px-8";

/** Header company pill — partner storefront gradients */
const COMPANY_HEADER_GRADIENT = {
  "nexus-academy": "linear-gradient(135deg, #7c3aed, #4f46e5)",
  "travel-agency": "linear-gradient(135deg, #0891b2, #0d9488)",
  "srikavya-enterprise": "linear-gradient(135deg, #d97706, #dc2626)",
  krativerse: "linear-gradient(135deg, #db2777, #7c3aed)",
};

const AVATAR_GRADIENT_POOL = [
  "linear-gradient(135deg, #7c3aed, #4f46e5)",
  "linear-gradient(135deg, #0891b2, #0d9488)",
  "linear-gradient(135deg, #d97706, #dc2626)",
  "linear-gradient(135deg, #db2777, #7c3aed)",
];

function companyHeaderGradient(slug) {
  const s = String(slug || "");
  return COMPANY_HEADER_GRADIENT[s] || "linear-gradient(135deg, #7c3aed, #4f46e5)";
}

function hashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function reviewInitials(displayName) {
  const raw = String(displayName || "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[0][0]}`.toUpperCase();
}

function avatarGradientForName(name) {
  const i = hashString(name) % AVATAR_GRADIENT_POOL.length;
  return AVATAR_GRADIENT_POOL[i];
}

/** 5×28px stars: #d1d5db default, #f59e0b on hover + selected */
function ListingStarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div
      className="flex gap-0.5"
      role="group"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= display;
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="p-0.5 leading-none transition-colors"
            style={{ color: active ? "#f59e0b" : "#d1d5db" }}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <span className="select-none" style={{ fontSize: 28 }} aria-hidden>
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Media({ src, className, alt = "" }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return <div className={`bg-gradient-to-br from-slate-100 to-slate-200 ${className}`} aria-hidden />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setErr(true)}
    />
  );
}

function CompactReviewSummary({ reviewDetail }) {
  const { count, avg, dist } = reviewDetail;
  const total = count || 0;
  const rows = [5, 4, 3, 2, 1].map((n) => ({ n, c: dist?.[`s${n}`] ?? 0 }));
  const max = Math.max(1, ...rows.map((r) => r.c));
  return (
    <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Review summary</p>
        <p className="text-sm font-black text-slate-900">
          {count > 0 ? `${avg.toFixed(1)} avg` : "No rating yet"} <span className="font-semibold text-slate-500">·</span>{" "}
          <span className="tabular-nums text-slate-700">
            {count} review{count === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      <div className="mt-2 space-y-1">
        {rows.map((r) => {
          const w = total > 0 ? Math.round((r.c / max) * 100) : 0;
          return (
            <div key={r.n} className="flex items-center gap-2">
              <span className="w-8 text-[10px] font-bold text-slate-500">{r.n}★</span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-slate-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                  style={{ width: `${w}%` }}
                />
              </div>
              <span className="w-5 text-right text-[10px] tabular-nums text-slate-400">{r.c}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso || "");
  }
}

function normalizeListingDetails(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw);
      return o && typeof o === "object" ? o : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw;
  return null;
}

function listingDetailsSectionTitle(kind) {
  if (kind === "coffee") return "Product details";
  if (kind === "academy") return "Course details";
  return "Listing details";
}

export default function MarketplaceListingDetail() {
  const { slug: slugParam } = useParams();
  const slug = slugParam != null ? decodeURIComponent(String(slugParam)) : "";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewFormRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const { recordCompanySurface, recordReview } = useMarketplaceUserTracking(user, isAuthenticated);

  const [payload, setPayload] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lsTick, setLsTick] = useState(0);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [formErr, setFormErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const off = subscribeAnalyticsUpdated(() => setLsTick((t) => t + 1));
    return off;
  }, []);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch(`/api/marketplace/listing/${encodeURIComponent(slug)}`);
      setPayload(data);
    } catch {
      setPayload(null);
      setLoadError("We couldn’t load this listing.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  const product = payload?.product ?? null;
  const relatedRaw = Array.isArray(payload?.related) ? payload.related : [];
  const productId = product?.id != null ? Number(product.id) : null;

  const listingMeta = useMemo(() => normalizeListingDetails(product?.listingDetails), [product?.listingDetails]);
  const partnerBrand = product?.companySlug ? displayCompanyName(product.companySlug) : "";
  const legalName = (product?.companyName || "").trim();
  const showLegalByline = Boolean(partnerBrand && legalName && legalName !== partnerBrand);

  const journeyId = product?.companySlug ? apiCompanySlugToJourneyCompanyId(product.companySlug) : null;
  const storefrontPath = journeyId ? partnerStorefrontPath(journeyId) : `/marketplace/companies/${product?.companySlug || ""}`;
  const externalUrl =
    (journeyId && partnerOriginalWebsiteUrl(journeyId)) || product?.companyUrl || "#";

  const analytics = useMemo(
    () => (productId != null ? getProductAnalytics(productId) : { visits: 0, reviewCount: 0, avgRating: 0, popularity: 0 }),
    [productId, lsTick],
  );
  const reviewDetail = useMemo(
    () => (productId != null ? getProductReviewDetail(productId) : { avg: 0, count: 0, recent: [] }),
    [productId, lsTick],
  );

  const customerReviews = useMemo(() => {
    if (productId == null) return [];
    const id = String(productId);
    return readAnalyticsReviews()
      .filter((r) => r.itemId === id)
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  }, [productId, lsTick]);

  const related = useMemo(() => {
    return relatedRaw
      .filter((r) => r.id !== product?.id)
      .slice(0, 4)
      .map((r) => {
        const a = getProductAnalytics(r.id);
        return {
          ...r,
          visitCount: a.visits,
          reviewCount: a.reviewCount,
          avgRating: a.reviewCount > 0 ? a.avgRating : 0,
        };
      });
  }, [relatedRaw, product?.id, lsTick]);

  useEffect(() => {
    if (!product?.companySlug || !isAuthenticated || !user || productId == null) return;
    const uk = getMarketplaceTrackingUserKey(user);
    if (!uk || !consumeSessionOnceKey(`${uk}|listing|${slug}|${productId}`)) return;
    appendMarketplaceVisit({
      user,
      hubFirstName: trackingDisplayFirstName(user),
      companySlug: product.companySlug,
      action: "view_details",
      itemSlug: product.slug ?? null,
      numericItemId: productId,
      itemName: product.name,
      path: marketplaceListingPath(slug),
    });
  }, [product, productId, isAuthenticated, user, slug]);

  useEffect(() => {
    if (!product) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const fromQuery = searchParams.get("review") === "1";
    if (hash === "#write-review" || fromQuery) {
      const t = window.setTimeout(() => {
        reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      if (fromQuery) {
        const next = new URLSearchParams(searchParams);
        next.delete("review");
        setSearchParams(next, { replace: true });
      }
      return () => window.clearTimeout(t);
    }
  }, [product, searchParams, setSearchParams]);

  const scrollToReview = () => {
    reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      document.getElementById("listing-review-comment")?.focus();
    }, 350);
  };

  const onVisitExternal = () => {
    if (!isAuthenticated || !user || !journeyId || !product?.companyName) return;
    recordCompanySurface({
      journeyCompanyId: journeyId,
      companyName: displayCompanyName(product.companySlug) || product.companyName,
      action: "visit_external_website",
      path: storefrontPath,
    });
  };

  const onOpenStorefront = () => {
    if (!isAuthenticated || !user || !journeyId || !product?.companyName) return;
    recordCompanySurface({
      journeyCompanyId: journeyId,
      companyName: displayCompanyName(product.companySlug) || product.companyName,
      action: "open_storefront",
      path: storefrontPath,
    });
  };

  function submitReview(e) {
    e.preventDefault();
    setFormErr("");
    setReviewSuccess(false);
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `${marketplaceListingPath(slug)}?review=1` } });
      return;
    }
    if (stars < 1) {
      setFormErr("Select a star rating.");
      return;
    }
    const b = comment.trim();
    if (!b) {
      setFormErr("Add a short comment.");
      return;
    }
    if (!product?.companySlug || productId == null) {
      setFormErr("Missing listing.");
      return;
    }
    setSubmitting(true);
    try {
      recordReview({
        rating: stars,
        productId,
        productSlug: product.slug ?? null,
        companySlug: product.companySlug,
        itemName: product.name,
        comment: b,
      });
      setStars(0);
      setComment("");
      setReviewSuccess(true);
      setLsTick((t) => t + 1);
    } catch (err) {
      setFormErr(err?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !payload) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
        <div className="relative z-10">
          <MarketingNav />
          <main className={`${SHELL} py-16`}>
            <p className="text-center text-slate-500">Loading listing…</p>
          </main>
          <MarketingFooter />
        </div>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
        <div className="relative z-10">
          <MarketingNav />
          <main className={`${SHELL} py-16`}>
            <p className="text-center text-slate-600">{loadError || "Listing not found."}</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                to="/marketplace/explore"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:border-violet-300"
              >
                Back to Marketplace Hub
              </Link>
            </div>
          </main>
          <MarketingFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <div className="relative z-10">
        <MarketingNav />

        <main className={`${SHELL} space-y-6 pb-14 pt-6 lg:space-y-7 lg:pt-8`}>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link
              to={storefrontPath}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-slate-800 shadow-sm transition hover:border-violet-300"
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden />
              Back to Storefront
            </Link>
            <Link
              to="/marketplace/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
            >
              Back to Marketplace Hub
            </Link>
          </nav>

          <div className="product-detail-hero grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-8">
            <div className="product-image-card flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.18)] lg:min-h-[480px] lg:p-6">
              <div className="relative flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 lg:min-h-0">
                <div className="group absolute inset-0 overflow-hidden">
                  <Media
                    src={product.heroImage}
                    className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    alt=""
                  />
                </div>
              </div>
            </div>

            <div className="product-info-card flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.18)] lg:min-h-[480px] lg:p-8">
              <nav className="text-[12px] leading-snug text-slate-500" aria-label="Breadcrumb">
                <Link to="/marketplace/explore" className="text-slate-500 transition hover:text-slate-700">
                  Marketplace
                </Link>
                <span className="mx-1.5 text-slate-400">›</span>
                <Link to={storefrontPath} className="text-slate-500 transition hover:text-slate-700">
                  {partnerBrand}
                </Link>
                <span className="mx-1.5 text-slate-400">›</span>
                <span className="text-slate-600">{product.name}</span>
              </nav>

              <h1 className="mt-4 font-display leading-tight text-[#111]" style={{ fontSize: 26, fontWeight: 800 }}>
                {product.name}
              </h1>
              {showLegalByline ? (
                <p className="mt-1.5 text-xs font-medium text-slate-500">by {legalName}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex select-none leading-none" aria-hidden style={{ fontSize: 18, color: "#f59e0b" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      style={{
                        color:
                          reviewDetail.count > 0 && s <= Math.round(Number(reviewDetail.avg) || 0)
                            ? "#f59e0b"
                            : "#e5e7eb",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span className="text-lg font-bold tabular-nums text-[#111]">
                  {reviewDetail.count > 0 ? reviewDetail.avg.toFixed(1) : "—"}
                </span>
                <span className="text-sm text-slate-500">
                  {reviewDetail.count} review{reviewDetail.count === 1 ? "" : "s"}
                  <span className="text-slate-300"> · </span>
                  {analytics.visits.toLocaleString()} visit{analytics.visits === 1 ? "" : "s"}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  style={{ background: companyHeaderGradient(product.companySlug) }}
                >
                  {partnerBrand}
                </span>
                <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-auto sm:pl-1">
                  {categoryRibbonLabel(product.category)}
                </span>
              </div>

              <p className="mt-5 text-[15px] leading-[1.8] text-[#374151]">{product.excerpt}</p>

              {listingMeta?.pricePrimary || listingMeta?.priceSecondary ? (
                <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
                  {listingMeta.pricePrimary ? (
                    <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-slate-900 md:text-[1.65rem]">
                      {listingMeta.pricePrimary}
                    </p>
                  ) : null}
                  {listingMeta.priceSecondary ? (
                    <p className="mt-0.5 text-sm font-semibold text-slate-600">{listingMeta.priceSecondary}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2.5 border-t border-slate-100 pt-6">
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onVisitExternal}
                  className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 text-sm font-bold text-white shadow-md ${HUB_GRADIENT_HOVER}`}
                >
                  View on Partner Website
                  <FiExternalLink className="h-4 w-4" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={scrollToReview}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border-2 border-violet-200 bg-white px-5 text-sm font-bold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80"
                >
                  Write a Review
                </button>
                <Link
                  to={storefrontPath}
                  onClick={onOpenStorefront}
                  className="inline-flex min-h-[40px] w-full items-center justify-center text-center text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
                >
                  Open Storefront
                </Link>
              </div>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)] lg:p-6">
            <h2 className="font-display text-lg font-bold text-slate-900 md:text-xl">About this listing</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
              {product.description?.trim() || product.excerpt || "No extended description yet."}
            </p>
            {listingMeta?.rows?.length ? (
              <>
                <div className="my-5 border-t border-slate-100" aria-hidden />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  {listingDetailsSectionTitle(listingMeta.kind)}
                </h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {listingMeta.rows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5"
                    >
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{row.label}</dt>
                      <dd className="mt-1 text-sm font-semibold leading-snug text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-[0_10px_36px_-28px_rgba(15,23,42,0.12)] lg:px-5 lg:py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Marketplace Activity</h2>
            <p className="mt-1.5 text-xs leading-snug text-slate-600">
              Ranked by marketplace engagement. Visits, reviews, and ratings help this listing surface in storefront and hub
              lists.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
              {[
                { label: "Visits", value: analytics.visits },
                {
                  label: "Reviews",
                  value: `${reviewDetail.count} review${reviewDetail.count === 1 ? "" : "s"}`,
                },
                {
                  label: "Average Rating",
                  value: reviewDetail.count > 0 ? reviewDetail.avg.toFixed(2) : "No rating yet",
                },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
                  <p className="mt-0.5 text-lg font-black tabular-nums leading-tight text-slate-900">{c.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div
            id="write-review"
            ref={reviewFormRef}
            className="grid gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6"
          >
            <section className="flex min-h-0 flex-col rounded-[16px] border border-[#f0f0f0] bg-white p-[20px] shadow-sm lg:min-h-[300px]">
              <h2 className="text-[15px] font-bold text-slate-900">Write a review</h2>
              {reviewSuccess ? (
                <p className="mt-3 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                  Review submitted successfully.
                </p>
              ) : null}
              {!isAuthenticated ? (
                <div
                  className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-100 border-l-4 border-l-[#7c3aed] bg-violet-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-medium text-slate-800">Sign in to share your experience</p>
                  <Link
                    to="/login"
                    state={{ from: `${marketplaceListingPath(slug)}?review=1` }}
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#6d28d9]"
                  >
                    Sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={submitReview} className="mt-4">
                  <div>
                    <ListingStarPicker value={stars} onChange={setStars} />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="listing-review-comment" className="sr-only">
                      Review comment
                    </label>
                    <textarea
                      id="listing-review-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[14px] text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
                      style={{ padding: 12, minHeight: 90 }}
                      placeholder="What did you like? Was the product/service helpful?"
                    />
                  </div>
                  {formErr ? <p className="mt-2 text-sm text-red-600">{formErr}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="float-right mt-4 rounded-[10px] border-0 px-6 py-2.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: "var(--grad-cta, linear-gradient(135deg, #a78bfa, #60a5fa))",
                      padding: "10px 24px",
                    }}
                  >
                    {submitting ? "Submitting…" : "Submit review"}
                  </button>
                  <div className="clear-both" aria-hidden />
                </form>
              )}
            </section>

            <section
              id="customer-reviews"
              className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)] transition hover:shadow-[0_14px_44px_-28px_rgba(15,23,42,0.14)] lg:min-h-[300px] lg:p-6"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">Customer Reviews</h2>
              <CompactReviewSummary reviewDetail={reviewDetail} />
              {customerReviews.length === 0 ? (
                <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-6 text-center lg:min-h-0 lg:flex-1 lg:py-8">
                  <p className="text-sm font-semibold text-slate-900">No reviews yet. Be the first to write one.</p>
                  <p className="mt-2 max-w-[18rem] text-xs leading-relaxed text-slate-600">
                    Share your experience to help other marketplace users.
                  </p>
                  <button
                    type="button"
                    onClick={scrollToReview}
                    className="mt-4 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80"
                  >
                    Write the first review
                  </button>
                </div>
              ) : (
                <ul className="mt-4 max-h-[min(420px,55vh)] list-none space-y-2.5 overflow-y-auto p-0 pr-1">
                  {customerReviews.map((r) => {
                    const who = r.userName || "Member";
                    const initials = reviewInitials(who);
                    const grad = avatarGradientForName(who);
                    return (
                      <li
                        key={r.id}
                        className="mb-2.5 rounded-[14px] border border-[#f0f0f0] bg-white p-4 shadow-sm last:mb-0"
                      >
                        <div className="flex gap-3">
                          <div
                            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                            style={{ background: grad, fontWeight: 700 }}
                            aria-hidden
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                              <span className="text-[14px] font-bold text-slate-900">{who}</span>
                              <time className="text-[12px] text-slate-500" dateTime={r.timestamp}>
                                {formatWhen(r.timestamp)}
                              </time>
                            </div>
                            <div className="mt-1 flex select-none leading-none" style={{ fontSize: 14, color: "#f59e0b" }} aria-label={`${r.rating} stars`}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} style={{ color: s <= Number(r.rating) ? "#f59e0b" : "#e5e7eb" }}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <p className="mt-2 text-[14px] leading-[1.7] text-[#374151]">{r.comment || "—"}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section>
            <h2 className="font-display text-lg font-bold text-slate-900 md:text-xl">
              More from {partnerBrand}
            </h2>
            {related.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No other listings from this company yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                {related.map((r) => (
                  <article
                    key={r.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                  >
                    <div className="relative h-[88px] shrink-0 overflow-hidden bg-slate-100 sm:h-[100px]">
                      <Media
                        src={r.heroImage}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        alt=""
                      />
                      <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-800 shadow-sm ring-1 ring-slate-200/80">
                        {categoryRibbonLabel(r.category)}
                      </span>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col p-2.5">
                      <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900">{r.name}</h3>
                      <p className="mt-1.5 text-[11px] text-slate-600">
                        <span className="font-semibold text-amber-600">
                          {r.reviewCount > 0 ? `${r.avgRating.toFixed(1)}★` : "No rating yet"}
                        </span>
                        <span className="text-slate-400"> · </span>
                        <span>{r.reviewCount} reviews</span>
                      </p>
                      <Link
                        to={marketplaceListingPath(r.slug)}
                        className={`mt-auto inline-flex min-h-[34px] items-center justify-center rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-2 text-center text-[11px] font-bold text-white ${HUB_GRADIENT_HOVER}`}
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <MarketingFooter />
      </div>
    </div>
  );
}
