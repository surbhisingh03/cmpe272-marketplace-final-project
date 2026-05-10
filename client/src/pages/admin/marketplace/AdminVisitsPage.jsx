import { useMemo, useState, useEffect } from "react";
import { readAnalyticsVisits, subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { journeyCompanyIdToPartnerLabel } from "../../../lib/marketplaceUserTracking.js";

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso || "");
  }
}

export default function AdminVisitsPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const rows = useMemo(() => {
    return [...readAnalyticsVisits()].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  }, [tick]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Visits</h1>
      <p className="text-sm text-slate-600">Visit events captured for analytics on this device.</p>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="max-h-[min(720px,75vh)] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No visits recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100 transition hover:bg-cyan-50/40">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{v.userName || v.userId}</td>
                    <td className="px-4 py-2.5 text-slate-600">{v.type}</td>
                    <td className="px-4 py-2.5 text-slate-600">{v.action || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{journeyCompanyIdToPartnerLabel(v.companyId) || v.companyName}</td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-600">{v.itemName || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{formatWhen(v.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
