// src/routes/guards.tsx
import { ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type Role = "admin" | "employee";

// function getAuth() {
//   const token = localStorage.getItem("token");
//   const userStr = localStorage.getItem("user");
//   const user = userStr ? (JSON.parse(userStr) as { role?: Role }) : null;
//   return { token, user };
// }

// ログイン必須ガード
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return <Navigate to="/loginemployee" replace state={{ from: location }} />;
  return <Outlet />;
}

// 役割（権限）必須ガード（例：管理者専用）
export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return <Navigate to="/loginemployee" replace state={{ from: location }} />;
  // user.roleがroles配列に含まれているかチェック
  if (!roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
