import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import AuthSplitLayout from "../components/auth/AuthSplitLayout.jsx";
import PasswordField, { AUTH_TEXT_INPUT_CLASS } from "../components/auth/PasswordField.jsx";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const INTEREST_OPTIONS = [
  { value: "coffee", label: "Coffee Products" },
  { value: "creative", label: "Creative Services" },
  { value: "travel", label: "Travel Experiences" },
  { value: "academy", label: "Academy Courses" },
  { value: "all", label: "All Categories" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const submitBtnClass =
  "flex h-[46px] w-full cursor-pointer items-center justify-center rounded-[10px] border-0 text-[15px] font-bold text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

const submitBtnStyle = {
  background: "var(--grad-cta, linear-gradient(135deg, #a78bfa, #60a5fa))",
};

const selectChevron =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")";

export default function Signup() {
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState("form");

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

      const role = res.user.role ?? (res.user.accountType === "admin" ? "admin" : "customer");
      loginWithToken(res.token, {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name ?? res.user.displayName,
        displayName: res.user.displayName ?? res.user.name,
        preferredInterest: res.user.preferredInterest,
        accountType: res.user.accountType,
        role,
      });
      setStep("success");
    } catch (err) {
      setError(err.payload?.error || err.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] antialiased">
      <MarketingNav />

      {step === "form" ? (
        <AuthSplitLayout activeTab="signup">
          <p className="text-sm leading-relaxed text-slate-600">
            Create one account to visit companies, track activity, add reviews, and view marketplace rankings.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="fullName" className="text-xs font-semibold text-slate-600">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={fullName}
                  onChange={(ev) => setFullName(ev.target.value)}
                  className={`${AUTH_TEXT_INPUT_CLASS} mt-1.5`}
                />
                {fieldErrors.fullName ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
                ) : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="phone" className="text-xs font-semibold text-slate-600">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  className={`${AUTH_TEXT_INPUT_CLASS} mt-1.5`}
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p> : null}
              </div>
            </div>

            <div className="w-full">
              <label htmlFor="email" className="text-xs font-semibold text-slate-600">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className={`${AUTH_TEXT_INPUT_CLASS} mt-1.5`}
              />
              {fieldErrors.email ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="password" className="text-xs font-semibold text-slate-600">
                  Password
                </label>
                <div className="mt-1.5">
                  <PasswordField
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    aria-invalid={fieldErrors.password ? "true" : undefined}
                  />
                </div>
                {fieldErrors.password ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
                ) : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600">
                  Confirm password
                </label>
                <div className="mt-1.5">
                  <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(ev) => setConfirmPassword(ev.target.value)}
                    aria-invalid={fieldErrors.confirmPassword ? "true" : undefined}
                  />
                </div>
                {fieldErrors.confirmPassword ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
              <div className="min-w-0">
                <label htmlFor="preferredInterest" className="text-xs font-semibold text-slate-600">
                  Preferred interest
                </label>
                <select
                  id="preferredInterest"
                  name="preferredInterest"
                  value={preferredInterest}
                  onChange={(ev) => setPreferredInterest(ev.target.value)}
                  className={`${AUTH_TEXT_INPUT_CLASS} mt-1.5 cursor-pointer appearance-none bg-white pr-10`}
                  style={{
                    backgroundImage: selectChevron,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "14px 10px",
                  }}
                >
                  {INTEREST_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-600">Account type</span>
                <div className="mt-1.5 flex flex-col gap-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-3 py-2.5 transition ${
                      accountType === "customer"
                        ? "border-[#7c3aed] bg-violet-50/80"
                        : "border-[#e5e7eb] bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value="customer"
                      className="accent-[#7c3aed]"
                      checked={accountType === "customer"}
                      onChange={() => setAccountType("customer")}
                    />
                    <span className="text-sm font-semibold text-slate-800">Customer</span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-3 py-2.5 transition ${
                      accountType === "admin"
                        ? "border-[#7c3aed] bg-violet-50/80"
                        : "border-[#e5e7eb] bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value="admin"
                      className="accent-[#7c3aed]"
                      checked={accountType === "admin"}
                      onChange={() => setAccountType("admin")}
                    />
                    <span className="text-sm font-semibold text-slate-800">Admin</span>
                  </label>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Admin accounts are for marketplace managers only. Customers can browse, review, and track visits.
                </p>
              </div>
            </div>

            <div>
              <label className="flex cursor-pointer gap-3 rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-slate-50/80 px-4 py-3 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="terms"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#7c3aed]"
                  checked={termsAgreed}
                  onChange={(ev) => setTermsAgreed(ev.target.checked)}
                />
                <span className="text-sm leading-snug text-slate-600">
                  I agree to the FusionHub Marketplace{" "}
                  <button type="button" className="font-semibold text-[#7c3aed] hover:underline">
                    terms
                  </button>
                  {" and "}
                  <button type="button" className="font-semibold text-[#7c3aed] hover:underline">
                    privacy policy
                  </button>
                  .
                </span>
              </label>
              {fieldErrors.terms ? <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.terms}</p> : null}
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {error}
              </div>
            ) : null}

            <button disabled={busy} type="submit" className={submitBtnClass} style={submitBtnStyle}>
              {busy ? "Creating account…" : "Create Marketplace Account"}
            </button>

            <p className="mt-2 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#7c3aed] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </AuthSplitLayout>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-1 flex-col items-center justify-center bg-[#f8fafc] px-4 py-12 lg:py-16"
        >
          <div className="w-full max-w-[480px] rounded-[14px] border border-[#e5e7eb] bg-white p-9 text-center shadow-sm md:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#60a5fa] shadow-md">
              <FiCheckCircle className="h-8 w-8 text-white md:h-9 md:w-9" aria-hidden />
            </div>
            <p className="font-display text-lg font-bold leading-snug text-slate-900">Account created successfully!</p>
            <p className="mt-3 text-base font-semibold leading-snug text-slate-800">Welcome to FusionHub Marketplace.</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600 md:text-base">
              Your account can now access Bean & Brew Co., Krativerse, Seaside Travels, and Nexus Academy.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/marketplace/explore"
                className="flex min-h-[46px] flex-1 items-center justify-center rounded-[10px] text-[15px] font-bold text-white transition hover:opacity-90"
                style={submitBtnStyle}
              >
                Explore Marketplace
                <FiArrowRight className="ml-2" aria-hidden />
              </Link>
              <Link
                to="/dashboard/home"
                className="flex min-h-[46px] flex-1 items-center justify-center rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[15px] font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
