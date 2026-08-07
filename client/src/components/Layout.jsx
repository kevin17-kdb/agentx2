import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api, { normalizeError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/chat", label: "Chat", icon: "❖" },
  { to: "/student", label: "Student", icon: "◉" },
  { to: "/services", label: "Services", icon: "✦" },
  { to: "/knowledge", label: "Knowledge", icon: "▣" },
];

const TITLES = {
  "/": "Dashboard",
  "/chat": "Campus Chat",
  "/student": "Student Portal",
  "/services": "Campus Services",
  "/knowledge": "Policy Knowledge Base",
};

export default function Layout() {
  const { auth, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const { data } = await api.get("/health");
        if (alive) setHealth(data);
      } catch {
        if (alive) setHealth({ status: "down" });
      }
    };
    check();
    const t = setInterval(check, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const path = window.location.pathname;
  const title = TITLES[path] || "AgentX";
  const initial = (auth?.user?.name || auth?.user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">A</div>
          <div>
            <h1>AgentX</h1>
            <small>Campus OS · 2026</small>
          </div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="foot">10 agents · RAG · LangGraph</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <div className="small muted">
              {health?.agentService === "up" ? "Agents online" : "Agents offline"}
            </div>
          </div>
          <div className="grow" />
          <div style={{ display: "flex", gap: 6 }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="badge"
                style={theme === t.id ? { color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" } : {}}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="user-chip">
            <span className="avatar">{initial}</span>
            <span>{auth?.user?.name || auth?.user?.username}</span>
          </div>
          <button className="btn btn-ghost" onClick={() => logout().then(() => navigate("/login"))}>
            Sign out
          </button>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
