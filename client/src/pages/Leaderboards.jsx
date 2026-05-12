import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import PublicShell from "../components/layout/PublicShell.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { marketplaceListingPath } from "../lib/marketplaceDisplay.js";
import LeaderboardListRow from "../components/marketplace/LeaderboardListRow.jsx";
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

  const chartData =
    data?.globalTop?.map((p) => ({
      name: p.name.slice(0, 18),
      visits: Number(p.visitCount) || 0,
    })) || [];

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Top 5 · Live leaderboards
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
            Top listings based on visits, reviews, and ratings. Ranked by marketplace engagement.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Global marketplace</div>
                <div className="mt-1 font-display text-xl font-bold text-[#111827]">🏆 Top 5 Marketplace</div>
              </div>
              <FiAward className="text-[#7c3aed]" />
            </div>
            <ul className="mt-6 flex list-none flex-col gap-3 p-0">
              {(data?.globalTop || []).map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="list-none"
                >
                  <LeaderboardListRow
                    rank={i + 1}
                    title={p.name}
                    subtitle={p.companyName}
                    category={p.category}
                    reviewCount={p.reviewCount}
                    avgRating={p.avgRating}
                    to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                  />
                </motion.li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Momentum viz</div>
            <div className="mt-2 font-display text-xl font-bold text-[#111827]">Visits by listing</div>
            <div className="mt-6 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      color: "#111827",
                    }}
                  />
                  <Bar dataKey="visits" radius={[10, 10, 0, 0]} fill="url(#barGradLight)" />
                  <defs>
                    <linearGradient id="barGradLight" x1="0" x2="0" y1="0" y2="1">
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
          <h2 className="font-display text-2xl font-bold text-[#111827]">Per-enterprise top 5</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {companies.map((c, idx) => {
              const top = data?.perCompany?.[String(c.id)] || [];
              return (
                <GlassCard key={c.slug} delay={idx * 0.06} className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={c.bannerUrl} alt="" className="h-14 w-20 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="font-display text-lg font-bold text-[#111827]">{c.name}</div>
                      <div className="text-xs text-[#6B7280]">{c.tagline}</div>
                    </div>
                    <Link
                      to={`/marketplace/companies/${c.slug}`}
                      className="ml-auto shrink-0 text-xs font-semibold text-[#7c3aed] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <ul className="mt-5 flex list-none flex-col gap-3 p-0">
                    {top.map((p, i) => (
                      <li key={p.id} className="list-none">
                        <LeaderboardListRow
                          rank={i + 1}
                          title={p.name}
                          subtitle={null}
                          category={p.category}
                          reviewCount={p.reviewCount}
                          avgRating={p.avgRating}
                          to={p.slug ? marketplaceListingPath(p.slug) : `/marketplace/products/${p.id}`}
                        />
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
