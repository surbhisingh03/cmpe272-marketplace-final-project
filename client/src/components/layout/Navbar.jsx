import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiMoon, FiSearch, FiSun, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

function navbarInitials(user) {
  if (!user) return "?";
  const raw = user.displayName?.trim();
  if (raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[0][0]}`.toUpperCase();
  }
  const email = user.email?.split("@")[0] || "?";
  return email.slice(0, 2).toUpperCase();
}

const navBarStyle = {
  background: "linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
};

const navLinkClass = ({ isActive }) =>
  [
    "text-[13px] font-normal no-underline transition-colors",
    isActive ? "text-white" : "text-[rgba(255,255,255,0.6)] hover:text-white",
  ].join(" ");

const navLinkClassPartners =
  "text-[13px] font-normal no-underline text-[rgba(255,255,255,0.6)] transition-colors hover:text-white";

export default function Navbar({ onSearchCompanies = [], products = [] }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [notice] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const initials = useMemo(() => navbarInitials(user), [user]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const hits = [];
    for (const p of products) {
      if (String(p.name).toLowerCase().includes(s)) hits.push({ type: "product", ...p });
    }
    for (const c of onSearchCompanies) {
      if (String(c.name).toLowerCase().includes(s)) hits.push({ type: "company", ...c });
    }
    return hits.slice(0, 8);
  }, [q, products, onSearchCompanies]);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-0"
      style={navBarStyle}
    >
      <div className="mx-auto flex h-[54px] max-w-7xl items-center gap-4 px-6">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 md:flex-none md:justify-start">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 no-underline">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                boxShadow: "none",
              }}
            >
              FH
            </div>
            <span className="truncate text-base font-bold leading-none text-white">FusionHub</span>
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 md:hidden"
            style={{ boxShadow: "none" }}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/#partners" className={navLinkClassPartners}>
            Partners
          </NavLink>
          <NavLink to="/marketplace/explore" className={navLinkClass}>
            Explore Marketplace
          </NavLink>
          <NavLink to="/leaderboards" className={navLinkClass}>
            Top 5
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
            placeholder="Search enterprises, journeys, creatives…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-white/20 focus:ring-0"
            style={{ boxShadow: "none" }}
          />
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-white/10 bg-[#1a0533]/98"
                style={{ boxShadow: "none" }}
              >
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id || r.slug || i}`}
                    type="button"
                    onClick={() => {
                      setQ("");
                      if (r.type === "product")
                        nav(r.slug ? `/marketplace/listing/${encodeURIComponent(r.slug)}` : `/marketplace/products/${r.id}`);
                      else nav(`/marketplace/companies/${r.slug}`);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10"
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/45">{r.type}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            style={{ boxShadow: "none" }}
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            style={{ boxShadow: "none" }}
            aria-label="Notifications"
          >
            <FiBell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400" />
            {notice === false ? null : null}
          </button>
          {!isAuthenticated ? (
            <div className="ml-1 flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[13px] font-medium text-white no-underline transition-colors hover:bg-white/[0.12]"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  boxShadow: "none",
                }}
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[13px] font-bold text-white no-underline transition-opacity hover:opacity-95"
                style={{
                  background: "var(--grad-cta, linear-gradient(135deg, #a78bfa, #60a5fa))",
                  boxShadow: "none",
                }}
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: "rgba(255,255,255,0.15)" }}
                title={user?.displayName || user?.name || user?.email || ""}
                aria-hidden
              >
                {initials}
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-3 py-1.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                style={{ boxShadow: "none" }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.08] md:hidden"
            style={{ background: "linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%)", boxShadow: "none" }}
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <div className="relative mb-3">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && q.trim()) {
                      nav(`/search?q=${encodeURIComponent(q.trim())}`);
                      setOpen(false);
                    }
                  }}
                  placeholder="Search…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none"
                  style={{ boxShadow: "none" }}
                />
                {results.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full z-40 mt-1 max-h-48 overflow-auto rounded-xl border border-white/10 bg-[#1a0533]"
                    style={{ boxShadow: "none" }}
                  >
                    {results.map((r, i) => (
                      <button
                        key={`m-${r.type}-${r.id || r.slug || i}`}
                        type="button"
                        onClick={() => {
                          setQ("");
                          setOpen(false);
                          if (r.type === "product")
                            nav(r.slug ? `/marketplace/listing/${encodeURIComponent(r.slug)}` : `/marketplace/products/${r.id}`);
                          else nav(`/marketplace/companies/${r.slug}`);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10"
                      >
                        <span>{r.name}</span>
                        <span className="text-[10px] uppercase text-white/45">{r.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="py-2.5 text-[13px] text-[rgba(255,255,255,0.6)] no-underline hover:text-white"
              >
                Home
              </Link>
              <Link
                to="/#partners"
                onClick={() => setOpen(false)}
                className="py-2.5 text-[13px] text-[rgba(255,255,255,0.6)] no-underline hover:text-white"
              >
                Partners
              </Link>
              <Link
                to="/marketplace/explore"
                onClick={() => setOpen(false)}
                className="py-2.5 text-[13px] text-[rgba(255,255,255,0.6)] no-underline hover:text-white"
              >
                Explore Marketplace
              </Link>
              <Link
                to="/leaderboards"
                onClick={() => setOpen(false)}
                className="py-2.5 text-[13px] text-[rgba(255,255,255,0.6)] no-underline hover:text-white"
              >
                Top 5
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-[13px] text-[rgba(255,255,255,0.6)] no-underline hover:text-white"
                >
                  Dashboard
                </Link>
              )}

              <div className="mt-2 flex items-center gap-2 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={toggle}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                  aria-label="Toggle theme"
                >
                  {isDark ? <FiSun /> : <FiMoon />}
                </button>
              </div>

              {!isAuthenticated ? (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-center text-[13px] font-medium text-white no-underline"
                    style={{ background: "rgba(255,255,255,0.1)", boxShadow: "none" }}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-center text-[13px] font-bold text-white no-underline"
                    style={{
                      background: "var(--grad-cta, linear-gradient(135deg, #a78bfa, #60a5fa))",
                      boxShadow: "none",
                    }}
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      {initials}
                    </div>
                    <span className="truncate text-sm text-white/80">{user?.displayName || user?.name || user?.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="w-full rounded-full border border-white/15 py-2 text-[13px] text-white/80 hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
