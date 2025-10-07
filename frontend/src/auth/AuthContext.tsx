import React, { createContext, useState, useContext, useMemo } from "react";
import { api } from "../lib/api";

type User = { employee_id: number; name: string; role: "employee" | "admin" };

type Ctx = {
  token: string | null;
  user: User | null;
  login: (employee_code: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  async function login(employee_code: string, password: string) {
    const res = await api.post("/auth/login", { employee_code, password });
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user as User;
  }
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    location.assign("/loginemployee");
  }

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("AuthProviderが必要です");
  return v;
}
