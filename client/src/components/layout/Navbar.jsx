import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiMoon, FiSearch, FiSun, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function Navbar({ onSearchCompanies = [], products = [] }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [notice] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

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

  const link =
    "text-sm font-medium text-slate-300 hover:text-white transition-colors dark:text-slate-300";
  const active =
    "text-sm font-semibold text-white bg-white/10 rounded-lg px-3 py-1.5 dark:text-white";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-hub-bg/70 backdrop-blur-xl dark:bg-hub-bg/70">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-hub-violet via-hub-cyan to-pink-500 p-[2px] shadow-glowSm">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-hub-bg text-xs font-black tracking-tight text-white">
              FH
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold text-white">FusionHub</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Marketplace
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={({ isActive }) => (isActive ? active : link)}>
            Home
          </NavLink>
          <NavLink to="/#partners" className={link}>
            Partners
          </NavLink>
          <NavLink to="/marketplace/explore" className={({ isActive }) => (isActive ? active : link)}>
            Explore Marketplace
          </NavLink>
          <NavLink to="/leaderboards" className={({ isActive }) => (isActive ? active : link)}>
            Top 5
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? active : link)}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
            placeholder="Search enterprises, journeys, creatives…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
          />
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-[110%] z-40 overflow-hidden rounded-2xl border border-white/10 bg-hub-surface/95 shadow-glowSm backdrop-blur-2xl"
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
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                      {r.type}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
          <button
            type="button"
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 md:inline-flex"
          >
            <FiBell />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-hub-cyan shadow-[0_0_12px_#06B6D4]" />
            {notice === false ? null : null}
          </button>
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10 md:inline-flex"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden rounded-xl bg-gradient-to-r from-hub-violet to-hub-cyan px-3 py-2 text-sm font-semibold text-white shadow-glowSm md:inline-flex"
              >
                Join
              </Link>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <span className="font-medium text-white">{user?.displayName}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-hub-bg/95 md:hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              <Link to="/" onClick={() => setOpen(false)} className="py-2 text-sm text-slate-200">
                Home
              </Link>
              <Link to="/marketplace/explore" onClick={() => setOpen(false)} className="py-2 text-sm">
                Explore Marketplace
              </Link>
              <Link to="/leaderboards" onClick={() => setOpen(false)} className="py-2 text-sm">
                Top 5
              </Link>
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="py-2 text-sm">
                    Join
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
