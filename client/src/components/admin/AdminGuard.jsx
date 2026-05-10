import { Navigate } from "react-router-dom";

export default function AdminGuard({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("fh_admin_token") : null;
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}
