import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { useCatalog } from "../../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../../lib/marketplaceDisplay.js";

export default function DashboardCompanies() {
  const { companies, previewByCompany } = useCatalog();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Companies</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Sovereign storefronts · unified discovery
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {companies.map((c) => {
          const top = previewByCompany[String(c.id)] || [];
          return (
            <GlassCard key={c.slug} className="overflow-hidden">
              <div className="h-44">
                <img src={c.bannerUrl} alt="" className="h-full w-full object-cover" />
                <div className="relative -mt-16 h-16 bg-gradient-to-t from-hub-bg to-transparent" />
              </div>
              <div className="space-y-3 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="font-display text-xl font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.tagline}</div>
                  </div>
                  <Link
                    to={`/marketplace/companies/${c.slug}`}
                    className="rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-3 py-2 text-xs font-semibold text-white"
                  >
                    Open
                  </Link>
                </div>
                <p className="text-sm text-slate-300">{c.description}</p>
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Top preview
                </div>
                <ul className="space-y-1 text-sm">
                  {top.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link
                        to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                        className="text-hub-cyan hover:underline"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
