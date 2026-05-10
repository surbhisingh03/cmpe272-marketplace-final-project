import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCheckCircle,
  FiGrid,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const inputIconWrap =
  "pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B]";
const inputShell =
  "relative rounded-2xl border border-slate-200/95 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition focus-within:border-[#7C3AED] focus-within:ring-4 focus-within:ring-[#7C3AED]/12";
const inputInner =
  "w-full rounded-2xl border-0 bg-transparent py-3 pl-12 pr-4 text-sm text-[#111827] placeholder:text-slate-400 outline-none ring-0";
const selectInner =
  `${inputInner} appearance-none bg-[length:14px_10px] bg-[right_1rem_center] bg-no-repeat pr-10`;

const BENEFITS = [
  "One account for all partner companies",
  "Track your visits across the marketplace",
  "Review and rate any product or service",
  "Save favorites and receive marketplace recommendations",
  "View top-rated services across all companies",
];

const COMPANIES = [
  "Bean & Brew Co.",
  "Krativerse",
  "Seaside Travels",
  "Nexus Academy",
];

const INTEREST_OPTIONS = [
  { value: "coffee", label: "Coffee Products" },
  { value: "creative", label: "Creative Services" },
  { value: "travel", label: "Travel Experiences" },
  { value: "academy", label: "Academy Courses" },
  { value: "all", label: "All Categories" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState("form"); // 'form' | 'success'

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredInterest, setPreferredInterest] = useState("all");
  const [accountType, setAccountType] = useState("customer");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const fe = {};
    if (!fullName.trim()) fe.fullName = "Full name is required";
    const em = email.trim();
    if (!em) fe.email = "Email is required";
    else if (!EMAIL_RE.test(em)) fe.email = "Enter a valid email address";
    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) fe.phone = "Phone number is required";
    else if (digits.length < 10) fe.phone = "Enter at least 10 digits";

    if (!password) fe.password = "Password is required";
    else if (password.length < 8) fe.password = "Use at least 8 characters";

    if (password !== confirmPassword) fe.confirmPassword = "Passwords do not match";
    if (!termsAgreed) fe.terms = "Please accept the terms to continue";

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setBusy(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          preferredInterest,
          accountType,
        }),
      });

      loginWithToken(res.token, {
        id: res.user.id,
        email: res.user.email,
        displayName: res.user.displayName,
        preferredInterest: res.user.preferredInterest,
        accountType: res.user.accountType,
      });
      setStep("success");
    } catch (err) {
      setError(err.payload?.error || err.message || "Could not create account");
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
        {/* subtle grid */}
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
              {/* Welcome / benefits */}
              <div className="order-1 min-w-0 lg:order-none lg:self-start">
                <div className="overflow-hidden rounded-[28px] border border-[#E9D5FF]/60 bg-gradient-to-br from-[#FAF5FF] via-white to-[#ECFEFF] p-8 shadow-[0_24px_80px_-32px_rgba(124,58,237,0.35)] md:p-10">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6D28D9] md:text-left">
                    One marketplace • Four partner companies
                  </p>
                  <h1 className="mt-4 text-center font-display text-3xl font-bold leading-tight tracking-tight text-[#111827] md:text-left md:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
                    Create Your FusionHub Account
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-[#475569] md:mx-0 md:text-left md:text-lg">
                    Join one marketplace to explore products, services, reviews, and recommendations across
                    all partner companies.
                  </p>

                  <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    What you unlock
                  </p>
                  <ul className="mt-4 space-y-3.5">
                    {BENEFITS.map((line) => (
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
                    {COMPANIES.map((name) => (
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

              {/* Form card */}
              <div className="order-2 min-w-0 w-full lg:order-none lg:justify-self-stretch lg:self-start">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[28px] border border-slate-200/90 bg-white p-8 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.22)] md:p-9"
                >
                  <h2 className="font-display text-2xl font-bold text-[#111827]">Create Account</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                    Create one account to visit companies, track activity, add reviews, and view marketplace
                    rankings.
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                    {/* Row 1: Full name | Phone */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                      <div className="min-w-0">
                        <label htmlFor="fullName" className="text-xs font-semibold text-[#64748B]">
                          Full name
                        </label>
                        <div className={`${inputShell} mt-1.5`}>
                          <span className={inputIconWrap}>
                            <FiUser size={17} aria-hidden />
                          </span>
                          <input
                            id="fullName"
                            autoComplete="name"
                            placeholder="Ada Lovelace"
                            value={fullName}
                            onChange={(ev) => setFullName(ev.target.value)}
                            className={inputInner}
                          />
                        </div>
                        {fieldErrors.fullName && (
                          <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="phone" className="text-xs font-semibold text-[#64748B]">
                          Phone number
                        </label>
                        <div className={`${inputShell} mt-1.5`}>
                          <span className={inputIconWrap}>
                            <FiPhone size={17} aria-hidden />
                          </span>
                          <input
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="(555) 123-4567"
                            value={phone}
                            onChange={(ev) => setPhone(ev.target.value)}
                            className={inputInner}
                          />
                        </div>
                        {fieldErrors.phone && (
                          <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Email full width */}
                    <div className="w-full">
                      <label htmlFor="email" className="text-xs font-semibold text-[#64748B]">
                        Email address
                      </label>
                      <div className={`${inputShell} mt-1.5`}>
                        <span className={inputIconWrap}>
                          <FiMail size={17} aria-hidden />
                        </span>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@organization.com"
                          value={email}
                          onChange={(ev) => setEmail(ev.target.value)}
                          className={inputInner}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
                      )}
                    </div>

                    {/* Row 3: Password | Confirm */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                      <div className="min-w-0">
                        <label htmlFor="password" className="text-xs font-semibold text-[#64748B]">
                          Password
                        </label>
                        <div className={`${inputShell} mt-1.5`}>
                          <span className={inputIconWrap}>
                            <FiLock size={17} aria-hidden />
                          </span>
                          <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(ev) => setPassword(ev.target.value)}
                            className={inputInner}
                          />
                        </div>
                        {fieldErrors.password && (
                          <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="confirmPassword" className="text-xs font-semibold text-[#64748B]">
                          Confirm password
                        </label>
                        <div className={`${inputShell} mt-1.5`}>
                          <span className={inputIconWrap}>
                            <FiLock size={17} aria-hidden />
                          </span>
                          <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={(ev) => setConfirmPassword(ev.target.value)}
                            className={inputInner}
                          />
                        </div>
                        {fieldErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Preferred interest | Account type */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 md:items-start">
                      <div className="min-w-0">
                        <label htmlFor="preferredInterest" className="text-xs font-semibold text-[#64748B]">
                          Preferred interest
                        </label>
                        <div className={`${inputShell} mt-1.5`}>
                          <select
                            id="preferredInterest"
                            value={preferredInterest}
                            onChange={(ev) => setPreferredInterest(ev.target.value)}
                            className={selectInner}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            }}
                          >
                            {INTEREST_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#64748B]">Account type</span>
                        <div className="mt-1.5 flex flex-col gap-2">
                          <label
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-sm transition ${
                              accountType === "customer"
                                ? "border-[#7C3AED] bg-[#F5F3FF]"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="accountType"
                              className="accent-[#7C3AED]"
                              checked={accountType === "customer"}
                              onChange={() => setAccountType("customer")}
                            />
                            <span className="text-sm font-semibold text-[#374151]">Customer</span>
                          </label>
                          <label
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-sm transition ${
                              accountType === "admin"
                                ? "border-[#06B6D4] bg-[#ECFEFF]"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="accountType"
                              className="accent-[#06B6D4]"
                              checked={accountType === "admin"}
                              onChange={() => setAccountType("admin")}
                            />
                            <span className="text-sm font-semibold text-[#374151]">Admin</span>
                          </label>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[#94A3B8]">
                          Admin accounts are for marketplace managers only. Customers can browse, review, and track
                          visits.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#7C3AED]"
                          checked={termsAgreed}
                          onChange={(ev) => setTermsAgreed(ev.target.checked)}
                        />
                        <span className="text-sm leading-snug text-[#475569]">
                          I agree to the FusionHub Marketplace{" "}
                          <button type="button" className="font-semibold text-[#7C3AED] hover:underline">
                            terms
                          </button>
                          {" and "}
                          <button type="button" className="font-semibold text-[#7C3AED] hover:underline">
                            privacy policy
                          </button>
                          .
                        </span>
                      </label>
                      {fieldErrors.terms && (
                        <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.terms}</p>
                      )}
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
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
                      {busy ? "Creating account…" : "Create Marketplace Account"}
                      {!busy ? <FiArrowRight aria-hidden className="opacity-95" /> : null}
                    </motion.button>

                    <p className="mt-3 text-center text-xs text-[#64748B]">
                      Already have an account?{" "}
                      <Link to="/login" className="font-semibold text-[#7C3AED] hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </form>
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
                  Account created successfully!
                </p>
                <p className="mt-3 text-base font-semibold leading-snug text-[#374151]">
                  Welcome to FusionHub Marketplace.
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#64748B] md:text-base">
                  Your account can now access Bean & Brew Co., Krativerse, Seaside Travels, and Nexus
                  Academy.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="sm:flex-1">
                    <Link
                      to="/marketplace/explore"
                      className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-sm font-semibold text-white shadow-[0_12px_32px_-10px_rgba(124,58,237,0.45)]"
                    >
                      Explore Marketplace
                      <FiArrowRight className="ml-2" aria-hidden />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="sm:flex-1">
                    <Link
                      to="/dashboard/home"
                      className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-[#111827] shadow-md transition hover:bg-slate-50 hover:shadow-lg"
                    >
                      Go to Dashboard
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
