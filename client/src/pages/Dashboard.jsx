import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { MetricForgeCard, Sparkline } from "../components/Mforge";

const WORKSPACE_CARDS = [
  {
    code: "01 · CHAT",
    title: "AI Assistant",
    desc: "Multi-agent chat with live execution graph & human review.",
    badge: "10 agents",
    to: "/chat",
    icon: "❖",
    metric: "Queries served · today",
    value: "1,408",
    bars: [30, 42, 38, 55, 48, 62, 58, 44],
    peaks: [5],
  },
  {
    code: "02 · CAMPUS",
    title: "My Campus",
    desc: "Profile, timetable, attendance, and academic grade sheets.",
    badge: "Synced",
    to: "/student",
    icon: "◉",
    metric: "Attendance · last cycle",
    value: "87%",
    bars: [72, 78, 74, 82, 86, 84, 87, 90],
    peaks: [7],
  },
  {
    code: "03 · SERVICES",
    title: "Services & Grievance",
    desc: "Hostel, mess timings, transport passes, and helpdesk SLA.",
    badge: "6 services",
    to: "/services",
    icon: "✦",
    metric: "Tickets resolved",
    value: "186",
    bars: [40, 55, 48, 60, 52, 70, 64, 58, 66],
    peaks: [5],
  },
  {
    code: "04 · KNOWLEDGE",
    title: "Knowledge Base",
    desc: "RAG-powered search across institutional handbooks & rules.",
    badge: "Indexed",
    to: "/knowledge",
    icon: "▣",
    metric: "Policy searches",
    value: "642",
    bars: [22, 31, 40, 36, 45, 52, 48, 57, 62, 44],
    peaks: [8],
  },
];

const QUICK_SCENARIOS = [
  { title: "Placement & Reminder", query: "Am I eligible for the Google internship? Register me and set a reminder.", icon: "🎯" },
  { title: "Exam Readiness", query: "Summarize exam regulations and calculate my attendance eligibility.", icon: "📚" },
  { title: "Campus Navigation", query: "Where's the nearest ATM and printer?", icon: "📍" },
  { title: "Budget Check", query: "Can I afford a 5000 rupee hackathon trip?", icon: "💰" },
];

const FORGE_QUERIES = {
  "7D": {
    value: 962, delta: "+6.1%",
    bars: [30, 42, 38, 55, 48, 62, 58, 44],
    peaks: [5, 7],
    foot: ["Q&A · Scheduling · Services", "Δ 7D · live"],
  },
  "30D": {
    value: 1408, delta: "+18.4%",
    bars: [22, 28, 26, 32, 30, 86, 34, 88, 92, 36, 64, 78],
    peaks: [5, 7, 8, 9, 11],
    foot: ["Q&A · Scheduling · Services", "Δ 30D · live"],
  },
  QTR: {
    value: 3860, delta: "+9.7%",
    bars: [40, 55, 48, 60, 52, 70, 64, 58, 66, 72, 60, 68],
    peaks: [5, 9],
    foot: ["Q&A · Scheduling · Services", "Δ QTR · live"],
  },
};

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
  const [range, setRange] = useState("30D");

  useEffect(() => {
    api.get("/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: "down" }));
  }, []);

  const name = auth?.user?.name || auth?.user?.username || "there";
  const studentId = auth?.user?.studentId || "S101";
  const agentPct = Math.round(((health?.agent?.agents_loaded ?? 10) / 10) * 100);

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
              The forge is hot, <strong>{name}</strong> <span className="font-mono muted">({studentId})</span> · what shall we run today?
            </span>
          </div>
          <span className="mf-pill on">
            <span className="mf-dot" /> {health?.agent?.agents_loaded ?? 10} / 10 AGENTS
          </span>
        </div>
      </section>

      {/* Live Metric Forge — interactive bars + range switch */}
      <section style={{ position: "relative", zIndex: 2 }}>
        <div className="section-label-header">SYSTEM ACTIVITY · LIVE</div>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          <MetricForgeCard
            title="Assistant Queries · served / day"
            value={FORGE_QUERIES[range].value}
            delta={FORGE_QUERIES[range].delta}
            bars={FORGE_QUERIES[range].bars}
            peaks={FORGE_QUERIES[range].peaks}
            foot={FORGE_QUERIES[range].foot}
            colors={["rgba(196,242,110,0.85)", "rgba(169,217,92,0.9)", "rgba(44,74,62,0.55)"]}
            ranges={["7D", "30D", "QTR"]}
            range={range}
            onRange={(r) => setRange(r)}
          />
          <div className="card">
            <span className="eyebrow-label">AGENT SUITE</span>
            <div style={{ margin: "10px 0 4px", display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="mf-metric-value">{health?.agent?.agents_loaded ?? 10}</span>
              <span className="small muted">/ 10 agents online</span>
            </div>
            <Sparkline bars={[30, 42, 55, 48, 62, 58, 74, 82, 70, 90, 100]} peaks={[7, 10]} />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span className="muted">Agent service</span>
                <span className="font-mono" style={{ color: health?.agentService === "up" ? "var(--ok)" : "var(--bad)" }}>
                  {health?.agentService === "up" ? "UP" : health?.agentService === "down" ? "DOWN" : "IDLE"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span className="muted">Health</span>
                <span className="font-mono" style={{ color: "var(--accent)" }}>{health?.status ?? "…"}</span>
              </div>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div className="progress-fill" style={{ width: `${agentPct}%` }} />
              </div>
            </div>
          </div>
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
                <span className="mf-pill on"><span className="mf-dot" /> {card.badge}</span>
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{card.icon}</span> {card.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                {card.desc}
              </p>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="eyebrow-label" style={{ marginBottom: 6 }}>{card.metric}</div>
                  <Sparkline bars={card.bars} peaks={card.peaks} />
                </div>
                <span className="mf-metric-value" style={{ fontSize: 22 }}>{card.value}</span>
              </div>
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
