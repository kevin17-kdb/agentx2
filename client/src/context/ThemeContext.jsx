import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEMES = [
  { id: "royal", name: "Paper Moss", badge: "Paper", swatches: ["#f2efe6", "#2c4a3e"] },
  { id: "cream", name: "Canvas Cream", badge: "Canvas", swatches: ["#f4f1e9", "#22382e"] },
  { id: "emerald", name: "Sage Leaf", badge: "Sage", swatches: ["#eef2ea", "#0f3b2c"] },
  { id: "obsidian", name: "Forest Moss", badge: "Forest", swatches: ["#16281f", "#c4f26e"] },
  { id: "warm", name: "Ember Canva", badge: "Ember", swatches: ["#f1eadd", "#4a5a2a"] },
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
