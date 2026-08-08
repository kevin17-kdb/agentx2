import { useRef, useState } from "react";

/**
 * 3D Space Horizon Scene for Login Page.
 * Synchronized with the app's active theme palette (supports light and dark themes).
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

  // Floating 3D agent badges
  const agentBadges = [
    { icon: "🎓", name: "Academic Agent", sub: "Timetable & Grades", top: "14%", left: "10%" },
    { icon: "💼", name: "Placement AI", sub: "Jobs & Internships", top: "22%", left: "68%" },
    { icon: "📚", name: "Knowledge RAG", sub: "Policy & Handbooks", top: "65%", left: "8%" },
    { icon: "🌿", name: "Wellness Bot", sub: "Support & Balance", top: "72%", left: "62%" },
    { icon: "💳", name: "Finance Core", sub: "Fees & Budgeting", top: "42%", left: "75%" },
    { icon: "📍", name: "Campus Nav", sub: "ATMs & Maps", top: "44%", left: "4%" },
  ];

  return (
    <div
      className="login-scene"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      style={{
        background: "var(--scene-bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Theme-aware particle layer */}
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
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${(i * 17 + 5) % 95}%`,
              left: `${(i * 23 + 11) % 95}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
              opacity: 0.35 + (i % 5) * 0.12,
              animation: `blink ${2 + (i % 4)}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Floating 3D Glass Cards synchronized with active theme */}
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
              background: "color-mix(in srgb, var(--surface) 85%, transparent)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-pop)",
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
              <div style={{ fontSize: "11px", color: "var(--text-2)" }}>{badge.sub}</div>
            </div>
          </div>
))}
      </div>
    </div>
  );
}
