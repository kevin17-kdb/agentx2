import { useEffect, useRef, useState } from "react";
import Login from "./Login";

/* Interactive 3D Cyber Particle Mesh Canvas Background */
function CyberParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle nodes
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 18));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
    }));

    let mouse = { x: -1000, y: -1000 };
    const handleMouse = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep radial background gradient
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 3, 100,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      bgGrad.addColorStop(0, "#091426");
      bgGrad.addColorStop(0.5, "#040914");
      bgGrad.addColorStop(1, "#020409");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle perspective grid lines
      ctx.strokeStyle = "rgba(34, 211, 238, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update & draw particles + mesh connections
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse attraction
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 150) {
          p.x += dxMouse * 0.01;
          p.y += dyMouse * 0.01;
        }

        // Draw particle node
        ctx.fillStyle = "#22d3ee";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#22d3ee";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw mesh lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.25 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

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
            top: 72,
            left: 24,
            zIndex: 200,
            background: "color-mix(in srgb, var(--surface) 80%, transparent)",
            backdropFilter: "blur(10px)",
          }}
        >
          ← Back to Overview
        </button>
        <Login />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 3D Cyber Mesh Background */}
      <CyberParticleBackground />

      {/* Top Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(34, 211, 238, 0.15)",
          backdropFilter: "blur(16px)",
          background: "rgba(4, 9, 20, 0.65)",
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
              background: "linear-gradient(135deg, #22d3ee, #10b981)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 20,
              color: "#020b14",
              boxShadow: "0 0 16px rgba(34, 211, 238, 0.4)",
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>AgentX</div>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1, textTransform: "uppercase", color: "#22d3ee" }}>
              Smart Campus AI System
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
            Sign in →
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: "80px 40px 60px", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div className="slide-up" style={{ textAlign: "center", maxWidth: 850, margin: "0 auto 60px" }}>
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
            ✦ Smart Campus Assistant
          </span>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-1px",
              margin: "20px 0 24px",
              background: "linear-gradient(135deg, #ffffff 40%, #22d3ee 80%, #10b981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Welcome to AgentX — Your Smart Campus Assistant
          </h1>
          <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 680, margin: "0 auto 36px", lineHeight: 1.6 }}>
            Easily check your class schedule, calculate grades, search campus policies, and manage student services all in one place.
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
                boxShadow: "0 0 30px rgba(34, 211, 238, 0.4)",
              }}
            >
              Sign In to Your Account
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
              background: "rgba(9, 20, 38, 0.75)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(34, 211, 238, 0.3)",
              padding: 28,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#ffffff" }}>Academic Assistant</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
              Check your attendance, view day-wise timetables, and track previous semester marks.
            </p>
          </div>

          <div
            className="card fade-in"
            style={{
              background: "rgba(9, 20, 38, 0.75)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(139, 92, 246, 0.3)",
              padding: 28,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#ffffff" }}>Policy Search</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
              Search regulations, hostel rules, scholarship criteria, and exam guidelines instantly.
            </p>
          </div>

          <div
            className="card fade-in"
            style={{
              background: "rgba(9, 20, 38, 0.75)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(16, 185, 129, 0.3)",
              padding: 28,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📣</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#ffffff" }}>Student Helpdesk</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
              File grievances directly, check mess schedules, and view transport routes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 40px",
          textAlign: "center",
          borderTop: "1px solid rgba(34, 211, 238, 0.15)",
          fontSize: 13,
          color: "#94a3b8",
          backdropFilter: "blur(12px)",
          background: "rgba(4, 9, 20, 0.65)",
          position: "relative",
          zIndex: 10,
        }}
      >
        AgentX — Smart Campus OS v2.0
      </footer>
    </div>
  );
}
