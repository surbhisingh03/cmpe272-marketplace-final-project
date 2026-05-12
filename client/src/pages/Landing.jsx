import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiPath } from "../lib/api.js";

const borderSubtle = "1px solid rgba(0,0,0,0.06)";

function storefrontHref(slug, externalUrl) {
  const u = String(externalUrl || "").trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return `/marketplace/companies/${slug}`;
}

/** Member storefront cards — order matches landing grid; gradients per owner. */
const MEMBER_COMPANY_CARDS = [
  {
    slug: "nexus-academy",
    title: "Nexus Academy",
    member: "Geeshitha",
    emoji: "🎓",
    gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  },
  {
    slug: "travel-agency",
    title: "Travel Agency",
    member: "Surbhi",
    emoji: "✈️",
    gradient: "linear-gradient(135deg, #0891b2, #0d9488)",
  },
  {
    slug: "srikavya-enterprise",
    title: "Kavya's site",
    member: "Kavya",
    emoji: "☕",
    gradient: "linear-gradient(135deg, #d97706, #dc2626)",
  },
  {
    slug: "krativerse",
    title: "Krativerse",
    member: "Krati",
    emoji: "🎬",
    gradient: "linear-gradient(135deg, #db2777, #7c3aed)",
  },
];

const trending = [
  {
    rank: 1,
    title: "Morning Sunrise Blend",
    company: "Bean & Brew Co.",
    to: "/marketplace/companies/srikavya-enterprise",
  },
  {
    rank: 2,
    title: "Video Production Package",
    company: "Krativerse",
    to: "/marketplace/companies/krativerse",
  },
  {
    rank: 3,
    title: "Luxury Travel Planning",
    company: "Seaside Travels",
    to: "/marketplace/companies/travel-agency",
  },
  {
    rank: 4,
    title: "Python Programming Course",
    company: "Nexus Academy",
    to: "/marketplace/companies/nexus-academy",
  },
  {
    rank: 5,
    title: "Ethiopian Yirgacheffe",
    company: "Bean & Brew Co.",
    to: "/marketplace/companies/srikavya-enterprise",
  },
];

export default function Landing() {
  const [heroQ, setHeroQ] = useState("");
  const [landingStats, setLandingStats] = useState(null);
  const [companyBySlug, setCompanyBySlug] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, companiesRes] = await Promise.all([
          fetch(apiPath("/api/marketplace/landing-stats"), { credentials: "include" }),
          fetch(apiPath("/api/marketplace/companies"), { credentials: "include" }),
        ]);
        const statsData = await statsRes.json().catch(() => null);
        const companiesData = await companiesRes.json().catch(() => null);
        if (!cancelled && statsRes.ok && statsData && typeof statsData.productCount === "number") {
          setLandingStats(statsData);
        }
        if (!cancelled && companiesRes.ok && companiesData?.companies?.length) {
          const next = {};
          for (const c of companiesData.companies) {
            next[c.slug] = {
              productCount: Number(c.productCount) || 0,
              externalUrl: c.externalUrl || "",
            };
          }
          setCompanyBySlug(next);
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const companyCountForHero = landingStats?.companyCount ?? MEMBER_COMPANY_CARDS.length;

  function onHeroSearch(e) {
    e.preventDefault();
    const q = heroQ.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <MarketingNav />

      <section
        className="relative w-full overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%)",
          padding: "48px 28px 40px",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            background: "rgba(167,139,250,0.15)",
            filter: "blur(50px)",
            top: "-30px",
            right: "-40px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            background: "rgba(96,165,250,0.1)",
            filter: "blur(35px)",
            bottom: "-20px",
            left: "-30px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          <div
            className="mx-auto inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium"
            style={{
              borderColor: "rgba(167,139,250,0.3)",
              background: "rgba(167,139,250,0.12)",
              color: "#c4b5fd",
            }}
          >
            ✦ {companyCountForHero} companies · one marketplace
          </div>

          <h1
            className="mt-5 font-display text-white"
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            One <span className="gradient-text">Marketplace</span> for {companyCountForHero} Digital{" "}
            <span className="gradient-text">Enterprises</span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-xl"
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
            }}
          >
            Create one account to explore coffee products, creative services, travel experiences, and academy
            courses from our partner companies.
          </p>

          <form
            onSubmit={onHeroSearch}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl border px-2.5"
            style={{
              height: 46,
              background: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <input
              type="search"
              value={heroQ}
              onChange={(e) => setHeroQ(e.target.value)}
              placeholder="Search enterprises, journeys, creatives…"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none ring-0 placeholder:text-white/40"
              style={{ color: "#ffffff" }}
              aria-label="Search marketplace"
            />
            <button
              type="submit"
              className="shrink-0 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-95"
              style={{
                background: "var(--grad-cta, linear-gradient(135deg, #a78bfa, #60a5fa))",
                borderRadius: 12,
              }}
            >
              Search
            </button>
          </form>
        </motion.div>
      </section>

      {/* Statistics — counts from MySQL via /api/marketplace/landing-stats */}
      <section className="bg-white" style={{ borderBottom: borderSubtle }}>
        <div className="mx-auto max-w-7xl">
          <div
            className="grid w-full grid-cols-4 gap-0 text-center"
            style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
          >
            {[
              {
                key: "products",
                label: "Total products",
                value:
                  landingStats != null
                    ? landingStats.productCount.toLocaleString()
                    : "—",
              },
              {
                key: "users",
                label: "Users",
                value: landingStats != null ? landingStats.userCount.toLocaleString() : "—",
              },
              {
                key: "reviews",
                label: "Reviews",
                value: landingStats != null ? landingStats.reviewCount.toLocaleString() : "—",
              },
              {
                key: "avg",
                label: "Avg rating",
                value:
                  landingStats == null
                    ? "—"
                    : landingStats.reviewCount > 0
                      ? Number(landingStats.avgRating).toFixed(2)
                      : "—",
              },
            ].map((cell, i) => (
              <motion.div
                key={cell.key}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="min-w-0"
                style={{
                  padding: "18px 22px",
                  borderRight: i < 3 ? borderSubtle : "none",
                }}
              >
                <div
                  className="gradient-text font-display tabular-nums"
                  style={{ fontSize: 24, fontWeight: 800 }}
                >
                  {cell.value}
                </div>
                <div className="text-[11px] text-[#6b7280]" style={{ marginTop: 3 }}>
                  {cell.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="scroll-mt-28 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-[#111827] md:text-4xl">
              Explore Our Partner Companies
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
              Shop coffee, commission creative work, plan travel, and build skills—all with one sign-in across
              our partner brands.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBER_COMPANY_CARDS.map((card, i) => {
              const api = companyBySlug[card.slug];
              const href = storefrontHref(card.slug, api?.externalUrl);
              const isExternal = /^https?:\/\//i.test(href);
              const countLine =
                api !== undefined
                  ? `${api.productCount} product${api.productCount === 1 ? "" : "s"} & services`
                  : null;
              const cardBody = (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      background: "rgba(255,255,255,0.12)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col">
                    <span className="leading-none" style={{ fontSize: 24 }} role="img" aria-hidden>
                      {card.emoji}
                    </span>
                    <div className="mt-3 font-bold text-white" style={{ fontSize: 14, fontWeight: 700 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
                      {card.member}
                      {countLine != null ? ` · ${countLine}` : ""}
                    </div>
                  </div>
                </>
              );
              const cardClass =
                "relative block h-full overflow-hidden rounded-[18px] text-left text-inherit no-underline outline-none ring-0 transition-colors";

              return (
                <motion.div
                  key={card.slug}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                  viewport={{ once: true, margin: "-24px" }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="min-w-0"
                >
                  {isExternal ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                      style={{ padding: 18, background: card.gradient }}
                      aria-label={`${card.title} — open live storefront`}
                    >
                      {cardBody}
                    </a>
                  ) : (
                    <Link
                      to={href}
                      className={cardClass}
                      style={{ padding: 18, background: card.gradient }}
                      aria-label={`${card.title} — view on FusionHub`}
                    >
                      {cardBody}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="border-t border-slate-200 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-[#111827] md:text-4xl">
            Trending Across the Marketplace
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[#6B7280]">
            Popular picks from shoppers this week—from beans to productions, itineraries, and courses.
          </p>

          <ol className="mt-12 space-y-3">
            {trending.map((item, i) => (
              <motion.li
                key={item.rank}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={item.to}
                  className="flex items-center gap-4 rounded-[18px] border border-slate-100 bg-[#F8FAFC] px-5 py-4 shadow-sm transition hover:border-[#7C3AED]/25 hover:bg-white hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED]/15 to-[#06B6D4]/15 text-sm font-bold text-[#7C3AED]">
                    {item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[#111827]">{item.title}</div>
                    <div className="truncate text-sm text-[#6B7280]">{item.company}</div>
                  </div>
                  <span className="hidden shrink-0 text-sm font-medium text-[#7C3AED] sm:inline">
                    View
                  </span>
                </Link>
              </motion.li>
            ))}
          </ol>

          <div className="mt-10 flex justify-center">
            <Link
              to="/leaderboards"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#111827] shadow-sm hover:border-[#7C3AED]/40"
            >
              See full Top 5
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
