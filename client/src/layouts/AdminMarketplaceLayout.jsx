import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  FiActivity,
  FiAward,
  FiBriefcase,
  FiGrid,
  FiLayers,
  FiList,
  FiMenu,
  FiSearch,
  FiSettings,
  FiStar,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const SIDEBAR_W = "272px";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: FiGrid },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/visits", label: "Visits", icon: FiActivity },
  { to: "/admin/activity", label: "Activity", icon: FiList },
  { to: "/admin/reviews", label: "Reviews", icon: FiStar },
  { to: "/admin/listings", label: "Listings", icon: FiLayers },
  { to: "/admin/rankings", label: "Top 5 Rankings", icon: FiAward },
  { to: "/admin/partners", label: "Partner Companies", icon: FiBriefcase },
  { to: "/admin/settings", label: "Settings", icon: FiSettings },
];

function navClass({ isActive }) {
  if (isActive) {
    return [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-md",
      "bg-gradient-to-r from-violet-600 to-cyan-600 ring-1 ring-white/15",
    ].join(" ");
  }
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200/95 transition",
    "hover:bg-white/10 hover:text-white",
  ].join(" ");
}

export default function AdminMarketplaceLayout() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const email = useMemo(() => user?.email ?? "", [user?.email, location.pathname]);

  function onLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a]">
      {drawer ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
        />
      ) : null}

      {/* Sidebar: fixed full viewport; nav scrolls; footer pinned */}
      <aside
        style={{ width: SIDEBAR_W }}
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-800/90 bg-[#0f172a] text-slate-100 shadow-2xl transition-transform duration-200",
          drawer ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          <Link
            to="/admin"
            className="font-display text-lg font-bold tracking-tight text-white"
            onClick={() => setDrawer(false)}
          >
            FusionHub Admin
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setDrawer(false)}
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass} onClick={() => setDrawer(false)}>
                <Icon className="h-[18px] w-[18px] shrink-0 opacity-95" aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="shrink-0 space-y-2 border-t border-white/10 bg-[#0f172a] p-3">
          <Link
            to="/marketplace/explore"
            className="block rounded-xl bg-white/5 px-3 py-2.5 text-center text-xs font-semibold text-cyan-200/95 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
            onClick={() => setDrawer(false)}
          >
            View customer marketplace
          </Link>
          <p className="text-center text-[10px] font-medium leading-snug text-slate-500">FusionHub Admin · 2026</p>
        </div>
      </aside>

      {/* Main: offset by sidebar on desktop; scrolls independently */}
      <div className="box-border flex min-h-screen w-full max-w-full flex-col lg:min-h-screen lg:pl-[272px] lg:h-screen lg:overflow-hidden">
        <header className="sticky top-0 z-30 shrink-0 border-b border-[#e2e8f0] bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-md backdrop-saturate-150">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-2.5 lg:px-8">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition hover:border-violet-200 hover:text-violet-700 lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div className="relative min-h-0 min-w-0 flex-1">
              <label htmlFor="admin-search" className="sr-only">
                Search marketplace activity
              </label>
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" aria-hidden />
              <input
                id="admin-search"
                type="search"
                readOnly
                placeholder="Search marketplace activity…"
                className="h-9 w-full cursor-not-allowed rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#64748b] shadow-sm outline-none"
                title="Use filters on Listings and Reviews for search."
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:pl-1">
              <span className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Admin
              </span>
              <span className="max-w-[200px] truncate rounded-xl border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f172a] shadow-sm">
                {email || "Signed in"}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-bold text-[#64748b] shadow-sm transition hover:border-red-200 hover:text-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 min-h-0 overflow-y-auto px-3 py-5 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
