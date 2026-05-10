import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiExternalLink, FiStar } from "react-icons/fi";
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
import { HUB_GRADIENT_HOVER, STOREFRONT_COMPANY_META } from "../lib/storefrontBranding.js";

const SHELL = "mx-auto w-full max-w-[1320px] px-6 lg:px-8";

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
          <FiStar className={`h-7 w-7 ${n <= value ? "fill-current" : ""}`} aria-hidden />
        </button>
      ))}
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
  const meta = product?.companySlug ? STOREFRONT_COMPANY_META[product.companySlug] : null;
  const accent = meta?.accent;
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
      <div className="relative min-h-screen overflow-x-hidden bg-[#eaeef4] text-slate-900 antialiased">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-[min(12%,10rem)] top-[-18%] h-[min(52rem,130vw)] w-[min(52rem,130vw)] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.20)_0%,transparent_62%)]" />
        </div>
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
      <div className="relative min-h-screen overflow-x-hidden bg-[#eaeef4] text-slate-900 antialiased">
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

  const ratingLabel =
    reviewDetail.count > 0 ? `${reviewDetail.avg.toFixed(1)} out of 5` : "No rating yet";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#eaeef4] text-slate-900 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[min(12%,10rem)] top-[-18%] h-[min(52rem,130vw)] w-[min(52rem,130vw)] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.20)_0%,transparent_62%)]" />
        <div className="absolute right-[-8%] top-[26%] h-[min(42rem,100vw)] w-[min(42rem,100vw)] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16)_0%,transparent_64%)]" />
      </div>

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

            <div
              className={`product-info-card flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.18)] lg:min-h-[480px] lg:p-8 ${
                accent ? `bg-gradient-to-br ${accent.softBg}` : ""
              }`}
            >
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                    accent?.badge ?? "bg-slate-100 text-slate-800 ring-slate-200/80"
                  }`}
                >
                  {displayCompanyName(product.companySlug)}
                </span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-800 ring-1 ring-violet-200/80">
                  {categoryRibbonLabel(product.category)}
                </span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                {product.name}
              </h1>
              {showLegalByline ? (
                <p className="mt-1.5 text-xs font-medium text-slate-500">by {legalName}</p>
              ) : null}

              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-slate-200/60">
                {listingMeta?.pricePrimary || listingMeta?.priceSecondary ? (
                  <div>
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
                <p className={`text-[15px] leading-relaxed text-slate-700 ${listingMeta?.pricePrimary || listingMeta?.priceSecondary ? "mt-3 border-t border-slate-100 pt-3" : ""}`}>
                  {product.excerpt}
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
                <div className="rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 shadow-sm">
                  <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Rating</dt>
                  <dd className={`mt-0.5 text-base font-black ${accent?.stat ?? "text-slate-900"}`}>
                    {reviewDetail.count > 0 ? reviewDetail.avg.toFixed(1) : "—"}
                  </dd>
                  <dd className="text-[11px] text-slate-500">{ratingLabel}</dd>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 shadow-sm">
                  <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Reviews</dt>
                  <dd className="mt-0.5 text-base font-black text-slate-900">
                    {reviewDetail.count} review{reviewDetail.count === 1 ? "" : "s"}
                  </dd>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 shadow-sm">
                  <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Visits</dt>
                  <dd className="mt-0.5 text-base font-black text-slate-900">{analytics.visits}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2.5">
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
            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.12)] lg:min-h-[300px] lg:p-6">
              <h2 className="font-display text-lg font-bold text-slate-900">Write a Review</h2>
              {reviewSuccess ? (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                  Review submitted successfully.
                </p>
              ) : null}
              {!isAuthenticated ? (
                <p className="mt-3 text-sm text-slate-600">
                  <Link to="/login" state={{ from: `${marketplaceListingPath(slug)}?review=1` }} className="font-bold text-violet-700 underline">
                    Sign in
                  </Link>{" "}
                  to submit a review.
                </p>
              ) : (
                <form onSubmit={submitReview} className="mt-4 space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-600">Your rating</p>
                    <StarInput value={stars} onChange={setStars} />
                  </div>
                  <div>
                    <label htmlFor="listing-review-comment" className="text-xs font-medium text-slate-600">
                      Review comment
                    </label>
                    <textarea
                      id="listing-review-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/25"
                      placeholder="What did you like? Was the product/service helpful?"
                    />
                  </div>
                  {formErr ? <p className="text-sm text-red-600">{formErr}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`inline-flex min-h-[42px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-6 text-sm font-bold text-white shadow-md disabled:opacity-50 sm:w-auto ${HUB_GRADIENT_HOVER}`}
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
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
                <ul className="mt-4 max-h-[min(280px,42vh)] space-y-3 overflow-y-auto pr-1">
                  {customerReviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{r.userName || "Member"}</p>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-900">
                          Verified Marketplace User
                        </span>
                      </div>
                      <div className="mt-1.5 flex text-amber-500" aria-label={`${r.rating} stars`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FiStar key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-current" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {displayCompanyName(product.companySlug)} · {product.name}
                      </p>
                      <p className="mt-2 text-sm text-slate-800">{r.comment || "—"}</p>
                      <p className="mt-2 text-[11px] font-medium text-slate-500">{formatWhen(r.timestamp)}</p>
                    </li>
                  ))}
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
