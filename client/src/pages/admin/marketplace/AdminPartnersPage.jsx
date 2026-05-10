import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { subscribeAnalyticsUpdated } from "../../../lib/fusionhubAnalytics.js";
import { readAnalyticsReviews, readAnalyticsVisits } from "../../../lib/fusionhubAnalytics.js";
import { journeyCompanyIdToApiSlug, journeyCompanyIdToPartnerLabel, partnerStorefrontPath } from "../../../lib/marketplaceUserTracking.js";

const IDS = ["bean-brew", "krativerse", "seaside-travels", "nexus-academy"];

export default function AdminPartnersPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return subscribeAnalyticsUpdated(() => setTick((t) => t + 1));
  }, []);

  const cards = useMemo(() => {
    return IDS.map((jid) => {
      const visits = readAnalyticsVisits().filter((v) => v.companyId === jid).length;
      const reviews = readAnalyticsReviews().filter((r) => r.companyId === jid).length;
      const slug = journeyCompanyIdToApiSlug(jid);
      return {
        jid,
        label: journeyCompanyIdToPartnerLabel(jid),
        visits,
        reviews,
        storefront: partnerStorefrontPath(jid),
        companyLink: slug ? `/marketplace/companies/${slug}` : "/marketplace/explore",
      };
    });
  }, [tick]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Partner companies</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.jid}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
          >
            <h2 className="font-display text-lg font-bold text-slate-900">{c.label}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Visits</dt>
                <dd className="font-bold tabular-nums text-slate-900">{c.visits}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Reviews</dt>
                <dd className="font-bold tabular-nums text-slate-900">{c.reviews}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <Link to={c.storefront} className="text-xs font-bold text-violet-700 underline">
                Storefront
              </Link>
              <Link to={c.companyLink} className="text-xs font-bold text-cyan-700 underline">
                Company profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
