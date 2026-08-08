import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEMES = [
  { id: "dark", name: "Midnight Aurora", badge: "Aurora", swatches: ["#2dd4bf", "#8b5cf6", "#fb7185"] },
  { id: "light", name: "Crystal Light", badge: "Crystal", swatches: ["#0d9488", "#7c3aed", "#e11d48"] },
  { id: "retro", name: "Amber Console", badge: "Console", swatches: ["#f59e0b", "#ef4444", "#fbbf24"] },
  { id: "neon", name: "Neon Cyberpunk", badge: "Cyber", swatches: ["#ec4899", "#06b6d4", "#a3e635"] },
  { id: "ocean", name: "Deep Ocean", badge: "Ocean", swatches: ["#22d3ee", "#a78bfa", "#34d399"] },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("agentx.theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("agentx.theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
