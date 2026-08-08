import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const WORKSPACE_CARDS = [
  {
    code: "01 · CHAT",
    title: "AI Assistant",
    desc: "Multi-agent chat with live execution graph & human review.",
    badge: "10 agents",
    to: "/chat",
    icon: "❖",
  },
  {
    code: "02 · CAMPUS",
    title: "My Campus",
    desc: "Profile, timetable, attendance, and academic grade sheets.",
    badge: "Synced",
    to: "/student",
    icon: "◉",
  },
  {
    code: "03 · SERVICES",
    title: "Services & Grievance",
    desc: "Hostel, mess timings, transport passes, and helpdesk SLA.",
    badge: "6 services",
    to: "/services",
    icon: "✦",
  },
  {
    code: "04 · KNOWLEDGE",
    title: "Knowledge Base",
    desc: "RAG-powered search across institutional handbooks & rules.",
    badge: "Indexed",
    to: "/knowledge",
    icon: "▣",
  },
];

const QUICK_SCENARIOS = [
  { title: "Placement & Reminder", query: "Am I eligible for the Google internship? Register me and set a reminder.", icon: "🎯" },
  { title: "Exam Readiness", query: "Summarize exam regulations and calculate my attendance eligibility.", icon: "📚" },
  { title: "Campus Navigation", query: "Where's the nearest ATM and printer?", icon: "📍" },
  { title: "Budget Check", query: "Can I afford a 5000 rupee hackathon trip?", icon: "💰" },
];

/* Animated floating orb */
function FloatingOrbs() {
  return (
    <div className="orbs-container">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  );
}

export default function Dashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get("/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: "down" }));
  }, []);

  const name = auth?.user?.name || auth?.user?.username || "there";
  const studentId = auth?.user?.studentId || "S101";

  return (
    <div className="dashboard-container fade-in" style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      {/* Animated Background Orbs */}
      <FloatingOrbs />

      {/* Greeting Bar */}
      <section className="greeting-bar-card slide-up" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="status-dot ok" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Welcome back, <strong>{name}</strong> <span className="font-mono muted">({studentId})</span> · what would you like to get done today?
            </span>
          </div>
          <span className="badge ok" style={{ fontWeight: 700 }}>
            {health?.agent?.agents_loaded ?? 10} / 10 ACTIVE
          </span>
        </div>
      </section>

      {/* Main Workspace Grid */}
      <section style={{ position: "relative", zIndex: 2 }}>
        <div className="section-label-header">WORKSPACE</div>
        <div className="grid grid-2" style={{ gap: 16 }}>
          {WORKSPACE_CARDS.map((card, i) => (
            <div
              key={card.title}
              className="card btn-animated workspace-card-item"
              onClick={() => navigate(card.to)}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="font-mono small muted">{card.code}</span>
                <span className="badge accent" style={{ fontSize: 11 }}>{card.badge}</span>
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{card.icon}</span> {card.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ position: "relative", zIndex: 2 }}>
        <div className="section-label-header">QUICK ACTIONS</div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          {QUICK_SCENARIOS.map((s) => (
            <button
              key={s.title}
              className="scenario-card btn-animated"
              onClick={() => navigate(`/chat?q=${encodeURIComponent(s.query)}`)}
            >
              <div className="icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.query}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
