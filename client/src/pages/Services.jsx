import { useState } from "react";
import AgentQuery from "../components/AgentQuery";
import api from "../api/client";

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

function GrievanceForm() {
  const [category, setCategory] = useState("Wi-Fi & Network");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || busy) return;
    setBusy(true);

    // Generate grievance ticket
    const ticketId = `GRV-${Math.floor(100000 + Math.random() * 900000)}`;
    const sla = priority === "Urgent" ? "12 hours" : priority === "High" ? "24 hours" : "48 hours";

    setTimeout(() => {
      setSubmittedTicket({
        id: ticketId,
        category,
        priority,
        description,
        sla,
        status: "Submitted (In Review)",
        timestamp: new Date().toLocaleString(),
      });
      setBusy(false);
      setDescription("");
    }, 600);
  };

  return (
    <div className="card fade-in" style={{ marginTop: 16 }}>
      <h3 style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
        <span>📣</span> File a Direct Grievance Ticket
      </h3>
      <p className="small muted" style={{ marginTop: 0, marginBottom: 16 }}>
        Submit your complaint directly to Student Services. All tickets are tracked with SLA compliance.
      </p>

      {submittedTicket ? (
        <div className="card fade-in" style={{ borderColor: "var(--ok)", background: "color-mix(in srgb, var(--ok) 8%, transparent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="badge ok" style={{ fontSize: 13, fontWeight: 700 }}>
              ✓ Ticket Created: {submittedTicket.id}
            </span>
            <span className="small muted">{submittedTicket.timestamp}</span>
          </div>
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            <strong>Category:</strong> {submittedTicket.category} · <strong>Priority:</strong>{" "}
            <span className="badge accent">{submittedTicket.priority}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>
            &ldquo;{submittedTicket.description}&rdquo;
          </div>
          <div className="small muted">
            Expected SLA resolution: <strong>{submittedTicket.sla}</strong> · Assigned to: Student Services Desk
          </div>
          <button className="btn btn-animated" style={{ marginTop: 12 }} onClick={() => setSubmittedTicket(null)}>
            File Another Grievance
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }}>
                <option value="Wi-Fi & Network">Wi-Fi & Network</option>
                <option value="Hostel & Mess">Hostel & Mess</option>
                <option value="Infrastructure & Maintenance">Infrastructure & Maintenance</option>
                <option value="Academics & Library">Academics & Library</option>
                <option value="Anti-Ragging & Safety">Anti-Ragging & Safety (Confidential)</option>
              </select>
            </div>
            <div>
              <label className="field">Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: "100%" }}>
                <option value="Normal">Normal (48h SLA)</option>
                <option value="High">High (24h SLA)</option>
                <option value="Urgent">Urgent (12h SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field">Grievance Details</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail (e.g., Wi-Fi disconnected in B-Block 3rd floor since yesterday)..."
              style={{ width: "100%", resize: "none" }}
            />
          </div>

          <button className="btn btn-primary btn-animated" disabled={busy || !description.trim()} style={{ alignSelf: "flex-start" }}>
            {busy ? "Submitting Ticket..." : "Submit Grievance Ticket"}
          </button>
        </form>
      )}
    </div>
  );
}

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
            className={`btn-animated${active === s.id ? " active" : ""}`}
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
              transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
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

      <div>
        <AgentQuery key={svc.id} query={svc.query} title={svc.label} buttonLabel="Get details" auto />
        {active === "grievance" && <GrievanceForm />}
      </div>
    </div>
  );
}
