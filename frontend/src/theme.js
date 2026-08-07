export const THEMES = [
  {
    id: "aurora",
    name: "Midnight Aurora",
    blurb: "Deep navy glass with teal → violet → coral accents. Default.",
    swatches: ["#2dd4bf", "#8b5cf6", "#fb7185"],
    effect: "aurora",
  },
  {
    id: "terminal",
    name: "Neo-Terminal Campus",
    blurb: "Charcoal glass, phosphor-green + amber. Mainframe vibes.",
    swatches: ["#4ade80", "#fbbf24", "#22d3ee"],
    effect: "scanlines",
  },
  {
    id: "vaporwave",
    name: "Vaporwave Campus OS",
    blurb: "Indigo base, magenta-to-cyan, retro grid horizon.",
    swatches: ["#f472b6", "#22d3ee", "#a78bfa"],
    effect: "grid",
  },
  {
    id: "holodeck",
    name: "Holo-Deck Glass",
    blurb: "Near-black, luminous cyan-blue cards, particle drift.",
    swatches: ["#38bdf8", "#818cf8", "#22d3ee"],
    effect: "particles",
  },
  {
    id: "console",
    name: "Analog Command Console",
    blurb: "Warm brown glass, amber dials, retro toggle console.",
    swatches: ["#f59e0b", "#ef4444", "#fbbf24"],
    effect: "console",
  },
];

export const AGENT_META = {
  academic: { glyph: "AC", color: "#22d3ee", name: "Academic" },
  placement: { glyph: "PL", color: "#f59e0b", name: "Placement" },
  events: { glyph: "EV", color: "#a78bfa", name: "Events" },
  services: { glyph: "SV", color: "#34d399", name: "Student Services" },
  communication: { glyph: "CM", color: "#fb7185", name: "Communication" },
  knowledge: { glyph: "KB", color: "#818cf8", name: "Knowledge (RAG)" },
  notification: { glyph: "NT", color: "#f472b6", name: "Notification" },
  wellness: { glyph: "WL", color: "#2dd4bf", name: "Wellness" },
  navigator: { glyph: "NV", color: "#38bdf8", name: "Navigator" },
  finance: { glyph: "FN", color: "#fbbf24", name: "Finance" },
};

export const DEFAULT_STUDENT = "S101";
