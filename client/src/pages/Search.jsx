import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { apiFetch } from "../lib/api.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";

const HISTORY_KEY = "fusionhub_search_history_v1";

const COMPANY_DOT = {
  "srikavya-enterprise": "bg-amber-500",
  krativerse: "bg-fuchsia-500",
  "travel-agency": "bg-sky-500",
  "nexus-academy": "bg-emerald-500",
};

function readHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim()) : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    /* ignore */
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split string into segments for <mark> wrapping (case-insensitive). */
function highlightParts(text, query) {
  const q = query.trim();
  if (!q) return [{ text: String(text ?? ""), hit: false }];
  const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
  const str = String(text ?? "");
  const out = [];
  let last = 0;
  let m;
  const r = new RegExp(re.source, re.flags);
  while ((m = r.exec(str)) !== null) {
    if (m.index > last) out.push({ text: str.slice(last, m.index), hit: false });
    out.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
    if (m[0].length === 0) r.lastIndex += 1;
  }
  if (last < str.length) out.push({ text: str.slice(last), hit: false });
  return out.length ? out : [{ text: str, hit: false }];
}

function Highlight({ text, query }) {
  const parts = useMemo(() => highlightParts(text, query), [text, query]);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark
            key={i}
            className="rounded bg-yellow-200 px-0.5 font-semibold text-yellow-900"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function textMatchesQuery(blob, q) {
  if (!q) return true;
  return String(blob || "")
    .toLowerCase()
    .includes(q.toLowerCase());
}

function relevanceScore(kind, item, q) {
  if (!q.trim()) return 0;
  const needle = q.toLowerCase();
  const fields =
    kind === "company"
      ? [item.name, item.tagline, item.description]
      : [item.name, item.excerpt, item.companyName, item.category];
  let score = 0;
  for (const f of fields) {
    const s = String(f || "").toLowerCase();
    const idx = s.indexOf(needle);
    if (idx >= 0) {
      score += 50 - Math.min(40, idx);
      if (s.startsWith(needle)) score += 15;
    }
  }
  return score;
}

function sortResults(rows, sortKey, q) {
  const copy = [...rows];
  if (sortKey === "rating") {
    copy.sort((a, b) => (Number(b.avgRating || 0) || 0) - (Number(a.avgRating || 0) || 0));
  } else if (sortKey === "visits") {
    copy.sort((a, b) => (Number(b.visitCount || 0) || 0) - (Number(a.visitCount || 0) || 0));
  } else if (sortKey === "newest") {
    copy.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  } else {
    copy.sort((a, b) => relevanceScore(b.kind, b, q) - relevanceScore(a.kind, a, q));
  }
  return copy;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[14px] border border-slate-200 bg-slate-100 p-4"
        >
          <div className="h-4 w-[72%] rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200" />
          <div className="mt-2 h-3 w-[83%] rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function EmptySearchIllustration() {
  return (
    <svg
      className="mx-auto h-28 w-28 text-slate-300"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="52" cy="52" r="22" stroke="currentColor" strokeWidth="4" />
      <path
        d="M72 72 L96 96"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="46" cy="48" r="3" fill="currentColor" />
      <circle cx="58" cy="48" r="3" fill="currentColor" />
      <path
        d="M44 60 Q52 54 60 60"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = (searchParams.get("q") || "").trim();
  const skipUrlToInputSync = useRef(false);

  const { companies, loading: catalogLoading } = useCatalog();
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogFetchError, setCatalogFetchError] = useState(null);

  const [inputValue, setInputValue] = useState(urlQ);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQ);
  const [history, setHistory] = useState(() => readHistory());

  const [selectedCompanies, setSelectedCompanies] = useState(() => new Set());
  const [selectedCategories, setSelectedCategories] = useState(() => new Set());
  const [minRating, setMinRating] = useState(0);
  const [sortKey, setSortKey] = useState("relevance");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const blurTimer = useRef(null);

  const [pendingResults, setPendingResults] = useState(false);
  const [displayRows, setDisplayRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/marketplace/catalog")
      .then((d) => {
        if (!cancelled) {
          setCatalogItems(Array.isArray(d?.items) ? d.items : []);
          setCatalogFetchError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogItems([]);
          setCatalogFetchError("Catalog could not be loaded.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (skipUrlToInputSync.current) {
      skipUrlToInputSync.current = false;
      return;
    }
    setInputValue(urlQ);
    setDebouncedQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 150);
    return () => window.clearTimeout(t);
  }, [inputValue]);

  useEffect(() => {
    const next = debouncedQuery.trim();
    const cur = urlQ.trim();
    if (next === cur) return;
    skipUrlToInputSync.current = true;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (next) n.set("q", next);
        else n.delete("q");
        return n;
      },
      { replace: true },
    );
  }, [debouncedQuery, urlQ, setSearchParams]);

  const categories = useMemo(() => {
    const s = new Set();
    for (const p of catalogItems) {
      if (p.category) s.add(String(p.category));
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [catalogItems]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedCompanies.size > 0) n += selectedCompanies.size;
    if (selectedCategories.size > 0) n += selectedCategories.size;
    if (minRating > 0) n += 1;
    if (sortKey !== "relevance") n += 1;
    return n;
  }, [selectedCompanies, selectedCategories, minRating, sortKey]);

  const computeFiltered = useCallback(() => {
    const q = debouncedQuery.trim();
    const hasStructuredFilter =
      selectedCompanies.size > 0 || selectedCategories.size > 0 || minRating > 0;
    if (!q && !hasStructuredFilter) return [];

    const rows = [];
    const skipCompanyCards = !q && selectedCategories.size > 0;

    if (!skipCompanyCards) {
      for (const c of companies) {
        const blob = `${c.name} ${c.tagline || ""} ${c.description || ""}`;
        if (!textMatchesQuery(blob, q)) continue;
        if (selectedCompanies.size > 0 && !selectedCompanies.has(c.slug)) continue;
        const ar = Number(c.avgRating ?? 0) || 0;
        if (minRating > 0 && ar < minRating) continue;
        rows.push({
          kind: "company",
          id: `c-${c.slug}`,
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          avgRating: ar,
          visitCount: 0,
          createdAt: null,
        });
      }
    }

    for (const p of catalogItems) {
      const blob = `${p.name} ${p.excerpt || ""} ${p.companyName || ""} ${p.category || ""}`;
      if (!textMatchesQuery(blob, q)) continue;
      if (selectedCompanies.size > 0 && !selectedCompanies.has(p.companySlug)) continue;
      if (selectedCategories.size > 0 && !selectedCategories.has(String(p.category || ""))) continue;
      const ar = Number(p.avgRating ?? 0) || 0;
      if (minRating > 0 && ar < minRating) continue;
      rows.push({
        kind: "product",
        id: `p-${p.id}`,
        product: p,
        name: p.name,
        excerpt: p.excerpt,
        companyName: p.companyName,
        category: p.category,
        avgRating: ar,
        visitCount: Number(p.visitCount ?? 0) || 0,
        createdAt: p.createdAt,
      });
    }

    return sortResults(rows, sortKey, q);
  }, [
    companies,
    catalogItems,
    debouncedQuery,
    selectedCompanies,
    selectedCategories,
    minRating,
    sortKey,
  ]);

  const allowList = useMemo(
    () =>
      debouncedQuery.trim().length > 0 ||
      selectedCompanies.size > 0 ||
      selectedCategories.size > 0 ||
      minRating > 0,
    [debouncedQuery, selectedCompanies, selectedCategories, minRating],
  );

  useEffect(() => {
    if (!allowList) {
      setPendingResults(false);
      setDisplayRows([]);
      return undefined;
    }
    setPendingResults(true);
    const t = window.setTimeout(() => {
      setDisplayRows(computeFiltered());
      setPendingResults(false);
    }, 300);
    return () => window.clearTimeout(t);
  }, [allowList, computeFiltered]);

  const pushHistory = useCallback((raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    const next = [v, ...readHistory().filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 8);
    writeHistory(next);
    setHistory(next);
  }, []);

  const removeHistoryItem = useCallback((v, e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = readHistory().filter((x) => x !== v);
    writeHistory(next);
    setHistory(next);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCompanies(new Set());
    setSelectedCategories(new Set());
    setMinRating(0);
    setSortKey("relevance");
  }, []);

  const toggleCompany = (slug) => {
    setSelectedCompanies((prev) => {
      const n = new Set(prev);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat);
      else n.add(cat);
      return n;
    });
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const v = inputValue.trim();
    if (!v) return;
    setDebouncedQuery(v);
    skipUrlToInputSync.current = true;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("q", v);
        return n;
      },
      { replace: true },
    );
    pushHistory(v);
    setShowRecent(false);
  };

  const applyRecentQuery = (v) => {
    setInputValue(v);
    setDebouncedQuery(v.trim());
    skipUrlToInputSync.current = true;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (v.trim()) n.set("q", v.trim());
        else n.delete("q");
        return n;
      },
      { replace: true },
    );
    setShowRecent(false);
  };

  const filterSidebar = (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Company</div>
        <ul className="mt-3 space-y-2">
          {companies.map((c) => (
            <li key={c.slug}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={selectedCompanies.has(c.slug)}
                  onChange={() => toggleCompany(c.slug)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                    COMPANY_DOT[c.slug] || "bg-slate-400"
                  }`}
                />
                <span className="truncate">{c.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const on = selectedCategories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  on
                    ? "border-violet-500 bg-violet-50 text-violet-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Min rating: {minRating > 0 ? minRating.toFixed(1) : "Any"}
        </div>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="mt-3 w-full accent-purple-600"
        />
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Sort by</div>
        <fieldset className="mt-3 space-y-2">
          {[
            { key: "relevance", label: "Relevance" },
            { key: "rating", label: "Rating" },
            { key: "visits", label: "Most Visited" },
            { key: "newest", label: "Newest" },
          ].map((opt) => (
            <label key={opt.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name="search-sort"
                checked={sortKey === opt.key}
                onChange={() => setSortKey(opt.key)}
                className="border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Clear filters
      </button>
    </div>
  );

  const resultLinkClass =
    "block rounded-[14px] border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm transition hover:border-[#7C3AED]/30 hover:bg-white";

  const hasStructuredFilter =
    selectedCompanies.size > 0 || selectedCategories.size > 0 || minRating > 0;
  const showEmpty =
    !pendingResults && displayRows.length === 0 && allowList && debouncedQuery.trim();
  const showFilteredButQueryEmpty =
    !pendingResults && displayRows.length === 0 && hasStructuredFilter && !debouncedQuery.trim();
  const showNoQueryEmpty = !pendingResults && !allowList;

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
              Search
            </h1>
            <p className="mt-1 text-[15px] text-[#6B7280]">
              Explore companies and listings from the marketplace catalog.
            </p>
          </div>
          <button
            type="button"
            className="relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm md:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <form className="relative mt-8 max-w-2xl" onSubmit={onSearchSubmit}>
          <input
            type="search"
            value={inputValue}
            onChange={(e) => {
              const v = e.target.value;
              setInputValue(v);
              if (!v.trim() && inputFocused) setShowRecent(true);
            }}
            onFocus={() => {
              window.clearTimeout(blurTimer.current);
              setInputFocused(true);
              if (!inputValue.trim()) setShowRecent(true);
            }}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => {
                setInputFocused(false);
                setShowRecent(false);
              }, 180);
            }}
            placeholder="Search companies and services…"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-[15px] text-[#111827] shadow-sm outline-none ring-2 ring-transparent placeholder:text-slate-400 focus:border-violet-300 focus:ring-violet-200/60"
            aria-autocomplete="list"
            aria-expanded={showRecent && inputFocused && !inputValue.trim()}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Search
          </button>

          {inputFocused && !inputValue.trim() && showRecent && history.length > 0 ? (
            <div
              className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Recent searches
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {history.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1 text-sm text-slate-800"
                  >
                    <button
                      type="button"
                      className="py-1 text-left font-medium hover:text-violet-700"
                      onClick={() => applyRecentQuery(h)}
                    >
                      {h}
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                      aria-label={`Remove ${h}`}
                      onClick={(e) => removeHistoryItem(h, e)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </form>

        {catalogFetchError ? (
          <p className="mt-4 text-sm text-rose-600">{catalogFetchError}</p>
        ) : null}

        <div className="relative mt-10 flex gap-8">
          <aside className="hidden w-64 shrink-0 md:block">
            <GlassCard className="p-5" hover={false}>
              {filterSidebar}
            </GlassCard>
          </aside>

          <div
            className={`fixed inset-0 z-40 bg-black/40 transition md:hidden ${
              drawerOpen ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!drawerOpen}
            onClick={() => setDrawerOpen(false)}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transform border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col overflow-y-auto p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Filters</span>
                <button
                  type="button"
                  className="text-sm font-semibold text-violet-700"
                  onClick={() => setDrawerOpen(false)}
                >
                  Done
                </button>
              </div>
              {filterSidebar}
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            {catalogLoading && !catalogItems.length ? (
              <p className="text-sm text-slate-500">Loading catalog…</p>
            ) : null}

            <p className="text-sm font-medium text-slate-700">
              {pendingResults ? (
                <span className="text-slate-400">Updating results…</span>
              ) : allowList ? (
                debouncedQuery.trim() ? (
                  <>
                    Showing <span className="tabular-nums text-slate-900">{displayRows.length}</span> results
                    for &apos;
                    <span className="font-semibold text-violet-800">{debouncedQuery.trim()}</span>&apos;
                  </>
                ) : (
                  <>
                    Showing <span className="tabular-nums text-slate-900">{displayRows.length}</span> results
                    <span className="text-slate-500"> (filters only)</span>
                  </>
                )
              ) : (
                <span className="text-slate-500">Enter a search or apply filters to explore the catalog.</span>
              )}
            </p>

            <div className="mt-6">
              {pendingResults ? (
                <SkeletonGrid />
              ) : showEmpty || showFilteredButQueryEmpty ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
                  <EmptySearchIllustration />
                  <p className="mt-6 text-lg font-semibold text-slate-800">
                    {debouncedQuery.trim()
                      ? `No results for '${debouncedQuery.trim()}'`
                      : "No listings match your filters"}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-600">
                    Try different keywords, or reset filters to see more of the catalog.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setDrawerOpen(false);
                    }}
                    className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : showNoQueryEmpty ? (
                <GlassCard className="p-6" hover={false}>
                  <p className="text-sm leading-relaxed text-[#6B7280]">
                    Type above to search in real time, or open{" "}
                    <Link to="/marketplace/explore" className="font-semibold text-[#7c3aed] hover:underline">
                      Browse
                    </Link>{" "}
                    to explore the catalog. Your recent searches appear when the box is empty and focused.
                  </p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayRows.map((row) =>
                    row.kind === "company" ? (
                      <Link key={row.id} to={`/marketplace/companies/${row.slug}`} className={resultLinkClass}>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
                          Company
                        </span>
                        <div className="mt-1 font-semibold text-[#111827]">
                          <Highlight text={row.name} query={debouncedQuery} />
                        </div>
                        <div className="mt-0.5 text-xs text-[#6B7280]">
                          <Highlight text={row.tagline || "—"} query={debouncedQuery} />
                        </div>
                      </Link>
                    ) : (
                      <Link
                        key={row.id}
                        to={
                          row.product?.slug
                            ? marketplaceListingPath(row.product.slug)
                            : `/marketplace/products/${row.product?.id}`
                        }
                        className={resultLinkClass}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">
                          Listing
                        </span>
                        <div className="mt-1 font-semibold text-[#111827]">
                          <Highlight text={row.name} query={debouncedQuery} />
                        </div>
                        <div className="mt-0.5 text-xs text-[#6B7280]">
                          <Highlight text={row.companyName || ""} query={debouncedQuery} />
                          {row.category ? (
                            <>
                              {" "}
                              · <Highlight text={row.category} query={debouncedQuery} />
                            </>
                          ) : null}
                        </div>
                        {row.excerpt ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            <Highlight text={row.excerpt} query={debouncedQuery} />
                          </p>
                        ) : null}
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </PublicShell>
  );
}
