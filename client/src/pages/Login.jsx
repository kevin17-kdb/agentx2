import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CampusScene from "../components/CampusScene";
import TiltCard from "../components/TiltCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { normalizeError } from "../api/client";

function AgentXLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx="16" cy="16" r="5" fill="var(--accent)"/>
    </svg>
  );
}

export default function Login() {
  const { login, register } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register({ username, password, name: name || username });
      }
      navigate("/");
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setError("");
  }, [mode]);

  return (
    <div className="login-wrap">
      {/* Top Header Theme Selector for Login (matches app top-navbar styling) */}
      <div className="login-theme-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AgentXLogo />
          <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text-1)" }}>AgentX</span>
        </div>
        <div className="theme-selector-pills">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`theme-badge${theme === t.id ? " active" : ""}`}
            >
              {t.badge}
            </button>
          ))}
        </div>
      </div>

      <div className="login-body">
        {/* Left: Interactive 3D AI Neural Matrix scene */}
        <CampusScene />

        {/* Right: Theme-synchronized login panel */}
        <div className="login-panel">
          <TiltCard className="login-card">
            <div className="login-inner">
              <h1 className="wordmark" style={{ textAlign: "left" }}>
                AgentX
              </h1>
              <p className="sub" style={{ textAlign: "left" }}>
                Smart Campus AI System · Fall 2026 · <span className="font-mono">v2.0</span>
              </p>

              <div className="tab-row">
                <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
                  Sign in
                </button>
                <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
                  Create account
                </button>
              </div>

              <form className="login-form" onSubmit={submit}>
                <div>
                  <label className="field">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    placeholder="Enter your username (e.g. kevin)"
                    autoComplete="username"
                  />
                </div>
                {mode === "register" && (
                  <div>
                    <label className="field">Display name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                )}
                <div>
                  <label className="field">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button className="btn btn-primary btn-animated" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
                  {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
