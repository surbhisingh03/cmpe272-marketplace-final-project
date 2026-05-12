import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { MARKETPLACE_NAV_LINKS } from "../../constants/marketing.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { userAvatarInitials } from "../../lib/personName.js";

function marketplaceNavbarName(user) {
  if (!user) return "";
  return user.firstName?.trim() || "there";
}

function marketplaceNavbarInitials(user) {
  return userAvatarInitials(user);
}

/** White sticky navbar — matches Landing / auth marketing pages */
export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const firstName = useMemo(() => marketplaceNavbarName(user), [user]);
  const initials = useMemo(() => marketplaceNavbarInitials(user), [user]);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/", { replace: true });
  }

  const loggedInProfile = Boolean(user && (user.id != null || user.email));
  const awaitingProfile =
    Boolean(loading) &&
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("fh_token")) &&
    !user;
  const showUserBar = loggedInProfile || awaitingProfile;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[rgba(255,255,255,0.92)] shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1),0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-sm font-bold text-white shadow-md"
            aria-hidden
          >
            FH
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-[#111827]">
            FusionHub Marketplace
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {MARKETPLACE_NAV_LINKS.map((item) => (
            <Link
              key={`${item.label}-${item.to}`}
              to={item.to}
              className="rounded-xl px-3 py-2 text-sm font-medium text-[#6B7280] transition hover:bg-slate-50 hover:text-[#111827]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {showUserBar ? (
            loggedInProfile ? (
              <>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-xs font-bold text-white shadow-md ring-2 ring-white"
                    aria-hidden
                  >
                    {initials}
                  </span>
                )}
                <span className="max-w-[10rem] truncate text-sm font-semibold text-[#111827]" title={firstName}>
                  {firstName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" aria-hidden />
                <span className="h-4 w-[5.5rem] animate-pulse rounded bg-slate-200" />
                <span className="h-10 w-[5.25rem] shrink-0 animate-pulse rounded-full bg-slate-200" />
              </>
            )
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#111827] lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {MARKETPLACE_NAV_LINKS.map((item) => (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                className="rounded-xl px-3 py-3 text-sm font-medium text-[#111827] hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {showUserBar ? (
              loggedInProfile ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-xs font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-[#111827]">{firstName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-[#111827]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex animate-pulse flex-col gap-2 py-2">
                  <div className="h-12 rounded-xl bg-slate-200" />
                  <div className="h-11 rounded-full bg-slate-200" />
                </div>
              )
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-[#111827]"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-center text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
