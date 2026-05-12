import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard.jsx";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import { apiFetch } from "../../lib/api.js";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardHome() {
  const [sum, setSum] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/user/summary")
      .then((d) => {
        if (!cancelled) setSum(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sum) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-slate-500">
        Pulling cockpit analytics…
      </div>
    );
  }

  const pieData =
    sum.visitsByCompany.length > 0
      ? sum.visitsByCompany.map((c) => ({ name: c.companyName, value: c.visits }))
      : [
          { name: "Fusion field", value: 1 },
          { name: "Ready for signal", value: 1 },
        ];
  const colors = ["#7C3AED", "#06B6D4", "#EC4899", "#A855F7"];
  const areaData = [...sum.visitHeatmap]
    .sort((a, b) => new Date(a.d) - new Date(b.d))
    .map((h) => ({ day: String(h.d).slice(5), n: Number(h.n) }));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Home</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#111827]">Command overview</h1>
        <p className="mt-2 max-w-xl text-sm text-[#6B7280]">
          Cross-domain breadcrumbs, calibrated recommendations, and your personal visit mesh.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Total visits", sum.stats.totalVisits],
          ["Companies explored", sum.stats.companiesVisited],
          ["Distinct services", sum.stats.productsVisited],
          ["Reviews authored", sum.stats.reviewsWritten],
          ["Pinned favorites", sum.stats.favorites],
        ].map(([label, val], i) => (
          <GlassCard key={label} delay={i * 0.04} className="p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className="mt-3 font-display text-2xl font-semibold text-[#111827]">
              <AnimatedNumber value={val} />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Visit distribution</div>
          <div className="mt-3 h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={5}
                  stroke="#e5e7eb"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 12,
                    color: "#111827",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Visit tempo</div>
          <div className="mt-3 h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="vis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 12,
                    color: "#111827",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="n"
                  stroke="#7C3AED"
                  fillOpacity={1}
                  fill="url(#vis)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent voyages</div>
              <div className="mt-1 font-display text-xl font-semibold text-[#111827]">
                Latest storefront stops
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {sum.recentVisits.map((v) => (
              <Link
                key={`${v.at}-${v.productId}`}
                to={`/marketplace/products/${v.productId}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-sm hover:border-violet-300"
              >
                <img
                  src={v.heroImage}
                  alt=""
                  className="h-12 w-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium text-[#111827]">{v.productName}</div>
                  <div className="text-xs text-[#6B7280]">{v.companyName}</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  {new Date(v.at).toLocaleString()}
                </div>
              </Link>
            ))}
            {sum.recentVisits.length === 0 && (
              <div className="text-sm text-[#6B7280]">Explore the marketplace — visits appear here.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Recommendation rail
              </div>
              <div className="mt-1 font-display text-xl font-semibold text-[#111827]">
                Trending services
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {sum.trendingServices.map((p) => (
              <Link
                key={p.id}
                to={`/marketplace/products/${p.id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:border-cyan-300"
              >
                <img
                  src={p.heroImage}
                  alt=""
                  className="h-14 w-20 rounded-xl object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-[#111827]">{p.name}</div>
                  <div className="text-xs text-[#6B7280]">{p.companyName}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-cyan-700">
                    AI surfaced · harmonic match
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Timeline · hybrid activity
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {sum.activityTimeline
              ?.slice(0, 8)
              .map((a, idx) => (
                <div
                  key={`${a.at}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-xs"
                >
                  <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-700">
                    {a.type}
                  </span>
                  <div className="mt-2 text-sm text-[#111827]">{a.label}</div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {new Date(a.at).toLocaleString()}
                  </div>
                </div>
              ))}
            {(!sum.activityTimeline || sum.activityTimeline.length === 0) && (
              <div className="text-sm text-[#6B7280]">Activity will accumulate as you explore.</div>
            )}
          </div>
          <div className="rounded-2xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-cyan-50/60 p-5 text-xs leading-relaxed text-[#6B7280]">
            <span className="font-semibold text-[#111827]">Neo-personalizer</span> blends harmonic visits,
            latent category affinity, review tone, and recency spikes to reorder what you explore
            next — mirroring Fortune-500 personalization stacks without the infra tax.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
