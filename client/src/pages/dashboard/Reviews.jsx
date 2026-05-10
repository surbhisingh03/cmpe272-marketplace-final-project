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
        <h1 className="mt-2 font-display text-3xl font-bold text-white">Your published signal</h1>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <GlassCard key={r.id} hover={false}>
            <div className="flex flex-wrap items-start justify-between gap-3 p-6">
              <div>
                <div className="font-semibold text-white">{r.title}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <Link
                to={`/marketplace/products/${r.productId}`}
                className="rounded-xl border border-hub-cyan/40 bg-hub-cyan/10 px-3 py-2 text-[11px] font-semibold text-hub-cyan"
              >
                {r.productName} →
              </Link>
            </div>
            <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-300">
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">
                ★ {r.rating}.0 / 5
              </span>
            </div>
          </GlassCard>
        ))}
        {rows.length === 0 && (
          <GlassCard className="p-6">
            <p className="text-sm text-slate-400">
              Compose your first verdict on any service detail page.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
