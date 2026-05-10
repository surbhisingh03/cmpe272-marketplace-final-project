import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiCheckCircle, FiGrid, FiLock, FiMail } from "react-icons/fi";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const REMEMBER_KEY = "fh_login_remember";
const SAVED_EMAIL_KEY = "fh_login_email";

/** Seeded marketplace demo profile — matches `npm run seed` inserts */
const DEMO_EMAIL = "marketplace-demo@fusionhub.demo";
const DEMO_PASSWORD = "MarketplaceDemo!";

const inputIconWrap =
  "pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B]";
const inputShell =
  "relative rounded-2xl border border-slate-200/95 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition focus-within:border-[#7C3AED] focus-within:ring-4 focus-within:ring-[#7C3AED]/12";
const inputInner =
  "w-full rounded-2xl border-0 bg-transparent py-3 pl-12 pr-4 text-sm text-[#111827] placeholder:text-slate-400 outline-none ring-0";

const ACCESS_ITEMS = [
  "Continue your marketplace journey",
  "View your visit history",
  "Add reviews and ratings",
  "Check saved favorites",
  "Explore top-ranked products and services",
];

const PARTNERS = [
  "Bean & Brew Co.",
  "Krativerse",
  "Seaside Travels",
  "Nexus Academy",
];

export default function Login() {
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(REMEMBER_KEY) === "1") {
        const saved = localStorage.getItem(SAVED_EMAIL_KEY);
        if (saved) setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function validate() {
    const fe = {};
    if (!email.trim()) fe.email = "Email is required";
    if (!password.trim()) fe.password = "Password is required";
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  }

  function applyRememberPreference(credentialsEmail) {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, "1");
        localStorage.setItem(SAVED_EMAIL_KEY, credentialsEmail.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  async function finalizeLogin(emailUsed, pw) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailUsed, password: pw }),
    });
    loginWithToken(res.token, {
      id: res.user.id,
      email: res.user.email,
      displayName: res.user.displayName,
      avatarUrl: res.user.avatarUrl,
      preferredInterest: res.user.preferredInterest,
      accountType: res.user.accountType,
    });
    applyRememberPreference(emailUsed);
    setStep("success");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    if (!validate()) {
      setBusy(false);
      return;
    }
    try {
      await finalizeLogin(email.trim(), password);
    } catch (err) {
      setError(err.payload?.error || err.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDemoContinue() {
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      setEmail(DEMO_EMAIL);
      await finalizeLogin(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err) {
      setError(
        err.payload?.error ||
          err.message ||
          "Demo sign-in failed. Run `npm run seed` in the server folder to create the demo user."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <MarketingNav />

      <div
        className="relative border-b border-slate-200/80 bg-[#F8FAFC]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 55% at 50% -20%, rgba(124,58,237,0.12), transparent 55%),
            radial-gradient(ellipse 65% 50% at 100% 0%, rgba(6,182,212,0.10), transparent 50%),
            linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)
          `,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-8 lg:px-8 lg:pb-12 lg:pt-8">
          {step === "form" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(480px,520px)] lg:items-start lg:gap-x-10 lg:gap-y-8 xl:gap-x-12"
            >
              <div className="order-1 min-w-0 lg:order-none lg:self-start">
                <div className="overflow-hidden rounded-[28px] border border-[#E9D5FF]/60 bg-gradient-to-br from-[#FAF5FF] via-white to-[#ECFEFF] p-8 shadow-[0_24px_80px_-32px_rgba(124,58,237,0.35)] md:p-10">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6D28D9] md:text-left">
                    One marketplace • Four partner companies
                  </p>
                  <h1 className="mt-4 text-center font-display text-3xl font-bold leading-tight tracking-tight text-[#111827] md:text-left md:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
                    Welcome Back to FusionHub
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[#475569] md:mx-0 md:text-left md:text-lg">
                    Sign in to continue exploring coffee products, creative services, travel experiences,
                    and academy courses from one marketplace account.
                  </p>

                  <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Your Marketplace Access
                  </p>
                  <ul className="mt-4 space-y-3.5">
                    {ACCESS_ITEMS.map((line) => (
                      <motion.li
                        key={line}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3.5 shadow-sm backdrop-blur-sm"
                      >
                        <FiCheckCircle
                          aria-hidden
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#7C3AED]"
                        />
                        <span className="text-sm font-medium leading-snug text-[#334155]">{line}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Partner ecosystem
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {PARTNERS.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#374151] shadow-sm"
                      >
                        <FiGrid aria-hidden className="text-[#7C3AED]" size={13} /> {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-2 min-w-0 w-full lg:order-none lg:justify-self-stretch lg:self-start">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[28px] border border-slate-200/90 bg-white p-8 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.22)] md:p-9"
                >
                  <h2 className="font-display text-2xl font-bold text-[#111827]">Sign In</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                    Access your FusionHub Marketplace account.
                  </p>

                  <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
                    <div className="w-full">
                      <label htmlFor="login-email" className="text-xs font-semibold text-[#64748B]">
                        Email address
                      </label>
                      <div className={`${inputShell} mt-1.5`}>
                        <span className={inputIconWrap}>
                          <FiMail size={17} aria-hidden />
                        </span>
                        <input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@organization.com"
                          value={email}
                          onChange={(ev) => {
                            setEmail(ev.target.value);
                            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          className={inputInner}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div className="w-full">
                      <label htmlFor="login-password" className="text-xs font-semibold text-[#64748B]">
                        Password
                      </label>
                      <div className={`${inputShell} mt-1.5`}>
                        <span className={inputIconWrap}>
                          <FiLock size={17} aria-hidden />
                        </span>
                        <input
                          id="login-password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(ev) => {
                            setPassword(ev.target.value);
                            if (fieldErrors.password)
                              setFieldErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          className={inputInner}
                        />
                      </div>
                      {fieldErrors.password && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475569]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#7C3AED]"
                          checked={rememberMe}
                          onChange={(ev) => setRememberMe(ev.target.checked)}
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        title="Password reset isn’t configured in this demo build."
                        className="text-sm font-semibold text-[#7C3AED] transition hover:text-[#5B21B6] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                      >
                        {error}
                      </div>
                    )}

                    <motion.button
                      disabled={busy}
                      whileHover={{ scale: busy ? 1 : 1.01 }}
                      whileTap={{ scale: busy ? 1 : 0.99 }}
                      type="submit"
                      className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-sm font-semibold text-white shadow-[0_14px_40px_-14px_rgba(124,58,237,0.55)] transition hover:opacity-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {busy ? "Signing in…" : "Sign In"}
                      {!busy ? <FiArrowRight aria-hidden className="opacity-95" /> : null}
                    </motion.button>
                  </form>

                  <div className="mt-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                      or
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <motion.button
                    type="button"
                    disabled={busy}
                    whileHover={{ scale: busy ? 1 : 1.005 }}
                    whileTap={{ scale: busy ? 1 : 0.995 }}
                    onClick={onDemoContinue}
                    className="mt-6 w-full rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-[#374151] shadow-md transition hover:border-[#7C3AED]/35 hover:bg-slate-50 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
                  >
                    Continue as Demo User
                  </motion.button>

                  <p className="mt-8 text-center text-xs text-[#64748B]">
                    Don’t have an account?{" "}
                    <Link to="/signup" className="font-semibold text-[#7C3AED] hover:underline">
                      Create account
                    </Link>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-[520px] py-4"
            >
              <div className="rounded-[28px] border border-slate-200/90 bg-white p-9 text-center shadow-[0_28px_80px_-34px_rgba(15,23,42,0.2)] md:p-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] shadow-lg shadow-[#7C3AED]/25">
                  <FiCheckCircle className="h-8 w-8 text-white md:h-9 md:w-9" aria-hidden />
                </div>
                <p className="font-display text-lg font-bold leading-snug text-[#111827]">
                  Signed in successfully!
                </p>
                <p className="mt-3 text-base font-semibold leading-snug text-[#374151]">
                  Welcome back to FusionHub Marketplace.
                </p>
                <div className="mx-auto mt-8 flex flex-col gap-3 sm:flex-row">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Link
                      to="/dashboard/home"
                      className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-sm font-semibold text-white shadow-[0_12px_32px_-10px_rgba(124,58,237,0.45)]"
                    >
                      Go to Dashboard
                      <FiArrowRight className="ml-2" aria-hidden />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Link
                      to="/marketplace/explore"
                      className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-[#111827] shadow-md transition hover:bg-slate-50 hover:shadow-lg"
                    >
                      Explore Marketplace
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
