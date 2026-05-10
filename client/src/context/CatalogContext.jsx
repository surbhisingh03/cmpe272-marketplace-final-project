import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [previewByCompany, setPreviewByCompany] = useState({});
  const [globalTop, setGlobalTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [cRes, lRes] = await Promise.all([
        apiFetch("/api/marketplace/companies"),
        apiFetch("/api/marketplace/leaderboards"),
      ]);
      setCompanies(cRes.companies || []);
      setPreviewByCompany(cRes.topPreviewByCompany || {});
      setGlobalTop(lRes.globalTop || []);
    } catch (e) {
      setError(e.message || "Catalog unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const searchProducts = useMemo(() => {
    const list = [];
    const seen = new Set();
    for (const c of companies) {
      const prev = previewByCompany[String(c.id)] || [];
      for (const p of prev) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push({ ...p, companySlug: c.slug, companyName: c.name });
        }
      }
    }
    for (const p of globalTop) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list;
  }, [companies, previewByCompany, globalTop]);

  const value = useMemo(
    () => ({
      companies,
      previewByCompany,
      globalTop,
      searchProducts,
      loading,
      error,
      refresh,
    }),
    [companies, previewByCompany, globalTop, searchProducts, loading, error]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog requires CatalogProvider");
  return ctx;
}
