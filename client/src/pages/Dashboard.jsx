import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { normalizeError } from "../api/client";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <section>
        <h2 style={{ margin: "0 0 4px" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName}.
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Ten campus agents are standing by. Pick a scenario or head to the chat.
        </p>
      </section>

      <section>
        <div className="grid grid-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.title}
              className="scenario-card"
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
          <div className="card">
            <h3>System status</h3>
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
                    Agent service
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

          <div className="card">
            <h3>Your profile</h3>
            <p>
              <span className="avatar-lg">{firstName[0]}</span>
            </p>
            <p style={{ margin: "12px 0 0" }}>
              <span className="font-mono">{auth?.user?.studentId}</span> · {auth?.user?.role}
            </p>
            <button className="btn" style={{ marginTop: 10 }} onClick={() => navigate("/student")}>
              Open student portal →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
