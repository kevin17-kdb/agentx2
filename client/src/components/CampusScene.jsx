import { useRef, useState } from "react";

/**
 * 3D Space Horizon Scene for Login Page (Picture 1).
 * Features the high-resolution space Earth atmosphere curvature background,
 * starry particle depth, mouse-tracked 3D parallax, and floating glass agent cards.
 */
export default function CampusScene() {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  // Floating 3D glass agent cards
  const agentBadges = [
    { icon: "🎓", name: "Academic Agent", sub: "Timetable & Grades", top: "14%", left: "10%", color: "#22d3ee" },
    { icon: "💼", name: "Placement AI", sub: "Jobs & Internships", top: "22%", left: "70%", color: "#f59e0b" },
    { icon: "📚", name: "Knowledge RAG", sub: "Policy & Handbooks", top: "65%", left: "8%", color: "#818cf8" },
    { icon: "🌿", name: "Wellness Bot", sub: "Support & Balance", top: "72%", left: "62%", color: "#2dd4bf" },
    { icon: "💳", name: "Finance Core", sub: "Fees & Budgeting", top: "42%", left: "78%", color: "#fbbf24" },
    { icon: "📍", name: "Campus Nav", sub: "ATMs & Maps", top: "44%", left: "4%", color: "#38bdf8" },
  ];

  return (
    <div
      className="login-scene"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      style={{
        backgroundImage: `url('/assets/space_horizon.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dark gradient overlay for contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
          zIndex: 1,
        }}
      />

      {/* Parallax Star Particles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 20}px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${(i * 17 + 5) % 95}%`,
              left: `${(i * 23 + 11) % 95}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 6px #ffffff",
              opacity: 0.3 + (i % 5) * 0.15,
              animation: `blink ${2 + (i % 4)}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Floating 3D Interactive Glass Cards */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        {agentBadges.map((badge, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: badge.top,
              left: badge.left,
              padding: "10px 14px",
              borderRadius: "14px",
              background: "color-mix(in srgb, var(--surface) 75%, transparent)",
              border: `1px solid ${badge.color}44`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${badge.color}33`,
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transform: `translate(${mousePos.x * (20 + i * 10)}px, ${mousePos.y * (15 + i * 8)}px)`,
              transition: "transform 0.25s ease-out",
              animation: `float-card 6s ease-in-out infinite alternate`,
              animationDelay: `${-i * 1.2}s`,
            }}
          >
            <span style={{ fontSize: "20px" }}>{badge.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-1)" }}>{badge.name}</div>
              <div style={{ fontSize: "11px", color: "var(--text-3)" }}>{badge.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="credits" style={{ zIndex: 10 }}>
        Sarvepalli Radhakrishna Engineering College — Smart Campus AI OS
      </div>
    </div>
  );
}
