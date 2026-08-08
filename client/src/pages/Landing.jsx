import { useState } from "react";
import Login from "./Login";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <button
          className="btn btn-animated"
          onClick={() => setShowLogin(false)}
          style={{
            position: "absolute",
            top: 18,
            left: 24,
            zIndex: 100,
            background: "color-mix(in srgb, var(--surface) 80%, transparent)",
            backdropFilter: "blur(10px)",
          }}
        >
          ← Back to Presentation
        </button>
        <Login />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 20, 0.75), rgba(5, 10, 20, 0.92)), url('/assets/presentation_venue.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, #22d3ee, #8b5cf6)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 20,
              color: "#000",
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>AgentX 2026</div>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1, textTransform: "uppercase" }}>
              Sarvepalli Radhakrishna Engineering College
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            className="btn btn-primary btn-animated"
            onClick={() => setShowLogin(true)}
            style={{
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 12,
              background: "linear-gradient(135deg, #22d3ee, #10b981)",
              color: "#020b14",
              border: "none",
              boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)",
            }}
          >
            Login →
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: "80px 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="slide-up" style={{ textAlign: "center", maxWidth: 900, margin: "0 auto 60px" }}>
          <span
            className="badge"
            style={{
              fontSize: 13,
              padding: "6px 16px",
              background: "rgba(34, 211, 238, 0.15)",
              borderColor: "rgba(34, 211, 238, 0.4)",
              color: "#22d3ee",
              marginBottom: 20,
            }}
          >
            ✦ Multi-Agent AI Campus OS
          </span>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              margin: "20px 0 24px",
              background: "linear-gradient(135deg, #ffffff 30%, #22d3ee 70%, #10b981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            A UNIQUE VENUE IN THE HEART OF CAMPUS, WHERE YOUR EVENT & ACADEMIC JOURNEY COMES TO LIFE
          </h1>
          <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 700, margin: "0 auto 36px", lineHeight: 1.6 }}>
            Experience 10 autonomous AI agents coordinating timetables, placement eligibility, RAG policy retrieval, wellness support, and instant grievance resolution in real time.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              className="btn btn-primary btn-animated"
              onClick={() => setShowLogin(true)}
              style={{
                padding: "14px 36px",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 14,
                background: "linear-gradient(135deg, #22d3ee, #10b981)",
                color: "#020b14",
              }}
            >
              Get Started · Sign In
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div
          className="grid grid-3"
          style={{ gap: 24, marginTop: 40 }}
        >
          <div
            className="card fade-in"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(34, 211, 238, 0.3)",
              padding: 28,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Academic & Exam Intelligence</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
              Auto-calculate attendance eligibility, SGPA trends, day-wise timetables, and elective recommendations.
            </p>
          </div>

          <div
            className="card fade-in"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(139, 92, 246, 0.3)",
              padding: 28,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>RAG Policy Engine</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
              Instant retrieval-augmented answers over institutional handbooks, scholarship rules, and exam condonation.
            </p>
          </div>

          <div
            className="card fade-in"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(16, 185, 129, 0.3)",
              padding: 28,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📣</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Direct Grievance & SLA</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
              File complaints directly to Student Services with category selection, priority SLAs, and real-time status tracking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 40px",
          textAlign: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: 13,
          color: "#94a3b8",
          backdropFilter: "blur(8px)",
        }}
      >
        Sarvepalli Radhakrishna Engineering College — AgentX Smart Campus OS v2.0
      </footer>
    </div>
  );
}
