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

const navLinkClass = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    isActive
      ? "bg-violet-50 font-semibold text-violet-900 ring-1 ring-violet-200/80"
      : "text-[#6B7280] hover:bg-slate-100 hover:text-[#111827]",
  ].join(" ");

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="relative z-10 flex">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-6 shadow-sm lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2.5 px-3 no-underline">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              FH
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[#111827]">FusionHub</span>
          </Link>
          <p className="mt-2 px-3 text-xs text-[#6B7280]">Your marketplace dashboard</p>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon className="h-4 w-4 opacity-70" /> {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs">
            <div className="font-semibold text-[#111827]">{user?.displayName}</div>
            <div className="truncate text-[11px] text-[#6B7280]">{user?.email}</div>
          </div>
        </aside>

        <AnimatePresence>
          {open && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white p-4 shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[#111827]">FusionHub</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-[#6B7280] hover:bg-slate-50"
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
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                        isActive ? "bg-violet-50 text-violet-900" : "text-[#6B7280]"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-4 lg:px-6">
              <button
                type="button"
                className="inline-flex rounded-xl border border-slate-200 bg-white p-2 text-[#111827] hover:bg-slate-50 lg:hidden"
                onClick={() => setOpen((o) => !o)}
              >
                <FiMenu />
              </button>
              <div className="relative hidden max-w-xl flex-1 md:block">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.currentTarget.value.trim();
                      if (v) navigate(`/search?q=${encodeURIComponent(v)}`);
                    }
                  }}
                  placeholder="Search services, locales, curricula…"
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none ring-0 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div className="relative ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotifOpen((x) => !x)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#6B7280] hover:bg-slate-50"
                >
                  Notifications
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#6B7280] hover:bg-slate-50"
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
                    className="absolute right-4 top-[64px] z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-lg"
                  >
                    <div className="font-semibold text-[#111827]">Live activity</div>
                    <div className="mt-3 space-y-3 text-[#6B7280]">
                      <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] px-3 py-2">
                        Fusion mesh detected uplift on creative packages.
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] px-3 py-2">
                        Nexus cohort completed AI fluency checkpoints.
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] px-3 py-2">
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
