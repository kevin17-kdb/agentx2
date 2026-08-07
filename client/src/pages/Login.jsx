import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CampusScene from "../components/CampusScene";
import TiltCard from "../components/TiltCard";
import { useAuth } from "../context/AuthContext";
import { normalizeError } from "../api/client";

const DEMO_ACCOUNTS = [
  { user: "kevin", pass: "kevin123", role: "Student" },
  { user: "emily", pass: "emily123", role: "Student" },
  { user: "messi", pass: "messi123", role: "Student" },
  { user: "admin", pass: "admin123", role: "Admin" },
];

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fill = (acc) => {
    setUsername(acc.user);
    setPassword(acc.pass);
    setError("");
  };

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
      {/* Left: duotone campus scene */}
      <div className="login-photo">
        <CampusScene />
        <div className="credits">Vasavi College of Engineering — Quad, 6:20 PM</div>
      </div>

      {/* Right: solid form panel */}
      <div className="login-panel">
        <TiltCard className="login-card">
          <div className="login-inner">
            <h1 className="wordmark" style={{ textAlign: "left" }}>
              AgentX
            </h1>
            <p className="sub" style={{ textAlign: "left" }}>
              <strong>Vasavi College of Engineering</strong> · Fall 2026 ·{" "}
              <span className="font-mono">v2.0</span>
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
                  placeholder="kevin"
                  autoComplete="username"
                />
              </div>
              {mode === "register" && (
                <div>
                  <label className="field">Display name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kevin" />
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

              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="demo-pills">
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.user} type="button" className="pill" onClick={() => fill(acc)}>
                  {acc.user} · {acc.role}
                </button>
              ))}
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
