import { useCallback, useEffect, useRef, useState } from "react";
import { FiHeart } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCatalog } from "../../context/CatalogContext.jsx";
import { apiFetch } from "../../lib/api.js";
import { categoryRibbonLabel, marketplaceListingPath } from "../../lib/marketplaceDisplay.js";

/** Preview rows from `/api/marketplace/companies` should include `id`; tolerate alternate keys. */
function previewListingId(p) {
  const n = Number(p?.id ?? p?.productId ?? p?.product_id);
  return Number.isFinite(n) ? n : null;
}

function hashToIndex(str, mod) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

const BANNER_GRADIENTS = [
  "from-violet-600 via-fuchsia-600 to-indigo-800",
  "from-sky-600 via-cyan-600 to-teal-800",
  "from-amber-600 via-orange-500 to-rose-700",
  "from-emerald-600 via-teal-600 to-cyan-900",
];

/**
 * Banner: real image when available; otherwise branded gradient with company name.
 * When image loads, optional bottom scrim keeps polish consistent with marketplace cards.
 */
function CompanyCardBanner({ bannerUrl, companyName, categoryLabel, slug }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(bannerUrl?.trim()) && !imgFailed;
  const gradient = BANNER_GRADIENTS[hashToIndex(slug, BANNER_GRADIENTS.length)];
  const initial = (companyName || "?").trim().slice(0, 1).toUpperCase();

  return (
    <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-44">
      {showImage ? (
        <>
          <img
            src={bannerUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/5 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div
          className={`flex h-full w-full flex-col justify-end bg-gradient-to-br p-5 text-white ${gradient}`}
          aria-hidden
        >
          <div className="flex items-end gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold shadow-inner backdrop-blur-[2px] ring-1 ring-white/25">
              {initial}
            </span>
            <div className="min-w-0 pb-0.5">
              <p className="truncate font-display text-lg font-bold leading-tight tracking-tight drop-shadow-sm">
                {companyName}
              </p>
              {categoryLabel ? (
                <p className="mt-1 line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-white/85">
                  {categoryLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardCompanies() {
  const { companies, previewByCompany } = useCatalog();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favIds, setFavIds] = useState(() => new Set());
  const favIdsRef = useRef(favIds);
  const [toast, setToast] = useState("");

  favIdsRef.current = favIds;

  const syncFavoritesFromServer = useCallback(async () => {
    try {
      const rows = await apiFetch("/api/marketplace/favorites");
      if (!Array.isArray(rows)) return;
      setFavIds(new Set(rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n))));
    } catch {
      /* keep current UI state */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading && !isAuthenticated) setFavIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiFetch("/api/marketplace/favorites");
        if (cancelled || !Array.isArray(rows)) return;
        setFavIds(new Set(rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n))));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleFavorite = useCallback(
    async (productId, e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      const pid = Number(productId);
      if (!Number.isFinite(pid)) return;
      if (!isAuthenticated) {
        navigate("/login", { state: { from: "/dashboard/companies" } });
        return;
      }
      const was = favIdsRef.current.has(pid);
      try {
        if (was) {
          await apiFetch(`/api/marketplace/favorites/${pid}`, { method: "DELETE" });
          setFavIds((s) => {
            const n = new Set(s);
            n.delete(pid);
            return n;
          });
          setToast("Removed from favorites");
        } else {
          await apiFetch(`/api/marketplace/favorites/${pid}`, { method: "POST" });
          setFavIds((s) => new Set(s).add(pid));
          setToast("Saved to favorites");
        }
        await syncFavoritesFromServer();
      } catch {
        setToast("Could not update favorites");
        await syncFavoritesFromServer();
      }
    },
    [isAuthenticated, navigate, syncFavoritesFromServer],
  );

  return (
    <div className="min-w-0 max-w-full space-y-7 pb-2">
      <header className="min-w-0 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Companies</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111827] md:text-[2rem]">
            Sovereign storefronts · unified discovery
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-[#6B7280] md:max-w-3xl">
          Use the heart next to a preview listing to save it. Saved items appear under{" "}
          <Link
            to="/dashboard/favorites"
            className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
          >
            Favorites
          </Link>
          .
        </p>
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 via-white to-fuchsia-50/70 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-violet-500/5 ring-1 ring-violet-100/60 md:max-w-3xl">
          <span className="font-medium text-slate-800">Tip:</span> Each row under{" "}
          <span className="font-semibold text-violet-900">Top preview</span> is a real listing — use the
          heart to pin it without leaving this page.
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        {companies.map((c) => {
          const top = previewByCompany[String(c.id)] || [];
          const categoryForBanner = top[0]?.category ? categoryRibbonLabel(top[0].category) : null;

          return (
            <GlassCard
              key={c.slug}
              className="flex min-w-0 flex-col overflow-hidden shadow-[0_12px_40px_-28px_rgba(15,23,42,0.14)]"
              hover={false}
            >
              <CompanyCardBanner
                bannerUrl={c.bannerUrl}
                companyName={c.name}
                categoryLabel={categoryForBanner}
                slug={c.slug}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-semibold leading-snug text-[#111827]">{c.name}</h2>
                    {c.tagline ? (
                      <p className="mt-1 text-sm font-medium text-violet-800/90">{c.tagline}</p>
                    ) : null}
                  </div>
                  <Link
                    to={`/marketplace/companies/${c.slug}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-4 py-2.5 text-center text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:brightness-[1.03] active:brightness-[0.98] sm:min-w-[5.5rem]"
                  >
                    Open
                  </Link>
                </div>
                {c.description ? (
                  <p className="line-clamp-4 text-sm leading-relaxed text-[#6B7280]">{c.description}</p>
                ) : null}

                <div className="min-w-0 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 ring-1 ring-slate-100/80">
                  <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Top preview</p>
                      <p className="mt-0.5 text-xs text-slate-600">Popular listings · save with the heart</p>
                    </div>
                  </div>
                  {top.length === 0 ? (
                    <p className="py-2 text-sm text-slate-500">No preview listings yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {top.slice(0, 3).map((p) => {
                        const listingId = previewListingId(p);
                        const saved = listingId != null && favIds.has(listingId);
                        const rowTo =
                          p.slug != null
                            ? marketplaceListingPath(p.slug)
                            : listingId != null
                              ? `/marketplace/products/${listingId}`
                              : null;

                        return (
                          <li
                            key={listingId ?? `${c.slug}-${p.slug ?? p.name}`}
                            className="flex min-w-0 items-stretch gap-1 rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-slate-200/60"
                          >
                            <div className="min-w-0 flex-1 py-1.5 pl-2.5 pr-1">
                              {rowTo ? (
                                <Link
                                  to={rowTo}
                                  className="block min-w-0 text-sm font-semibold leading-snug text-violet-900 transition hover:text-cyan-700 hover:underline"
                                >
                                  <span className="line-clamp-2">{p.name}</span>
                                </Link>
                              ) : (
                                <span className="block min-w-0 text-sm font-semibold leading-snug text-slate-800">
                                  <span className="line-clamp-2">{p.name}</span>
                                </span>
                              )}
                            </div>
                            {listingId != null ? (
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(listingId, e)}
                                title={saved ? "Saved — click to remove from Favorites" : "Save to favorites"}
                                className={`relative z-20 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md transition ${
                                  saved
                                    ? "text-rose-500 hover:bg-rose-50"
                                    : "text-slate-400 hover:bg-violet-50 hover:text-rose-500"
                                }`}
                                aria-label={saved ? "Saved — remove from favorites" : "Save to favorites"}
                              >
                                <FiHeart
                                  className={`h-[22px] w-[22px] ${saved ? "fill-rose-500 text-rose-500" : ""}`}
                                  strokeWidth={saved ? 0 : 1.75}
                                  aria-hidden
                                />
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {toast ? (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 right-6 z-[110] max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
