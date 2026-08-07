import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

const STORAGE_KEY = "agentx.auth";

export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function setStoredAuth(data) {
  if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  else localStorage.removeItem(STORAGE_KEY);
}

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.error?.code;
    // Expired/invalid token: clear session and bounce to login.
    if (status === 401 && code !== "INVALID_CREDENTIALS") {
      setStoredAuth(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

/** Normalizes axios errors into { code, message } so pages never parse HTTP. */
export function normalizeError(err) {
  const data = err.response?.data?.error;
  if (data) return data;
  if (err.code === "ECONNABORTED") return { code: "TIMEOUT", message: "The request timed out. Please try again." };
  return { code: "NETWORK", message: "Cannot reach the server. Is it running?" };
}

export default api;
