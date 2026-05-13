import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminLogin() {
  const nav = useNavigate();
  const { user, loading, loginWithToken } = useAuth();
  const [email, setEmail] = useState("admin@fusionhub.demo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    const role = user?.role ?? (user?.accountType === "admin" ? "admin" : undefined);
    if (role === "admin") {
      nav("/admin", { replace: true });
    }
  }, [loading, user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const role = res.user.role ?? (res.user.accountType === "admin" ? "admin" : "customer");
      if (role !== "admin") {
        setError("This account is not an administrator. Sign in at the main marketplace login.");
        return;
      }
      loginWithToken(res.token, {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name ?? res.user.displayName,
        displayName: res.user.displayName ?? res.user.name,
        avatarUrl: res.user.avatarUrl,
        preferredInterest: res.user.preferredInterest,
        accountType: res.user.accountType,
        role,
      });
      nav("/admin", { replace: true });
    } catch (err) {
      setError(
        err.message ||
          [err.payload?.error, err.payload?.hint].filter(Boolean).join(" ") ||
          "Admin login failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <GlassCard className="p-8" glow surface="glass">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Observatory</div>
            <h1 className="mt-2 font-display text-2xl font-bold text-white">Admin authentication</h1>
            <p className="mt-2 text-sm text-slate-400">
              Admin accounts use the same FusionHub credentials as{" "}
              <Link to="/login" className="text-hub-cyan underline">
                marketplace Sign in
              </Link>
              . After <code className="text-hub-cyan">npm run seed</code>, the demo admin is{" "}
              <span className="text-white">admin@fusionhub.demo</span> /{" "}
              <span className="text-white">fusionhub123</span>.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400">Admin email</label>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
                />
              </div>
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                  {error}
                </div>
              )}
              <button
                disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-hub-violet to-hub-cyan py-3 text-sm font-semibold text-white shadow-glowSm disabled:opacity-50"
              >
                {busy ? "Authorizing…" : "Enter command deck"}
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-slate-500">
              <Link to="/" className="text-hub-cyan hover:underline">
                ← Back to marketplace
              </Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
