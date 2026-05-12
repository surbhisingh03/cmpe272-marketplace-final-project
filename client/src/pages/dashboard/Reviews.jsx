import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";

export default function DashboardReviews() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    apiFetch("/api/reviews/user/me").then(setRows).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Reviews</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#111827]">Your published signal</h1>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <GlassCard key={r.id} hover={false}>
            <div className="flex flex-wrap items-start justify-between gap-3 p-6">
              <div>
                <div className="font-semibold text-[#111827]">{r.title}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <Link
                to={`/marketplace/products/${r.productId}`}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] font-semibold text-cyan-800"
              >
                {r.productName} →
              </Link>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 text-xs text-[#6B7280]">
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-200/80">
                ★ {r.rating}.0 / 5
              </span>
            </div>
          </GlassCard>
        ))}
        {rows.length === 0 && (
          <GlassCard className="p-6">
            <p className="text-sm text-[#6B7280]">
              Compose your first verdict on any service detail page.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
