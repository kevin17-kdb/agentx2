import { useState } from "react";
import AgentQuery from "../components/AgentQuery";

const SERVICES = [
  {
    id: "transport",
    label: "Transport",
    icon: "🚌",
    desc: "Routes, timings, and fare passes.",
    query: "Show the transport routes, timings, and how much a monthly transport pass costs.",
  },
  {
    id: "hostel",
    label: "Hostel & Mess",
    icon: "🛏",
    desc: "Mess timings, warden contact, laundry.",
    query: "What are the hostel rules, mess timings, and warden contact details?",
  },
  {
    id: "fees",
    label: "Fees & Finance",
    icon: "🏛",
    desc: "Fee structure and budget planning.",
    query: "Show the annual fee structure and help me plan a monthly budget.",
  },
  {
    id: "library",
    label: "Library",
    icon: "📖",
    desc: "Library services, hours, and facilities.",
    query: "Summarize library services, hours, and borrowing rules.",
  },
  {
    id: "grievance",
    label: "Grievance",
    icon: "📣",
    desc: "File a complaint with an SLA.",
    query: "File a grievance about the wifi in my hostel.",
  },
  {
    id: "atm",
    label: "Campus Map",
    icon: "🗺",
    desc: "ATMs, printers, and walking directions.",
    query: "Where's the nearest ATM and where can I print a document?",
  },
];

export default function Services() {
  const [active, setActive] = useState("transport");
  const svc = SERVICES.find((s) => s.id === active);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18 }}>
      <div className="card" style={{ padding: 12, alignSelf: "start" }}>
        {SERVICES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              textAlign: "left",
              padding: "11px 12px",
              borderRadius: 10,
              marginBottom: 4,
              background: active === s.id ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
              color: active === s.id ? "var(--accent)" : "var(--text-2)",
              fontWeight: active === s.id ? 600 : 500,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <span>
              <div>{s.label}</div>
              <div className="small muted">{s.desc}</div>
            </span>
          </button>
        ))}
      </div>

      <AgentQuery key={svc.id} query={svc.query} title={svc.label} buttonLabel="Get details" auto />
    </div>
  );
}
