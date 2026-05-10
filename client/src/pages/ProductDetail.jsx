import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBookmark, FiExternalLink } from "react-icons/fi";
import PublicShell from "../components/layout/PublicShell.jsx";
import GradientMesh from "../components/layout/GradientMesh.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getProductAnalytics,
  getProductReviewDetail,
  subscribeAnalyticsUpdated,
} from "../lib/fusionhubAnalytics.js";
import {
  apiCompanySlugToJourneyCompanyId,
  appendCompanySurfaceVisit,
  partnerOriginalWebsiteUrl,
  partnerStorefrontPath,
  trackingDisplayFirstName,
} from "../lib/marketplaceUserTracking.js";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";
import ReviewModal from "../components/reviews/ReviewModal.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";

const tabs = ["Overview", "Reviews", "Activity"];

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

  useEffect(() => {
    reviewQueryConsumed.current = false;
  }, [id]);

  useEffect(() => {
    const off = subscribeAnalyticsUpdated(() => setLsTick((t) => t + 1));
    return off;
  }, []);

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
          setFavIds(new Set(rows.map((r) => r.id)));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, reload]);

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
    } catch {
      /* ignore */
    }
  }

  if (!data) {
    return (
      <PublicShell>
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
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

  return (
    <PublicShell>
      <div className="relative">
        <GradientMesh />
        <section>
          <div className="relative h-[420px] w-full overflow-hidden">
            <img src={product.heroImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-hub-bg via-hub-bg/40 to-hub-bg/10" />
            <div className="absolute bottom-0 left-0 right-0">
              <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pb-10 lg:px-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-300">
                    {product.companyName}
                  </div>
                  <h1 className="mt-2 font-display text-4xl font-bold text-white md:text-5xl">
                    {product.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-slate-200">{product.excerpt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleFav}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
                  >
                    <FiBookmark className={isFav ? "text-hub-cyan" : ""} />
                    {isFav ? "Saved" : "Favorite"}
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
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    tab === t
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
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
                  <h2 className="font-display text-xl font-semibold text-white">Details</h2>
                  <p className="mt-4 leading-relaxed text-slate-300">{product.description}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-slate-500">Category</div>
                      <div className="mt-1 text-sm text-white">{product.category}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-slate-500">Total visits</div>
                      <div className="mt-1 text-sm text-white">
                        <AnimatedNumber value={lsProductStats.visits} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-slate-500">Reviews</div>
                      <div className="mt-1 text-sm text-white">
                        <AnimatedNumber value={lsReviewDetail.count} />
                      </div>
                    </div>
                  </div>
                </GlassCard>
                <div className="space-y-6">
                  <GlassCard className="p-6">
                    <div className="text-xs uppercase tracking-widest text-slate-500">
                      Reputation
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="font-display text-4xl font-bold text-white">
                        {lsReviewDetail.count > 0 ? Number(lsReviewDetail.avg || 0).toFixed(2) : "—"}
                      </div>
                      <div className="text-sm text-slate-400">
                        {lsReviewDetail.count > 0
                          ? `${lsReviewDetail.count} review${lsReviewDetail.count === 1 ? "" : "s"}`
                          : "No rating yet"}
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-hub-violet to-hub-cyan"
                        style={{
                          width: `${lsReviewDetail.count > 0 ? Math.min(100, (Number(lsReviewDetail.avg) / 5) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </GlassCard>
                  <GlassCard className="p-6">
                    <div className="text-xs uppercase tracking-widest text-slate-500">
                      Related
                    </div>
                    <ul className="mt-3 space-y-2">
                      {related.map((r) => (
                        <li key={r.id}>
                          <Link
                            to={`/marketplace/products/${r.id}`}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-hub-violet/40"
                          >
                            <span className="text-white">{r.name}</span>
                            <span className="text-[10px] text-slate-500">view</span>
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
                  <div className="text-xs uppercase tracking-widest text-slate-500">
                    Distribution
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-200">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const key = `s${s}`;
                      const val = dist ? Number(dist[key] || 0) : 0;
                      const total = Math.max(Number(dist?.total || 0), 1);
                      const pct = Math.round((val / total) * 100);
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className="w-6 text-xs text-slate-500">{s}★</div>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-hub-violet to-hub-cyan"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-8 text-right text-xs text-slate-500">{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
                <div className="space-y-4">
                  {lsReviewDetail.recent.length === 0 ? (
                    <GlassCard className="p-6" hover={false}>
                      <p className="text-sm text-slate-300">
                        No reviews yet. Be the first to write one.
                      </p>
                    </GlassCard>
                  ) : (
                    lsReviewDetail.recent.map((rv) => (
                      <GlassCard key={rv.id} className="p-5" hover={false}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{rv.userName || "Member"}</div>
                            <div className="text-xs text-slate-500">{product.name}</div>
                          </div>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-amber-200">
                            {rv.rating}★
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">{rv.comment || "—"}</p>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === "Activity" && (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <GlassCard className="p-6">
                  <div className="text-xs text-slate-500">Listing visits</div>
                  <div className="mt-2 font-display text-3xl font-bold text-white">
                    <AnimatedNumber value={lsProductStats.visits} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Visits recorded when signed-in users open this listing.</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="text-xs text-slate-500">Reviews</div>
                  <div className="mt-2 font-display text-3xl font-bold text-white">
                    <AnimatedNumber value={lsReviewDetail.count} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Reviews submitted on the marketplace for this listing.</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="text-xs text-slate-500">Average rating</div>
                  <div className="mt-2 font-display text-3xl font-bold text-white">
                    {lsReviewDetail.count > 0 ? Number(lsReviewDetail.avg || 0).toFixed(2) : "—"}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {lsReviewDetail.count > 0 ? "From submitted star ratings." : "No rating yet."}
                  </p>
                </GlassCard>
              </div>
            )}
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
          recordReview({
            rating,
            productId: Number(id),
            productSlug: product.slug ?? null,
            companySlug: product.companySlug,
            itemName: product.name,
            comment,
          });
          setLsTick((t) => t + 1);
          reload();
        }}
      />
    </PublicShell>
  );
}
