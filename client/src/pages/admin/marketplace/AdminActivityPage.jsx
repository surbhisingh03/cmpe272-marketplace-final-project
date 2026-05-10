import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { allMarketplaceActivity } from "../../../lib/adminMarketplaceAggregates.js";

const PAGE_SIZE = 10;

function formatShortTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function ActionBadge({ action }) {
  const a = String(action || "").toLowerCase();
  let pill = "border-slate-200 bg-slate-50 text-slate-700";
  let short = action;
  if (a.includes("submitted review")) {
    pill = "border-emerald-200 bg-emerald-50 text-emerald-900";
    short = "Review";
  } else if (a.includes("opened storefront")) {
    pill = "border-violet-200 bg-violet-50 text-violet-900";
    short = "Storefront";
  } else if (a.includes("visited partner")) {
    pill = "border-cyan-200 bg-cyan-50 text-cyan-900";
    short = "Partner site";
  } else if (a.includes("viewed listing") || a.includes("viewed")) {
    pill = "border-amber-200 bg-amber-50 text-amber-950";
    short = "Listing";
  }
  return (
    <span
      className={`inline-flex max-w-full shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill}`}
      title={action}
    >
      {short}
    </span>
  );
}

export default function AdminActivityPage() {
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const rows = useMemo(() => allMarketplaceActivity(), [tick]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE) || 1);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageSlice = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <Link
          to="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 underline-offset-2 hover:underline"
        >
          <FiArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#0f172a]">All activity</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#64748b]">
          Storefront opens, listing views, partner website visits, and review submissions, newest first.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
              <tr>
                <th className="w-[18%] px-4 py-3">Action</th>
                <th className="w-[22%] px-3 py-3">Company</th>
                <th className="min-w-0 px-3 py-3">Listing</th>
                <th className="w-[26%] px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-[#64748b]">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                pageSlice.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className="border-t border-[#e2e8f0] align-middle transition hover:bg-violet-50/40">
                    <td className="px-4 py-2.5">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="max-w-0 px-3 py-2.5">
                      <span className="block truncate text-[#64748b]" title={row.company}>
                        {row.company}
                      </span>
                    </td>
                    <td className="max-w-0 px-3 py-2.5">
                      <span className="block truncate text-[#64748b]" title={row.listing}>
                        {row.listing}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs tabular-nums text-[#64748b]">{formatShortTime(row.time)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] px-4 py-3">
            <p className="text-xs font-medium text-[#64748b]">
              Page <span className="font-bold tabular-nums text-[#0f172a]">{safePage + 1}</span> of{" "}
              <span className="font-bold tabular-nums text-[#0f172a]">{totalPages}</span>
              <span className="mx-2 text-[#cbd5e1]">·</span>
              {rows.length} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={safePage <= 0}
                className="inline-flex min-h-[36px] min-w-[88px] items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs font-bold text-[#0f172a] shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={safePage >= totalPages - 1}
                className="inline-flex min-h-[36px] min-w-[88px] items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs font-bold text-[#0f172a] shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
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
