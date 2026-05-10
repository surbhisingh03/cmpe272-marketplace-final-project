import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminGuard({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  const role = user?.role ?? (user?.accountType === "admin" ? "admin" : undefined);
  if (role !== "admin") {
    return <Navigate to="/dashboard/home" replace />;
  }

  return children;
}
