import { useCallback, useState } from "react";

const STORAGE_KEY = "agentx.auth";

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [auth, setAuth] = useState(loadStored);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const persist = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setAuth(data);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const request = useCallback(async (path, body) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Something went wrong.");
    return data;
  }, []);

  const login = useCallback(
    async (username, password) => {
      setBusy(true);
      setError("");
      try {
        const data = await request("/api/auth/login", { username, password });
        persist({ token: data.token, username: data.username, studentId: data.student_id });
        return "";
      } catch (e) {
        setError(e.message);
        return e.message;
      } finally {
        setBusy(false);
      }
    },
    [request, persist]
  );

  const register = useCallback(
    async (username, password, studentId) => {
      setBusy(true);
      setError("");
      try {
        const data = await request("/api/auth/register", {
          username,
          password,
          student_id: studentId || undefined,
        });
        persist({ token: data.token, username: data.username, studentId: data.student_id });
        return "";
      } catch (e) {
        setError(e.message);
        return e.message;
      } finally {
        setBusy(false);
      }
    },
    [request, persist]
  );

  const logout = useCallback(() => {
    const token = auth?.token;
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clear();
  }, [auth, clear]);

  return { auth, busy, error, login, register, logout };
}
