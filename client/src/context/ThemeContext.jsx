import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEMES = [
  { id: "royal", name: "Royal Violet", badge: "Royal", swatches: ["#3b82f6", "#8b5cf6"] },
  { id: "cream", name: "Minimal Canvas", badge: "Canvas", swatches: ["#f6f5ee", "#18261e"] },
  { id: "emerald", name: "Sage Emerald", badge: "Emerald", swatches: ["#eef7f2", "#093829"] },
  { id: "obsidian", name: "Obsidian Cyber", badge: "Obsidian", swatches: ["#0b0f19", "#06b6d4"] },
  { id: "warm", name: "Warm Amber", badge: "Amber", swatches: ["#14100c", "#f59e0b"] },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("agentx.theme") || "royal");

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
