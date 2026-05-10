import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GradientMesh from "../../components/layout/GradientMesh.jsx";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { apiFetch } from "../../lib/api.js";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@fusionhub.demo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("fh_admin_token", res.token);
      nav("/admin", { replace: true });
    } catch (err) {
      setError(err.payload?.error || err.message || "Admin login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-hub-bg">
      <GradientMesh />
      <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <GlassCard className="p-8" glow>
            <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Observatory</div>
            <h1 className="mt-2 font-display text-2xl font-bold text-white">Admin authentication</h1>
            <p className="mt-2 text-sm text-slate-400">
              This is <span className="font-semibold text-slate-200">not</span> the same as{" "}
              <Link to="/login" className="text-hub-cyan underline">
                regular Sign in
              </Link>
              . Signing up or logging in on the marketplace only opens <code className="text-hub-cyan">/dashboard</code> (dark
              theme). The light admin console at <code className="text-hub-cyan">/admin</code> uses this page only, with the
              exact <span className="text-slate-200">ADMIN_EMAIL</span> and <span className="text-slate-200">ADMIN_PASSWORD</span>{" "}
              from <code className="text-hub-cyan">server/.env</code> (your signup password is ignored here unless you set{" "}
              <code className="text-hub-cyan">ADMIN_PASSWORD</code> to match it).
            </p>
            <p className="mt-2 text-sm text-slate-400">
              After <code className="text-hub-cyan">npm run seed</code>, defaults from <code className="text-hub-cyan">.env.example</code>{" "}
              are often <span className="text-white">admin@fusionhub.demo</span> / <span className="text-white">fusionhub123</span>.
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
