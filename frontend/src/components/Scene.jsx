import { motion } from "framer-motion";

export default function Scene({ effect }) {
  const particles = Array.from({ length: 34 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    duration: `${12 + (i % 9)}s`,
    delay: `${-(i % 14)}s`,
  }));

  return (
    <div className={`bg-scene bg-${effect}`}>
      {effect === "aurora" && (
        <>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </>
      )}
      {effect === "scanlines" && <div className="crt" />}
      {effect === "particles" &&
        particles.map((p, i) => (
          <motion.div
            key={i}
            className="particle"
            style={{ left: p.left, animationDuration: p.duration, animationDelay: p.delay }}
          />
        ))}
    </div>
  );
}
