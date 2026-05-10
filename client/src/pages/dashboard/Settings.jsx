import GlassCard from "../../components/ui/GlassCard.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function DashboardSettings() {
  const { toggle, mode } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Settings</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Interface &amp; fidelity controls
        </h1>
      </div>

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Appearance</div>
            <div className="mt-2 text-xs text-slate-400">
              Toggle luminous dark surfaces or daylight glass aesthetics.
            </div>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Mode · {mode}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="text-sm font-semibold text-white">Notification channels</div>
        <div className="mt-4 space-y-3 text-xs text-slate-300">
          {["Recommendation pulses", "Review reactions", "Admin escalations"].map((t) => (
            <label
              key={t}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <input defaultChecked type="checkbox" className="h-4 w-4 rounded border-white/20" />
              {t}
            </label>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
