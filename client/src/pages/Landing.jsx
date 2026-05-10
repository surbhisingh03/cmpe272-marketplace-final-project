import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";

/* Local hero artwork (provided) —/office atrium scene with icons; keep path under public/images */
/* ?v bumps cache when the asset file is replaced */
const HERO_IMAGE = "/images/hero-marketplace.png?v=11";

const stats = [
  { value: "4", label: "Partner Companies" },
  { value: "32", label: "Products & Services" },
  { value: "1,240", label: "Marketplace Visits" },
  { value: "286", label: "User Reviews" },
];

const partners = [
  {
    name: "Bean & Brew Co.",
    slug: "srikavya-enterprise",
    description: "Premium coffee products and cafe experiences.",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Krativerse",
    slug: "krativerse",
    description: "Video production, photography, branding, and creative storytelling.",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Seaside Travels",
    slug: "travel-agency",
    description: "Luxury travel planning, vacations, and adventure packages.",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Nexus Academy",
    slug: "nexus-academy",
    description: "Online learning, workshops, certifications, and career courses.",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
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
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <MarketingNav />

      {/* Hero — classic layout: full-bleed <img>, vertically centered roomy card (how it looked before CSS-vh refactor) */}
      <section className="relative flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full min-h-[520px] object-cover brightness-[1.03] contrast-[1.07] saturate-[1.11]"
            style={{ objectPosition: "40% center", transform: "scale(1.025)" }}
            decoding="async"
            loading="eager"
          />
        </div>
        {/* Light read boost behind card only — no heavy wash over the scene */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[min(88vh,560px)] w-[min(90vw,680px)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_72%_68%_at_50%_48%,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.06)_42%,transparent_70%)]"
        />

        <div className="relative z-10 flex w-full justify-center px-2 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl rounded-[28px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.82)] p-10 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-[18px] md:max-w-2xl md:p-14"
            style={{ WebkitBackdropFilter: "blur(18px)" }}
          >
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5B21B6] md:text-xs">
            DISCOVER • RATE • REVIEW • CONNECT
          </p>
          <h1 className="mt-5 text-center font-display text-4xl font-bold leading-[1.12] tracking-tight text-[#111827] md:text-5xl md:leading-[1.08]">
            One Marketplace for Four Digital Enterprises
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium leading-relaxed text-[#1f2937] md:text-xl">
            Create one account to explore coffee products, creative services, travel experiences,
            and academy courses from our partner companies.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/marketplace/explore"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-10 py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_-10px_rgba(124,58,237,0.5)] transition duration-200 hover:brightness-[1.06] hover:shadow-[0_18px_40px_-14px_rgba(124,58,237,0.55)] sm:w-auto"
              >
                Explore Marketplace
                <FiArrowRight className="opacity-95" aria-hidden />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/signup"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-200/95 bg-white px-10 py-3.5 text-sm font-semibold text-[#111827] shadow-md transition duration-200 hover:bg-slate-50 hover:shadow-lg sm:w-auto"
              >
                Create Account
              </Link>
            </motion.div>
          </div>
        </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="border-y border-slate-200/80 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="rounded-[20px] border border-slate-100 bg-[#F8FAFC] px-6 py-8 text-center shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]"
              >
                <div className="font-display text-3xl font-bold tabular-nums text-[#111827] md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-medium text-[#6B7280]">{s.label}</div>
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

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {partners.map((p, i) => (
              <motion.article
                key={p.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_8px_40px_-15px_rgba(15,23,42,0.15)]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={p.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                </div>
                <div className="space-y-3 p-7 md:p-8">
                  <h3 className="font-display text-xl font-semibold text-[#111827]">{p.name}</h3>
                  <p className="text-sm leading-relaxed text-[#6B7280]">{p.description}</p>
                  <div className="flex items-center gap-2 pt-1 text-sm font-medium text-[#111827]">
                    <span className="text-amber-500" aria-hidden>
                      ★
                    </span>
                    Rating: {p.rating}
                  </div>
                  <Link
                    to={`/marketplace/companies/${p.slug}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:w-auto"
                  >
                    View Company
                  </Link>
                </div>
              </motion.article>
            ))}
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
