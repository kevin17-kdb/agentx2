import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEMES = [
  { id: "ocean", name: "Deep Ocean", badge: "Ocean", colors: ["#020b14", "#22d3ee"], swatches: ["#22d3ee", "#0e7490"] },
  { id: "bluegreen", name: "Blue & Emerald", badge: "Blue & Green", colors: ["#1e40af", "#10b981"], swatches: ["#2563eb", "#10b981"] },
  { id: "cyber", name: "Electric & Neon", badge: "Cyber", colors: ["#00d2ff", "#00f5d4"], swatches: ["#00d2ff", "#00f5d4"] },
  { id: "royal", name: "Royal & Violet", badge: "Royal", colors: ["#1d4ed8", "#8b5cf6"], swatches: ["#3b82f6", "#8b5cf6"] },
  { id: "sunset", name: "Teal & Coral", badge: "Teal & Coral", colors: ["#14b8a6", "#f43f5e"], swatches: ["#14b8a6", "#f43f5e"] },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("agentx.theme") || "ocean");

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
