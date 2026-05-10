import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
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
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Leaderboards calibrated for your cohort demo
        </h1>
      </div>

      <GlassCard className="p-6" glow>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Marketplace · top 5
        </div>
        <div className="mt-6 space-y-3">
          {(board?.globalTop || []).map((p, i) => (
            <Link key={p.id} to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}>
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-hub-violet/50">
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-white/10 text-lg">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `0${i + 1}`}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.companyName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {(Number(p.popularityScore) || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">score</div>
                </div>
              </div>
            </Link>
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
                  <div className="font-display text-lg font-semibold text-white">{c.name}</div>
                  <div className="text-xs text-slate-400">Enterprise top 5</div>
                </div>
                <Link
                  to={`/marketplace/companies/${c.slug}`}
                  className="text-[11px] font-semibold text-hub-cyan hover:underline"
                >
                  View →
                </Link>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {top.slice(0, 5).map((p, i) => (
                  <li key={p.id}>
                    <Link to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 hover:border-hub-cyan/35">
                        <span className="text-xs text-slate-500">{i + 1}</span>
                        <span className="flex-1 text-slate-100">{p.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-hub-cyan">open</span>
                      </div>
                    </Link>
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
