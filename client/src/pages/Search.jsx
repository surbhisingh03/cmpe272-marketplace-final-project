import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell.jsx";
import GradientMesh from "../components/layout/GradientMesh.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim().toLowerCase();
  const { companies, searchProducts } = useCatalog();

  const results = useMemo(() => {
    if (!q) return { companies: [], products: [] };
    const comps = companies.filter((c) => c.name.toLowerCase().includes(q));
    const prods = searchProducts.filter((p) => p.name.toLowerCase().includes(q));
    return { companies: comps, products: prods };
  }, [q, companies, searchProducts]);

  return (
    <PublicShell>
      <div className="relative">
        <GradientMesh />
        <div className="mx-auto max-w-5xl px-4 py-14 lg:px-6">
          <h1 className="font-display text-3xl font-bold text-white">Search results</h1>
          <p className="mt-2 text-slate-400">
            Query: <span className="text-white">{q || "…"}</span>
          </p>

          {!q && (
            <GlassCard className="mt-8 p-6">
              <p className="text-sm text-slate-300">
                Enter a keyword in the navbar to search storefronts across FusionHub instantly.
              </p>
            </GlassCard>
          )}

          {q && (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <div className="text-xs uppercase tracking-widest text-slate-500">
                  Enterprises
                </div>
                <ul className="mt-4 space-y-3">
                  {results.companies.length === 0 && (
                    <li className="text-sm text-slate-400">No company matches.</li>
                  )}
                  {results.companies.map((c) => (
                    <li key={c.slug}>
                      <Link
                        to={`/marketplace/companies/${c.slug}`}
                        className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:border-hub-violet/40"
                      >
                        <div className="font-medium text-white">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.tagline}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="text-xs uppercase tracking-widest text-slate-500">Services</div>
                <ul className="mt-4 space-y-3">
                  {results.products.length === 0 && (
                    <li className="text-sm text-slate-400">No service matches.</li>
                  )}
                  {results.products.map((p) => (
                    <li key={`${p.id}-${p.slug}`}>
                      <Link
                        to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                        className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:border-hub-cyan/40"
                      >
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">
                          {p.companyName || p.companySlug}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
