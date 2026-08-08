import { useRef, useState } from "react";

/**
 * Enhanced mouse-tracked 3D tilt card with specular highlight,
 * depth shadow, and smoother spring-like return animation.
 */
export default function TiltCard({ children, className = "", max = 8 }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: "50%", y: "50%" });
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: -(py - 0.5) * max, y: (px - 0.5) * max });
    setMousePos({ x: `${px * 100}%`, y: `${py * 100}%` });
  };

  const onLeave = () => {
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: "50%", y: "50%" });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        perspective: 1200,
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
        transformStyle: "preserve-3d",
        "--mouse-x": mousePos.x,
        "--mouse-y": mousePos.y,
      }}
    >
      {children}
    </div>
  );
}
