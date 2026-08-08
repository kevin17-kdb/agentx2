import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/chat", label: "Chat" },
  { to: "/student", label: "Student" },
  { to: "/services", label: "Services" },
  { to: "/knowledge", label: "Knowledge" },
];

function AgentXLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M16 6L24 10.5V21.5L16 26V6Z" fill="var(--lime)" opacity="0.28"/>
      <circle cx="16" cy="16" r="5" fill="var(--lime)"/>
      <circle cx="16" cy="16" r="1.6" fill="var(--forest)"/>
    </svg>
  );
}

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

  const initial = (auth?.user?.name || auth?.user?.username || "U").slice(0, 1).toUpperCase();
  const agentUp = health?.agentService === "up";

  return (
    <div className="app-horizontal">
      {/* Top Main Navigation Bar (inspired by user screenshot) */}
      <header className="top-navbar">
        {/* Brand & Emblem Logo */}
        <div className="brand-logo" onClick={() => navigate("/")}>
          <AgentXLogo />
          <span className="brand-title">AgentX</span>
          <span className="mf-pill"><span className="mf-dot" /> System · V1</span>
        </div>

        {/* Center Pill Navigation */}
        <nav className="center-nav-pills">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-pill-item${isActive ? " active" : ""}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Controls & User Info */}
        <div className="right-controls">
          {/* Live Agent Status Badge */}
          <div className="agent-live-badge">
            <span className={`status-dot ${agentUp ? "ok" : "bad"}`} />
            <span className="font-mono">{health?.agent?.agents_loaded ?? 10} AGENTS LIVE</span>
          </div>

          {/* Theme Selector Badges */}
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

          {/* User Chip */}
          <div className="user-avatar-chip" title={auth?.user?.name || auth?.user?.username}>
            {initial}
          </div>

          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => logout().then(() => navigate("/login"))}>
            Sign out
          </button>
        </div>
      </header>

      {/* Page Content View */}
      <main className="main-content-view">
        <Outlet />
      </main>
    </div>
  );
}
