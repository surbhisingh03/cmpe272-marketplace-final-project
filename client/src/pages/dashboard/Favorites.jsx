import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import { marketplaceListingPath } from "../../lib/marketplaceDisplay.js";

export default function Favorites() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiFetch("/api/marketplace/favorites").then(setItems).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Favorites</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Signals you starred across domains
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <Link key={p.id} to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}>
            <GlassCard className="h-full overflow-hidden p-0 transition hover:border-hub-cyan/40">
              <div className="h-36">
                <img src={p.heroImage} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-1 p-4">
                <div className="text-sm font-semibold text-white">{p.name}</div>
                <div className="text-xs text-slate-400">{p.companyName}</div>
              </div>
            </GlassCard>
          </Link>
        ))}
        {items.length === 0 && (
          <GlassCard className="p-6 md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-400">
              Favorite services from detail pages — they synchronize here instantly.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
