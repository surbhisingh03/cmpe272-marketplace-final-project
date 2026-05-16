import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiHeart, FiRefreshCw } from "react-icons/fi";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import { marketplaceListingPath } from "../../lib/marketplaceDisplay.js";

async function loadFavorites() {
  const data = await apiFetch("/api/marketplace/favorites");
  return Array.isArray(data) ? data : [];
}

export default function DashboardFavorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async (opts = { silent: false }) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const list = await loadFavorites();
      setItems(list);
    } catch (e) {
      setError(e?.message || "Could not load favorites.");
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await loadFavorites();
      setItems(list);
      setError(null);
    } catch (e) {
      setError(e?.message || "Could not load favorites.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const removeFavorite = useCallback(async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiFetch(`/api/marketplace/favorites/${productId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((p) => Number(p.id) !== Number(productId)));
    } catch {
      /* keep UI; user can refresh */
    }
  }, []);

  const count = items.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Favorites</div>
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold text-[#111827]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25">
              <FiHeart className="h-5 w-5" aria-hidden />
            </span>
            Saved listings
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#6B7280]">
            Anything you tap the heart on while signed in shows up here — from{" "}
            <Link to="/marketplace/explore" className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900">
              Explore
            </Link>
            , a partner storefront, or a listing / product page. Press &quot;Refresh list&quot; if something you just saved
            doesn&apos;t appear.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60"
        >
          <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          {refreshing ? "Refreshing…" : "Refresh list"}
        </button>
      </div>

      <div
        className={`rounded-2xl border px-5 py-4 ${
          count > 0
            ? "border-violet-200/90 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50/80"
            : "border-slate-200 bg-slate-50/80"
        }`}
      >
        <p className="text-sm font-medium text-slate-800">
          {loading ? (
            "Loading your saved listings…"
          ) : error ? (
            <span className="text-rose-700">{error}</span>
          ) : count === 0 ? (
            <>
              <span className="font-semibold">No favorites yet.</span> Save a listing and press &quot;Refresh list&quot;
              above if it doesn&apos;t appear right away.
            </>
          ) : (
            <>
              <span className="font-semibold tabular-nums text-violet-900">{count}</span> saved listing
              {count === 1 ? "" : "s"} — quick access below.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!loading &&
          items.map((p) => (
            <Link
              key={p.id}
              to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
              className="group block no-underline"
            >
              <GlassCard className="h-full overflow-hidden p-0 transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={p.heroImage}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 shadow-sm">
                    Saved
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeFavorite(p.id, e)}
                    className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-rose-50 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold leading-snug text-[#111827] group-hover:text-violet-900">
                      {p.name}
                    </div>
                    <FiArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                  </div>
                  <div className="text-xs font-medium text-violet-800/90">{p.companyName}</div>
                  {p.excerpt ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-[#6B7280]">{p.excerpt}</p>
                  ) : null}
                  <div className="text-[11px] text-slate-500">
                    {Number(p.visitCount) || 0} marketplace visit{(Number(p.visitCount) || 0) === 1 ? "" : "s"}
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}

        {!loading && count === 0 && !error && (
          <GlassCard className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center md:col-span-2 xl:col-span-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600">
              <FiHeart className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-slate-900">Start collecting favorites</h2>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Favorites live in the dashboard sidebar under <strong>Favorites</strong>. On any listing, use the bookmark
              / heart control while you&apos;re logged in.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/marketplace/explore"
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95"
              >
                Browse Explore
              </Link>
              <Link
                to="/dashboard/home"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-violet-200"
              >
                Dashboard home
              </Link>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
