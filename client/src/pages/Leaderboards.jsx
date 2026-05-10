import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import PublicShell from "../components/layout/PublicShell.jsx";
import GradientMesh from "../components/layout/GradientMesh.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";
import { apiFetch } from "../lib/api.js";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Leaderboards() {
  const { companies } = useCatalog();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/marketplace/leaderboards")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  const chartData =
    data?.globalTop?.map((p) => ({
      name: p.name.slice(0, 18),
      visits: Number(p.visitCount) || 0,
    })) || [];

  return (
    <PublicShell>
      <div className="relative overflow-hidden">
        <GradientMesh />
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-bold text-white">Top 5 · Live leaderboards</h1>
            <p className="mt-3 text-slate-400">
              Top listings based on visits, reviews, and ratings. Ranked by marketplace engagement.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <GlassCard className="p-6" glow>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">
                    Global marketplace
                  </div>
                  <div className="mt-1 font-display text-xl font-semibold text-white">
                    Top 5 services
                  </div>
                </div>
                <FiAward className="text-hub-cyan" />
              </div>
              <ul className="mt-6 space-y-4">
                {(data?.globalTop || []).map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 hover:border-hub-violet/40"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                        {medals[i] || `0${i + 1}`}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.companyName}</div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div className="font-semibold text-white tabular-nums">
                          {Number(p.visitCount || 0).toLocaleString()} visits
                        </div>
                        <div>{Number(p.reviewCount || 0).toLocaleString()} reviews</div>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="text-xs uppercase tracking-widest text-slate-500">Momentum viz</div>
              <div className="mt-2 font-display text-xl font-semibold text-white">Visits by listing</div>
              <div className="mt-6 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,.1)",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="visits" radius={[10, 10, 0, 0]} fill="url(#barGrad)" />
                    <defs>
                      <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-white">Per-enterprise top 5</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {companies.map((c, idx) => {
                const top =
                  data?.perCompany?.[String(c.id)] ||
                  [];
                return (
                  <GlassCard key={c.slug} delay={idx * 0.06} className="p-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={c.bannerUrl}
                        alt=""
                        className="h-14 w-20 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-display text-lg font-semibold text-white">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.tagline}</div>
                      </div>
                      <Link
                        to={`/marketplace/companies/${c.slug}`}
                        className="ml-auto text-xs font-semibold text-hub-cyan hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <ul className="mt-5 space-y-2">
                      {top.map((p, i) => (
                        <li key={p.id}>
                          <Link
                            to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-hub-violet/40"
                          >
                            <span>
                              <span className="text-xs text-slate-500">{i + 1}. </span>
                              <span className="text-white">{p.name}</span>
                            </span>
                            <span className="text-[10px] text-slate-500">open →</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
