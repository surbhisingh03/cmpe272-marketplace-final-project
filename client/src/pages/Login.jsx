import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import AuthSplitLayout from "../components/auth/AuthSplitLayout.jsx";
import PasswordField, { AUTH_TEXT_INPUT_CLASS } from "../components/auth/PasswordField.jsx";
import { apiFetch, facebookOAuthStartUrl, fetchFacebookLoginEnabled } from "../lib/api.js";
import { safeInternalPath } from "../lib/safeInternalPath.js";
import { useAuth } from "../context/AuthContext.jsx";

const REMEMBER_KEY = "fh_login_remember";
const SAVED_EMAIL_KEY = "fh_login_email";

const submitBtnClass =
  "flex h-[46px] w-full cursor-pointer items-center justify-center rounded-[10px] border-0 text-[15px] font-bold text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

const submitBtnStyle = {
  background: "var(--grad-cta, linear-gradient(135deg, #a78bfa, #60a5fa))",
};

export default function Login() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [facebookEnabled, setFacebookEnabled] = useState(null);

  const postLoginPath =
    typeof location.state?.from === "string" ? location.state.from : "/marketplace/explore";
  const facebookStartHref = facebookOAuthStartUrl(safeInternalPath(postLoginPath));

  useEffect(() => {
    let cancelled = false;
    fetchFacebookLoginEnabled().then((ok) => {
      if (!cancelled) setFacebookEnabled(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const nextPath = safeInternalPath(search.get("next") || "/marketplace/explore");
    const fbErr = search.get("facebook_error");
    if (fbErr) {
      setError(fbErr);
      window.history.replaceState(null, "", window.location.pathname);
    }

    const hash = window.location.hash?.replace(/^#/, "") || "";
    if (!hash) return;
    const hp = new URLSearchParams(hash);
    const token = hp.get("token");
    if (!token) return;

    /* Do not strip the hash until login succeeds. React StrictMode re-runs this effect;
       clearing the hash early makes the second pass a no-op and skips navigation. */
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        localStorage.setItem("fh_token", token);
        const me = await apiFetch("/api/auth/me");
        const role = me.role ?? (me.accountType === "admin" ? "admin" : "customer");
        loginWithToken(token, {
          id: me.id,
          email: me.email,
          name: me.name ?? me.displayName,
          displayName: me.displayName ?? me.name,
          avatarUrl: me.avatarUrl,
          preferredInterest: me.preferredInterest,
          accountType: me.accountType,
          role,
        });
        if (!cancelled) {
          const pathOnly = `${window.location.pathname}${window.location.search}`;
          window.history.replaceState(null, "", pathOnly);
          navigate(role === "admin" ? "/admin" : nextPath, { replace: true });
        }
      } catch (err) {
        localStorage.removeItem("fh_token");
        if (!cancelled) {
          setError(err.payload?.error || err.message || "Facebook sign-in failed");
        }
      } finally {
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loginWithToken, navigate]);

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
    const role = res.user.role ?? (res.user.accountType === "admin" ? "admin" : "customer");
    loginWithToken(res.token, {
      id: res.user.id,
      email: res.user.email,
      name: res.user.name ?? res.user.displayName,
      displayName: res.user.displayName ?? res.user.name,
      avatarUrl: res.user.avatarUrl,
      preferredInterest: res.user.preferredInterest,
      accountType: res.user.accountType,
      role,
      hasPassword: res.user.hasPassword !== false,
    });
    applyRememberPreference(emailUsed);
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/marketplace/explore", { replace: true });
    }
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
      setError(
        err.message ||
          [err.payload?.error, err.payload?.hint].filter(Boolean).join(" ") ||
          "Sign in failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] antialiased">
      <MarketingNav />

      <AuthSplitLayout activeTab="signin">
        <p className="text-sm leading-relaxed text-slate-600">
          Access your FusionHub Marketplace account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <div className="w-full">
            <label htmlFor="login-email" className="text-xs font-semibold text-slate-600">
              Email address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@organization.com"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`${AUTH_TEXT_INPUT_CLASS} mt-1.5`}
            />
            {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
          </div>

          <div className="w-full">
            <label htmlFor="login-password" className="text-xs font-semibold text-slate-600">
              Password
            </label>
            <div className="mt-1.5">
              <PasswordField
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(ev) => {
                  setPassword(ev.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={fieldErrors.password ? "true" : undefined}
              />
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#7c3aed]"
                checked={rememberMe}
                onChange={(ev) => setRememberMe(ev.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a
              href="#"
              className="text-right text-[13px] font-semibold text-[#7c3aed] transition hover:underline"
              title="Password reset isn’t configured in this demo build."
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          ) : null}

          <button disabled={busy} type="submit" className={submitBtnClass} style={submitBtnStyle}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {facebookEnabled === true ? (
          <>
            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e5e7eb]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-[#e5e7eb]" />
            </div>

            <a
              href={facebookStartHref}
              className="mt-6 flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#1877F2]/40 bg-white text-[14px] font-semibold text-[#1877F2] transition hover:bg-[#1877F2]/5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="shrink-0">
                <path
                  fill="currentColor"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              Continue with Facebook
            </a>
          </>
        ) : null}

        <p className="mt-8 text-center text-xs text-slate-500">
          Don’t have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#7c3aed] hover:underline">
            Create account
          </Link>
        </p>
      </AuthSplitLayout>

      <MarketingFooter />
    </div>
  );
}
