import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function PublicLayout() {
  const { user } = useAuth();
  const loc = useLocation();

  if (user) {
    // ログイン済みなら /home に自動リダイレクト
    return <Navigate to="/home" replace state={{ from: loc }} />;
  }

  return (
    <main>
      <Outlet />
    </main>
  );
}

export default PublicLayout;
