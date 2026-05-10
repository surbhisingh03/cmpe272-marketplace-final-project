import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api.js";
import { subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { uniqueMarketplaceUserIds } from "../../../lib/adminMarketplaceAggregates.js";

export default function AdminUsersPage() {
  const [dbUsers, setDbUsers] = useState(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const o = await apiFetch("/api/admin/overview");
      setDbUsers(o?.counts?.users ?? 0);
    } catch {
      setDbUsers(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const lsContributors = useMemo(() => uniqueMarketplaceUserIds().length, [tick]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Users</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Registered users</p>
          <p className="mt-2 font-display text-3xl font-black text-slate-900">{dbUsers != null ? dbUsers : "—"}</p>
          {dbUsers == null ? <p className="mt-2 text-xs text-amber-700">Could not load admin overview. Sign in or check server configuration.</p> : null}
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Activity trail (this browser)</p>
          <p className="mt-2 font-display text-3xl font-black text-slate-900">{lsContributors}</p>
          <p className="mt-2 text-xs text-slate-600">
            Distinct signed-in users who appear in stored visit or review analytics on this device (supplemental to
            registered accounts).
          </p>
        </div>
      </div>
    </div>
  );
}
