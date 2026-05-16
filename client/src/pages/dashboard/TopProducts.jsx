import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import LeaderboardListRow from "../../components/marketplace/LeaderboardListRow.jsx";
import { marketplaceListingPath } from "../../lib/marketplaceDisplay.js";
import { useCatalog } from "../../context/CatalogContext.jsx";
import { subscribeAnalyticsUpdated } from "../../lib/fusionhubAnalytics.js";
import {
  getExploreHubTopFiveMergedRows,
  getExplorePartnerCompanyTopListings,
  mapCatalogItemsToExploreItemsLive,
} from "../../lib/exploreMarketplaceTopFive.js";

export default function DashboardTopProducts() {
  const { companies } = useCatalog();
  const [catalogItems, setCatalogItems] = useState([]);
  const [analyticsTick, setAnalyticsTick] = useState(0);

  useEffect(() => {
    const off = subscribeAnalyticsUpdated(() => setAnalyticsTick((t) => t + 1));
    return off;
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/marketplace/catalog")
      .then((res) => {
        if (cancelled) return;
        const list = res?.items;
        setCatalogItems(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setCatalogItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const itemsLive = useMemo(() => {
    void analyticsTick;
    return mapCatalogItemsToExploreItemsLive(catalogItems);
  }, [catalogItems, analyticsTick]);

  const hubTopFiveMerged = useMemo(() => getExploreHubTopFiveMergedRows(itemsLive), [itemsLive]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Top Products</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#111827]">
          Leaderboards calibrated for your cohort demo
        </h1>
      </div>

      <GlassCard className="p-6">
        <div className="font-display text-xl font-semibold text-[#111827]">🏆 Top 5 Marketplace</div>
        <div className="mt-6 flex flex-col gap-3">
          {hubTopFiveMerged.map((row) => (
            <LeaderboardListRow
              key={row.id}
              rank={row.rank}
              title={row.title}
              subtitle={row.companyLabel}
              category={row.category}
              reviewCount={row.reviewsDisplay}
              avgRating={row.ratingDisplay}
              to={row.listingTo}
            />
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {companies.map((c) => {
          const top = getExplorePartnerCompanyTopListings(itemsLive, c.slug);
          return (
            <GlassCard key={c.slug} className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-semibold text-[#111827]">{c.name}</div>
                  <div className="text-xs text-[#6B7280]">Enterprise top 5</div>
                </div>
                <Link
                  to={`/marketplace/companies/${c.slug}`}
                  className="text-[11px] font-semibold text-cyan-700 hover:underline"
                >
                  View →
                </Link>
              </div>
              <ul className="mt-5 flex list-none flex-col gap-3 p-0">
                {top.map((p, i) => (
                  <li key={p.id} className="list-none">
                    <LeaderboardListRow
                      rank={i + 1}
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
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
