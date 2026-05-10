import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

export default function DashboardAnalytics() {
  const [sum, setSum] = useState(null);

  useEffect(() => {
    apiFetch("/api/user/summary").then(setSum).catch(() => {});
  }, []);

  if (!sum) {
    return <div className="text-sm text-slate-400">Hydrating analytic tensors…</div>;
  }

  const heatmap = [...sum.visitHeatmap].sort((a, b) => new Date(a.d) - new Date(b.d));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Analytics</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Immersive personal intelligence
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Heat correlations, uplift vectors, and visit gravity wells across all connected enterprises.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Engagement breadth", `${sum.stats.companiesVisited} storefronts`, sum.stats.productsVisited],
          ["Authored trust", `${sum.stats.reviewsWritten} reviews`, sum.stats.totalVisits],
          ["Signals saved", `${sum.stats.favorites} pinned`, sum.stats.companiesVisited * 24],
        ].map(([title, sub, anchor]) => (
          <GlassCard key={title} className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
            <div className="mt-4 font-display text-3xl font-bold text-white">
              <AnimatedNumber value={anchor} />
            </div>
            <div className="mt-2 text-xs text-hub-cyan">{sub}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Enterprise visit bias
          </div>
          <div className="mt-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sum.visitsByCompany}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="companyName" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    fontSize: 12,
                  }}
                />
                <defs>
                  <linearGradient id="uxBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <Bar dataKey="visits" radius={[18, 18, 0, 0]} fill="url(#uxBar)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Daily density surface
          </div>
          <div className="mt-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap.map((h) => ({ d: String(h.d).slice(5), visits: Number(h.n) }))}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    fontSize: 12,
                  }}
                />
                <defs>
                  <linearGradient id="heatBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <Bar dataKey="visits" radius={[10, 10, 0, 0]} fill="url(#heatBar)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Session continuity waveform
        </div>
        <div className="mt-6 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={heatmap.map((h) => ({ d: String(h.d).slice(5), v: Number(h.n) }))}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="d" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.08)",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="v" stroke="#EC4899" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
