import { useState } from "react";
import api, { normalizeError } from "../api/client";
import Markdown from "../components/Markdown";
import AgentQuery from "../components/AgentQuery";

const CATEGORIES = [
  { id: "all", label: "All Policies" },
  { id: "academic", label: "Academic & Exam" },
  { id: "hostel", label: "Hostel & Mess" },
  { id: "scholarship", label: "Scholarship & Aid" },
  { id: "conduct", label: "Conduct & Grievance" },
  { id: "sports", label: "Sports & Extra-Curricular" },
];

const PRESET_POLICIES = [
  {
    category: "academic",
    title: "Attendance & Condonation Policy 2025–2026",
    doc_id: "POL-ACAD-01",
    snippet: "A minimum of **75% attendance** is mandatory in each theory and practical subject. Condonation up to **10% (65%-74%)** may be granted by the Principal on medical grounds with a valid medical certificate submitted within 3 days. Students below 65% attendance are detained and cannot appear for end-semester exams.",
  },
  {
    category: "academic",
    title: "Examination & Grading System",
    doc_id: "POL-EXAM-02",
    snippet: "Evaluation comprises **30% Internal Assessment** (mid-term exams, assignments, quizzes) and **70% End-Semester Exam**. Grading is on a 10-point scale: O (10), A+ (9), A (8), B+ (7), B (6), C (5), F (0). Minimum passing grade is C (5.0) in each course.",
  },
  {
    category: "hostel",
    title: "Hostel Residence & Curfew Rules",
    doc_id: "POL-HSTL-01",
    snippet: "Curfew in-time is **09:00 PM for all hostel residents**. Night-out passes require warden approval via the student portal at least 6 hours in advance. Mess hours: Breakfast (07:30 - 09:00 AM), Lunch (12:30 - 02:00 PM), Dinner (07:30 - 09:00 PM). Anti-ragging policy is strictly enforced.",
  },
  {
    category: "scholarship",
    title: "Merit & Need-Based Scholarships",
    doc_id: "POL-SCHOL-01",
    snippet: "Students securing **CGPA >= 8.5** with family annual income under ₹5,00,000 are eligible for a **50% tuition fee waiver**. Special **Women in STEM Scholarship** offers up to ₹40,000/year for eligible female engineering students.",
  },
  {
    category: "conduct",
    title: "Student Code of Conduct & Anti-Ragging",
    doc_id: "POL-COND-01",
    snippet: "Sarvepalli Radhakrishna Engineering College maintains a zero-tolerance policy towards ragging, harassment, and substance abuse. Violations result in immediate suspension, FIR filing, and permanent expulsion. Grievances can be submitted anonymously.",
  },
  {
    category: "sports",
    title: "Sports Credits & Activity Points",
    doc_id: "POL-SPRT-01",
    snippet: "Students earn **1 Activity Point per 10 hours** of participation in inter-college sports, NCC, NSS, or technical clubs. A total of **10 activity points** are required for degree award.",
  },
];

export default function Knowledge() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const search = async (e) => {
    e?.preventDefault();
    if (busy || !query.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/rag/search", { query, top_k: 4 });
      setResults(data);
    } catch (e2) {
      setErr(normalizeError(e2).message);
    } finally {
      setBusy(false);
    }
  };

  const filteredPreset = PRESET_POLICIES.filter(
    (p) => activeCategory === "all" || p.category === activeCategory
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section className="card">
        <h3>Retrieval-Augmented Policy Search (RAG)</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          Search official campus regulations, attendance rules, hostel guidelines, scholarship criteria, and exam handbooks with direct AI citations.
        </p>
        <form className="chat-input-row" onSubmit={search}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. attendance policy, exam regulations, hostel rules, scholarship criteria…"
          />
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>

        {err && <div className="form-error" style={{ marginTop: 12 }}>{err}</div>}

        {results && (
          <div style={{ marginTop: 16 }}>
            <div className="small muted" style={{ marginBottom: 10 }}>
              {results.results.length} result(s) for &ldquo;{results.query}&rdquo; · {results.mode}
            </div>
            {results.results.map((r, i) => (
              <div key={i} className="card" style={{ marginBottom: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong>{r.title}</strong>
                  <span className="badge">score {r.relevance_score?.toFixed?.(3) ?? r.relevance_score}</span>
                </div>
                <Markdown>
                  {Array.isArray(r.snippet)
                    ? r.snippet.join("\n\n")
                    : typeof r.snippet === "string"
                      ? r.snippet
                      : JSON.stringify(r.snippet)}
                </Markdown>
                {r.doc_id && <div className="small muted" style={{ marginTop: 8 }}>doc: {r.doc_id}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Category filter tabs */}
      <section>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`theme-badge${activeCategory === c.id ? " active" : ""}`}
              onClick={() => setActiveCategory(c.id)}
              style={{ padding: "6px 14px", fontSize: 13 }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-2">
          {filteredPreset.map((p, i) => (
            <div key={i} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: 15 }}>{p.title}</h4>
                <span className="badge font-mono" style={{ fontSize: 11 }}>{p.doc_id}</span>
              </div>
              <Markdown>{p.snippet}</Markdown>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="grid grid-2">
          <AgentQuery
            query="Summarize the attendance policy and condonation eligibility."
            title="Attendance Policy Summary"
            buttonLabel="Summarize"
            auto
          />
          <AgentQuery
            query="Summarize the exam regulations and grading scale."
            title="Exam Regulations Summary"
            buttonLabel="Summarize"
            auto
          />
        </div>
      </section>
    </div>
  );
}
