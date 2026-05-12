import GlassCard from "../../components/ui/GlassCard.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function DashboardSettings() {
  const { toggle, mode } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Settings</div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#111827]">
          Interface &amp; fidelity controls
        </h1>
      </div>

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
