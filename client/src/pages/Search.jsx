import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";

const resultLinkClass =
  "block rounded-[14px] border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm transition hover:border-[#7C3AED]/30 hover:bg-white";

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
      <div className="mx-auto max-w-5xl px-4 py-14 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">Search results</h1>
        <p className="mt-2 text-[15px] text-[#6B7280]">
          Query: <span className="font-semibold text-[#111827]">{q || "…"}</span>
        </p>

        {!q && (
          <GlassCard className="mt-8 p-6">
            <p className="text-sm leading-relaxed text-[#6B7280]">
              Use the search box on the home page hero or open{" "}
              <Link to="/marketplace/explore" className="font-semibold text-[#7c3aed] hover:underline">
                Browse
              </Link>{" "}
              to explore the catalog.
            </p>
          </GlassCard>
        )}

        {q && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Enterprises</div>
              <ul className="mt-4 space-y-3">
                {results.companies.length === 0 && (
                  <li className="text-sm text-[#6B7280]">No company matches.</li>
                )}
                {results.companies.map((c) => (
                  <li key={c.slug}>
                    <Link to={`/marketplace/companies/${c.slug}`} className={resultLinkClass}>
                      <div className="font-semibold text-[#111827]">{c.name}</div>
                      <div className="mt-0.5 text-xs text-[#6B7280]">{c.tagline}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Services</div>
              <ul className="mt-4 space-y-3">
                {results.products.length === 0 && (
                  <li className="text-sm text-[#6B7280]">No service matches.</li>
                )}
                {results.products.map((p) => (
                  <li key={`${p.id}-${p.slug}`}>
                    <Link
                      to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                      className={resultLinkClass}
                    >
                      <div className="font-semibold text-[#111827]">{p.name}</div>
                      <div className="mt-0.5 text-xs text-[#6B7280]">{p.companyName || p.companySlug}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
