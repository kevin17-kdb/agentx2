import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const SCENARIOS = [
  {
    title: "Placement + calendar + reminder",
    icon: "🎯",
    desc: "Eligibility check, workshop registration, calendar entry, and a reminder — one command.",
    query: "Am I eligible for the Google internship? If yes, register me for the placement workshop, add it to my calendar, and remind me before it.",
  },
  {
    title: "Exam readiness",
    icon: "📚",
    desc: "Summarize exam regulations, check attendance eligibility, and draft a makeup-exam email.",
    query: "Summarize the examination regulations, calculate my attendance eligibility, and draft a makeup exam email.",
  },
  {
    title: "This week on campus",
    icon: "🗓",
    desc: "Today's classes, upcoming AI workshops, and clubs matching your interests.",
    query: "Show today's classes, upcoming AI workshops, and suggest clubs related to Machine Learning.",
  },
  {
    title: "Wellness check-in",
    icon: "🌿",
    desc: "Stressed with exams? Find wellness resources and a plan.",
    query: "I'm so overwhelmed, I have 2 exams and a hackathon deadline this week. Can you help? What wellness resources are available?",
  },
  {
    title: "Campus navigation",
    icon: "📍",
    desc: "Find the nearest ATM or a printer from wherever you are.",
    query: "Where's the nearest ATM? Also where can I print a document?",
  },
  {
    title: "Budget planner",
    icon: "💰",
    desc: "Can you afford that hackathon trip? Let Finance work it out.",
    query: "Can I afford a 5000 rupee hackathon trip?",
  },
];

export default function Dashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get("/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: "down" }));
  }, []);

  const firstName = (auth?.user?.name || auth?.user?.username || "there").split(" ")[0];

  return (
    <div
      className="dashboard-wrap fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 22,
        backgroundImage: `linear-gradient(to bottom, rgba(2, 11, 20, 0.75), rgba(2, 11, 20, 0.92)), url('/assets/wave_background.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 20,
        padding: 24,
        boxShadow: "var(--shadow-pop)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Hero Banner (inspired by Picture 3) */}
      <section className="slide-up">
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 32,
            fontWeight: 900,
            background: "linear-gradient(135deg, var(--text-1), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Real-time AI infrastructure that scales with you
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 15, maxWidth: 650 }}>
          Welcome back, <strong>{firstName}</strong>. Ten specialized campus agents are standing by to coordinate academics, placements, RAG policies, and wellness.
        </p>
      </section>

      {/* Scenario Cards with 3D Flip/Scale Animations */}
      <section>
        <div className="grid grid-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.title}
              className="scenario-card btn-animated flip-card-3d"
              onClick={() => navigate(`/chat?q=${encodeURIComponent(s.query)}`)}
            >
              <div className="icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="grid grid-2">
          <div className="card fade-in" style={{ backdropFilter: "blur(12px)", background: "color-mix(in srgb, var(--surface) 80%, transparent)" }}>
            <h3>System Status</h3>
            {health ? (
              <>
                <p>
                  <span className="badge ok">
                    <span className="status-dot ok" /> Express API
                  </span>{" "}
                  <span className="badge ok">
                    <span className="status-dot ok" /> MongoDB
                  </span>{" "}
                  <span className={`badge${health.agentService === "up" ? " ok" : ""}`}>
                    <span className={`status-dot ${health.agentService === "up" ? "ok" : "bad"}`} />
                    Agent Service
                  </span>
                </p>
                <p className="small muted">
                  llm_mode: <span className="font-mono">{health.agent?.llm_mode || "—"}</span> ·{" "}
                  agents: {health.agent?.agents_loaded ?? "—"} · rag_docs: {health.agent?.rag_documents ?? "—"}
                </p>
              </>
            ) : (
              <p className="skeleton" style={{ height: 40 }} />
            )}
          </div>

          <div className="card fade-in" style={{ backdropFilter: "blur(12px)", background: "color-mix(in srgb, var(--surface) 80%, transparent)" }}>
            <h3>Your Profile</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="avatar-lg">{firstName[0]}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{auth?.user?.name || auth?.user?.username}</div>
                <div className="font-mono small muted">{auth?.user?.studentId} · {auth?.user?.role}</div>
              </div>
            </div>
            <button className="btn btn-animated" style={{ marginTop: 14 }} onClick={() => navigate("/student")}>
              Open Student Portal →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
