import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AgentQuery from "../components/AgentQuery";

const TABS = [
  {
    id: "profile",
    label: "Profile",
    query: "Show my complete student profile: name, branch, year, CGPA, attendance, and any pending items.",
  },
  {
    id: "timetable",
    label: "Timetable",
    query: "Show today's classes with times and rooms, and this week's highlights.",
  },
  {
    id: "academics",
    label: "Academics",
    query: "Recommend electives for my branch and level, and summarize the exam regulations.",
  },
  {
    id: "attendance",
    label: "Attendance",
    query: "Calculate my attendance percentage and tell me if I'm eligible for exams.",
  },
];

export default function Student() {
  const { auth } = useAuth();
  const [tab, setTab] = useState("profile");
  const active = TABS.find((t) => t.id === tab);
  const name = auth?.user?.name || auth?.user?.username;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section className="card" style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span className="avatar-lg">{name?.[0]}</span>
        <div>
          <h2 style={{ margin: 0 }}>{name}</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Student ID <span className="font-mono">{auth?.user?.studentId}</span> · role{" "}
            <span className="badge accent">{auth?.user?.role}</span>
          </p>
        </div>
      </section>

      <section>
        <div className="tab-row" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <AgentQuery key={active.id} query={active.query} title={active.label} auto />
      </section>
    </div>
  );
}
