import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { buildStorefrontPayloadFromCatalog } from "../lib/companyStorefrontFallback.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";
import {
  apiCompanySlugToJourneyCompanyId,
  consumeSessionOnceKey,
  getMarketplaceTrackingUserKey,
  journeyCompanyIdToApiSlug,
  normalizeJourneyCompanyIdParam,
  partnerStorefrontPath,
} from "../lib/marketplaceUserTracking.js";
import { displayCompanyName } from "../lib/marketplaceDisplay.js";
import StorefrontMarketplaceView from "./StorefrontMarketplaceView.jsx";

function mergePayloadWithCatalog(payload, catalogItems) {
  const byId = new Map((catalogItems || []).map((i) => [i.id, i]));
  const products = (payload.products || []).map((p) => ({
    ...p,
    avgRating: 0,
    reviewCount: 0,
    visitCount: 0,
    createdAt: byId.get(p.id)?.createdAt ?? p.createdAt ?? null,
  }));
  const company = { ...payload.company, avgRating: 0, reviewCount: 0 };
  return { company, products };
}

/** Tailwind gradient classes (no spaces) for full-bleed company hero */
const COMPANY_STOREFRONT_THEME = {
  "srikavya-enterprise": {
    heroGradient: "from-amber-600 via-orange-600 to-red-900",
    owner: "Geeshitha Gelli",
  },
  krativerse: {
    heroGradient: "from-purple-600 via-violet-700 to-indigo-950",
    owner: "Surbhi",
  },
  "travel-agency": {
    heroGradient: "from-cyan-500 via-teal-600 to-teal-950",
    owner: "Surbhi Singh",
  },
  "nexus-academy": {
    heroGradient: "from-pink-500 via-fuchsia-600 to-purple-950",
    owner: "Geeshitha",
  },
};

function VisitTrackedToast({ open }) {
  const visible = Boolean(open);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 z-[500] max-w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-emerald-200/90 bg-white px-5 py-4 text-sm font-bold text-emerald-950 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)] transition-[right,opacity] duration-300 ease-out"
      style={{ right: visible ? "1.5rem" : "-18rem", opacity: visible ? 1 : 0 }}
    >
      ✓ Visit tracked!
    </div>
  );
}

export function MarketplaceStorefrontPage() {
  const { journeySlug } = useParams();
  const jid = normalizeJourneyCompanyIdParam(journeySlug);
  const apiSlug = jid ? journeyCompanyIdToApiSlug(jid) : null;
  if (!apiSlug) return <Navigate to="/marketplace/explore" replace />;
  return <CompanyDetailBody apiSlug={apiSlug} />;
}

export default function CompanyDetail() {
  const { slug } = useParams();
  return <CompanyDetailBody apiSlug={slug} />;
}

function StorefrontLoadShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <div className="relative z-10">
        <MarketingNav />
        <main className="mx-auto max-w-[1320px] px-6 pb-16 pt-8 lg:px-8">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}

function CompanyDetailBody({ apiSlug }) {
  const [displayPayload, setDisplayPayload] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const { recordCompanySurface } = useMarketplaceUserTracking(user, isAuthenticated);
  const journeyId = apiCompanySlugToJourneyCompanyId(apiSlug);
  const internalStorefrontPath = journeyId ? partnerStorefrontPath(journeyId) : `/marketplace/companies/${apiSlug}`;

  const [visitBumpNonce, setVisitBumpNonce] = useState(0);
  const [visitToastOpen, setVisitToastOpen] = useState(false);
  const toastDismissTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setDisplayPayload(null);
    setLoadError(null);

    (async () => {
      let payload = null;
      try {
        payload = await apiFetch(`/api/marketplace/companies/${apiSlug}`);
      } catch {
        try {
          const cat = await apiFetch("/api/marketplace/catalog");
          const items = Array.isArray(cat?.items) ? cat.items : [];
          payload = buildStorefrontPayloadFromCatalog(items, apiSlug);
          if (!payload) {
            if (!cancelled) setLoadError("no-data");
            return;
          }
        } catch {
          if (!cancelled) setLoadError("network");
          return;
        }
      }

      if (cancelled || !payload) return;

      try {
        const cat = await apiFetch("/api/marketplace/catalog");
        const items = Array.isArray(cat?.items) ? cat.items : [];
        payload = mergePayloadWithCatalog(payload, items);
      } catch {
        payload = mergePayloadWithCatalog(payload, []);
      }

      if (!cancelled) setDisplayPayload(payload);
    })();

    return () => {
      cancelled = true;
    };
  }, [apiSlug, reloadKey]);

  useEffect(() => {
    const co = displayPayload?.company?.slug;
    if (!co || !isAuthenticated || !user || !journeyId) return;
    const uk = getMarketplaceTrackingUserKey(user);
    if (!uk || !consumeSessionOnceKey(`${uk}|storefront|${co}`)) return;
    recordCompanySurface({
      journeyCompanyId: journeyId,
      companyName: displayCompanyName(apiSlug) || displayPayload.company?.name || undefined,
      action: "open_storefront",
      path: internalStorefrontPath,
    });
    setVisitBumpNonce((n) => n + 1);
    setVisitToastOpen(true);
    if (toastDismissTimerRef.current) clearTimeout(toastDismissTimerRef.current);
    toastDismissTimerRef.current = setTimeout(() => {
      setVisitToastOpen(false);
      toastDismissTimerRef.current = null;
    }, 2500);
    return () => {
      if (toastDismissTimerRef.current) clearTimeout(toastDismissTimerRef.current);
    };
  }, [displayPayload, isAuthenticated, user, internalStorefrontPath, journeyId, recordCompanySurface, apiSlug]);

  const theme = COMPANY_STOREFRONT_THEME[apiSlug] || {
    heroGradient: "from-slate-700 via-violet-800 to-slate-950",
    owner: "Partner team",
  };

  if (loadError) {
    return (
      <StorefrontLoadShell>
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white px-8 py-12 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {loadError === "no-data" ? "Storefront not found" : "Can’t load storefront"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {loadError === "network"
              ? "FusionHub couldn’t reach the marketplace API. From the project folder, start the server (for example port 5001) so Vite can proxy /api, then try again."
              : "No listings matched this company in the catalog."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-6 py-3 text-sm font-bold text-white shadow-md"
            >
              Retry
            </button>
            <Link
              to="/marketplace/explore"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:border-violet-300"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </StorefrontLoadShell>
    );
  }

  if (!displayPayload) {
    return (
      <StorefrontLoadShell>
        <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-slate-200/90 bg-white text-slate-500 shadow-sm">
          Loading storefront…
        </div>
      </StorefrontLoadShell>
    );
  }

  const { company, products } = displayPayload;

  return (
    <>
      <VisitTrackedToast open={visitToastOpen} />
      <StorefrontMarketplaceView
        apiSlug={apiSlug}
        journeyId={journeyId}
        company={company}
        products={products}
        internalStorefrontPath={internalStorefrontPath}
        heroGradientClass={theme.heroGradient}
        companyOwnerDisplay={theme.owner}
        visitBumpNonce={visitBumpNonce}
      />
    </>
  );
}
