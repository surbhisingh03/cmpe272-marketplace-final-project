import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAward,
  FiHeart,
  FiHome,
  FiMenu,
  FiPieChart,
  FiSearch,
  FiSettings,
  FiStar,
  FiX,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import GradientMesh from "../components/layout/GradientMesh.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
  { to: "/dashboard/home", label: "Home", icon: FiHome },
  { to: "/dashboard/companies", label: "Companies", icon: FiActivity },
  { to: "/dashboard/favorites", label: "Favorites", icon: FiHeart },
  { to: "/dashboard/reviews", label: "Reviews", icon: FiStar },
  { to: "/dashboard/analytics", label: "Analytics", icon: FiPieChart },
  { to: "/dashboard/top-products", label: "Top Products", icon: FiAward },
  { to: "/dashboard/settings", label: "Settings", icon: FiSettings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-hub-bg text-slate-100">
      <GradientMesh />

      <div className="relative z-10 flex">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-hub-bg/65 px-4 py-6 backdrop-bl-xl lg:flex lg:flex-col">
          <Link to="/" className="px-3 font-display text-lg font-semibold text-white">
            Fusion<span className="text-gradient">Hub</span>
          </Link>
          <p className="mt-2 px-3 text-xs text-slate-500">Unified enterprise cockpit</p>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white/10 text-white shadow-glowSm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <item.icon className="opacity-70" /> {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
            <div className="font-semibold text-white">{user?.displayName}</div>
            <div className="truncate text-[11px] text-slate-500">{user?.email}</div>
          </div>
        </aside>

        <AnimatePresence>
          {open && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-hub-bg/98 p-4 backdrop-bl-xl lg:hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-white">FusionHub</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 p-2"
                >
                  <FiX />
                </button>
              </div>
              <nav className="mt-6 flex flex-col gap-1">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    onClick={() => setOpen(false)}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                        isActive ? "bg-white/10 text-white" : "text-slate-200"
                      }`
                    }
                  >
                    <item.icon /> {item.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-hub-bg/70 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 lg:px-6">
              <button
                type="button"
                className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2 lg:hidden"
                onClick={() => setOpen((o) => !o)}
              >
                <FiMenu />
              </button>
              <div className="relative hidden max-w-xl flex-1 md:block">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.currentTarget.value.trim();
                      if (v) navigate(`/search?q=${encodeURIComponent(v)}`);
                    }
                  }}
                  placeholder="Search services, locales, curricula…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
                />
              </div>
              <div className="relative ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotifOpen((x) => !x)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  Notifications
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  Log out
                </button>
              </div>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-4 top-[64px] z-50 w-80 rounded-2xl border border-white/10 bg-hub-surface/95 p-4 text-xs shadow-glow backdrop-blur-2xl"
                  >
                    <div className="font-semibold text-white">Live activity</div>
                    <div className="mt-3 space-y-3 text-slate-300">
                      <div className="rounded-xl bg-white/5 px-3 py-2">
                        Fusion mesh detected uplift on creative packages.
                      </div>
                      <div className="rounded-xl bg-white/5 px-3 py-2">
                        Nexus cohort completed AI fluency checkpoints.
                      </div>
                      <div className="rounded-xl bg-white/5 px-3 py-2">
                        Reviews pending moderation: flagged phrases auto-scanned.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
