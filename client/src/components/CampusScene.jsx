import { useEffect, useRef, useState } from "react";

/**
 * 3D Earth globe with neural network connections and floating agent cards.
 * Uses Canvas 2D to render a rotating wireframe sphere resembling Earth,
 * with glowing continent patches, orbiting particles, and mouse-tracked parallax.
 */
export default function CampusScene() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Globe parameters
    const R = Math.min(canvas.width, canvas.height) * 0.32;
    let rotation = 0;

    // Generate continent-like patches (lat/lon pairs)
    const continentPoints = [];
    // Asia / India region
    for (let i = 0; i < 40; i++) {
      continentPoints.push({
        lat: 10 + Math.random() * 35,
        lon: 65 + Math.random() * 50,
        size: 2 + Math.random() * 3,
      });
    }
    // Europe
    for (let i = 0; i < 25; i++) {
      continentPoints.push({
        lat: 35 + Math.random() * 30,
        lon: -10 + Math.random() * 50,
        size: 2 + Math.random() * 2.5,
      });
    }
    // Africa
    for (let i = 0; i < 30; i++) {
      continentPoints.push({
        lat: -35 + Math.random() * 50,
        lon: -10 + Math.random() * 55,
        size: 2 + Math.random() * 3,
      });
    }
    // Americas
    for (let i = 0; i < 35; i++) {
      continentPoints.push({
        lat: -40 + Math.random() * 90,
        lon: -120 + Math.random() * 60,
        size: 2 + Math.random() * 3,
      });
    }
    // Oceania
    for (let i = 0; i < 15; i++) {
      continentPoints.push({
        lat: -40 + Math.random() * 25,
        lon: 110 + Math.random() * 50,
        size: 2 + Math.random() * 2,
      });
    }

    // Wireframe grid lines (meridians and parallels)
    const gridLines = [];
    // Meridians
    for (let lon = -180; lon < 180; lon += 30) {
      const line = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        line.push({ lat, lon });
      }
      gridLines.push(line);
    }
    // Parallels
    for (let lat = -60; lat <= 60; lat += 30) {
      const line = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        line.push({ lat, lon });
      }
      gridLines.push(line);
    }

    // Orbiting particles
    const orbitParticles = Array.from({ length: 25 }, (_, i) => ({
      angle: (Math.PI * 2 * i) / 25 + Math.random() * 0.5,
      speed: 0.003 + Math.random() * 0.004,
      orbitR: R * (1.15 + Math.random() * 0.3),
      tilt: -30 + Math.random() * 60,
      size: 1.5 + Math.random() * 2,
    }));

    // Project lat/lon to 2D
    function project(lat, lon, cx, cy, rot) {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = ((lon + rot) * Math.PI) / 180;
      const x3d = R * Math.cos(latRad) * Math.sin(lonRad);
      const y3d = -R * Math.sin(latRad);
      const z3d = R * Math.cos(latRad) * Math.cos(lonRad);
      const scale = 500 / (500 + z3d);
      return { x: cx + x3d * scale, y: cy + y3d * scale, z: z3d, scale };
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      rotation += 0.15;

      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue("--accent").trim() || "#2dd4bf";
      const accent2 = style.getPropertyValue("--accent-2").trim() || "#8b5cf6";

      // Globe atmosphere glow
      const gradient = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.4);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.7, `${accent}08`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw wireframe grid
      ctx.lineWidth = 0.5;
      gridLines.forEach((line) => {
        ctx.beginPath();
        let started = false;
        for (const pt of line) {
          const p = project(pt.lat, pt.lon, cx, cy, rotation);
          if (p.z < -10) { started = false; continue; }
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = `${accent}18`;
        ctx.stroke();
      });

      // Draw continent dots
      continentPoints.forEach((cp) => {
        const p = project(cp.lat, cp.lon, cx, cy, rotation);
        if (p.z < -20) return;
        const alpha = Math.max(0.1, (p.z + R) / (2 * R));
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, cp.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
        // Glow on some
        if (cp.size > 3.5) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, cp.size * p.scale * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Draw equator ring (thin glowing ring)
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 2) {
        const p = project(0, lon, cx, cy, rotation);
        if (lon === -180) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `${accent}35`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Orbiting particles
      orbitParticles.forEach((op) => {
        op.angle += op.speed;
        const tiltRad = (op.tilt * Math.PI) / 180;
        const ox = cx + Math.cos(op.angle) * op.orbitR;
        const oy = cy + Math.sin(op.angle) * op.orbitR * Math.cos(tiltRad);
        const oz = Math.sin(op.angle) * op.orbitR * Math.sin(tiltRad);
        const alpha = oz > 0 ? 0.7 : 0.2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = oz > 0 ? accent : accent2;
        ctx.beginPath();
        ctx.arc(ox, oy, op.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Floating glass agent cards
  const agentBadges = [
    { icon: "🎓", name: "Academic Agent", sub: "Timetable & Grades", top: "12%", left: "8%", color: "#22d3ee" },
    { icon: "💼", name: "Placement AI", sub: "Jobs & Internships", top: "20%", left: "72%", color: "#f59e0b" },
    { icon: "📚", name: "Knowledge RAG", sub: "Policy & Handbooks", top: "62%", left: "6%", color: "#818cf8" },
    { icon: "🌿", name: "Wellness Bot", sub: "Support & Balance", top: "70%", left: "65%", color: "#2dd4bf" },
    { icon: "💳", name: "Finance Core", sub: "Fees & Budgeting", top: "40%", left: "80%", color: "#fbbf24" },
    { icon: "📍", name: "Campus Nav", sub: "ATMs & Maps", top: "44%", left: "3%", color: "#38bdf8" },
  ];

  return (
    <div
      className="login-scene"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      <div className="scene-glow scene-glow-1" />
      <div className="scene-glow scene-glow-2" />
      <div className="scene-glow scene-glow-3" />

      {/* 3D Earth Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 15}px)`,
          transition: "transform 0.2s ease-out",
        }}
      />

      {/* Floating glass agent cards */}
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
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 15px ${badge.color}22`,
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transform: `translate(${mousePos.x * (15 + i * 8)}px, ${mousePos.y * (10 + i * 6)}px)`,
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

      <div className="credits">
        Sarvepalli Radhakrishna Engineering College — Smart Campus AI OS
      </div>
    </div>
  );
}
