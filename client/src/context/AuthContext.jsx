import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { getStoredAuth, setStoredAuth } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      const stored = getStoredAuth();
      if (stored?.token) {
        try {
          const { data } = await api.get("/auth/me");
          if (alive) setAuth({ ...stored, user: data.user });
        } catch {
          if (alive) setAuth(null);
        }
      }
      if (alive) setReady(true);
    }
    bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    const next = { token: data.token, user: data.user };
    setStoredAuth(next);
    setAuth(next);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    const next = { token: data.token, user: data.user };
    setStoredAuth(next);
    setAuth(next);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore — stateless JWT */
    }
    setStoredAuth(null);
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
