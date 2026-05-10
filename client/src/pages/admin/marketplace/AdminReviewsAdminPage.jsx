import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../lib/api.js";
import { readAnalyticsReviews, subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { marketplaceListingPath } from "../../../lib/marketplaceDisplay.js";

const PAGE_SIZE = 10;

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso || "");
  }
}

export default function AdminReviewsAdminPage() {
  const [catalog, setCatalog] = useState([]);
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    try {
      const { items } = await apiFetch("/api/marketplace/catalog");
      setCatalog(Array.isArray(items) ? items : []);
    } catch {
      setCatalog([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const slugById = useMemo(() => {
    const m = new Map();
    for (const c of catalog) m.set(String(c.id), c.slug);
    return m;
  }, [catalog]);

  const rows = useMemo(() => {
    return [...readAnalyticsReviews()].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  }, [tick]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const pageRows = useMemo(() => {
    const start = pageSafe * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, pageSafe]);

  useEffect(() => {
    if (page !== pageSafe) setPage(pageSafe);
  }, [page, pageSafe]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Reviews (admin)</h1>
        <p className="mt-1 text-sm text-slate-600">
          All review submissions captured for analytics on this device. The public directory is on the{" "}
          <Link to="/reviews" className="font-bold text-violet-700 underline">
            Marketplace Reviews
          </Link>{" "}
          page.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const slug = slugById.get(String(r.itemId));
                  return (
                    <tr key={r.id} className="border-t border-slate-100 transition hover:bg-violet-50/40">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.userName || r.userId}</td>
                      <td className="px-4 py-2.5 tabular-nums text-amber-600">{r.rating}★</td>
                      <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-700">{r.itemName}</td>
                      <td className="max-w-[140px] truncate px-4 py-2.5 text-slate-600">{r.companyName}</td>
                      <td className="max-w-[220px] truncate px-4 py-2.5 text-slate-600">{r.comment || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{formatWhen(r.timestamp)}</td>
                      <td className="px-4 py-2.5">
                        {slug ? (
                          <Link to={marketplaceListingPath(slug)} className="text-xs font-bold text-violet-700 underline">
                            View
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Page <span className="font-bold tabular-nums text-slate-900">{pageSafe + 1}</span> of{" "}
              <span className="font-bold tabular-nums text-slate-900">{totalPages}</span>
              <span className="mx-2 text-slate-300">·</span>
              {rows.length} reviews
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageSafe <= 0}
                className="inline-flex min-h-[36px] min-w-[88px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageSafe >= totalPages - 1}
                className="inline-flex min-h-[36px] min-w-[88px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
