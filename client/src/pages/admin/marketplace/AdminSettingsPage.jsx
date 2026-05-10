import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function AdminSettingsPage() {
  const { logout } = useAuth();
  function onLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Settings</h1>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Visit and review analytics are stored in this browser for the admin tools. Clearing site data for this origin
          will reset that history. The catalog always comes from the live FusionHub server.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
          >
            Sign out admin
          </button>
          <Link
            to="/admin/login"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-violet-200"
          >
            Admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
