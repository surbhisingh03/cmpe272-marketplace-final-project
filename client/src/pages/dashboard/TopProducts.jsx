import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import LeaderboardListRow from "../../components/marketplace/LeaderboardListRow.jsx";
import { marketplaceListingPath } from "../../lib/marketplaceDisplay.js";
import { useCatalog } from "../../context/CatalogContext.jsx";

export default function DashboardTopProducts() {
  const { companies } = useCatalog();
  const [board, setBoard] = useState(null);

  useEffect(() => {
    apiFetch("/api/marketplace/leaderboards").then(setBoard).catch(() => {});
  }, []);

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
          {(board?.globalTop || []).map((p, i) => (
            <LeaderboardListRow
              key={p.id}
              rank={i + 1}
              title={p.name}
              subtitle={p.companyName}
              category={p.category}
              reviewCount={p.reviewCount}
              avgRating={p.avgRating}
              to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
            />
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {companies.map((c) => {
          const top = board?.perCompany?.[String(c.id)] || [];
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
                {top.slice(0, 5).map((p, i) => (
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
