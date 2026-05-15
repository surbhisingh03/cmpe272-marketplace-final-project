import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import PasswordField, { AUTH_TEXT_INPUT_CLASS } from "../../components/auth/PasswordField.jsx";
import { apiFetch } from "../../lib/api.js";

export default function DashboardSettings() {
  const { toggle, mode } = useTheme();
  const { user, setUser } = useAuth();
  const hasPassword = Boolean(user?.hasPassword);
  const [newPw, setNewPw] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  async function onSavePassword(e) {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    if (newPw.length < 8) {
      setPwErr("Use at least 8 characters.");
      return;
    }
    setPwBusy(true);
    try {
      await apiFetch("/api/auth/password", {
        method: "POST",
        body: JSON.stringify(
          hasPassword ? { password: newPw, currentPassword: currentPw } : { password: newPw }
        ),
      });
      const me = await apiFetch("/api/auth/me");
      setUser(me);
      setNewPw("");
      setCurrentPw("");
      setPwMsg(hasPassword ? "Password updated." : "Password saved. You can now sign in with email and password.");
    } catch (err) {
      setPwErr(err.message || "Could not update password.");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Settings</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#111827]">
          Interface &amp; fidelity controls
        </h1>
      </div>

      <GlassCard className="space-y-4 p-6">
        <div className="text-sm font-semibold text-[#111827]">Sign-in password</div>
        <p className="text-xs text-[#6B7280]">
          {hasPassword
            ? "Change the password you use with your email on the login page."
            : "You signed up with Facebook. Add a password here so you can also sign in with your email."}
        </p>
        <form onSubmit={onSavePassword} className="mt-4 space-y-3">
          {hasPassword ? (
            <div>
              <label className="text-xs font-semibold text-slate-600" htmlFor="settings-current-pw">
                Current password
              </label>
              <div className="mt-1.5">
                <PasswordField
                  id="settings-current-pw"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={currentPw}
                  onChange={(ev) => setCurrentPw(ev.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div>
            <label className="text-xs font-semibold text-slate-600" htmlFor="settings-new-pw">
              {hasPassword ? "New password" : "Choose a password"}
            </label>
            <div className="mt-1.5">
              <PasswordField
                id="settings-new-pw"
                name="newPassword"
                autoComplete="new-password"
                value={newPw}
                onChange={(ev) => setNewPw(ev.target.value)}
              />
            </div>
          </div>
          {pwErr ? <p className="text-xs text-red-600">{pwErr}</p> : null}
          {pwMsg ? <p className="text-xs text-emerald-700">{pwMsg}</p> : null}
          <button
            type="submit"
            disabled={pwBusy}
            className="rounded-xl border border-slate-200 bg-[#111827] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pwBusy ? "Saving…" : hasPassword ? "Update password" : "Save password"}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#111827]">Appearance</div>
            <div className="mt-2 text-xs text-[#6B7280]">
              Toggle luminous dark surfaces or daylight glass aesthetics.
            </div>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-slate-100"
          >
            Mode · {mode}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="text-sm font-semibold text-[#111827]">Notification channels</div>
        <div className="mt-4 space-y-3 text-xs text-[#6B7280]">
          {["Recommendation pulses", "Review reactions", "Admin escalations"].map((t) => (
            <label
              key={t}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3"
            >
              <input defaultChecked type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              {t}
            </label>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
