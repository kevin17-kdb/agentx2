import { useState } from "react";
import api, { normalizeError } from "../api/client";
import Markdown from "../components/Markdown";
import AgentQuery from "../components/AgentQuery";

export default function Knowledge() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section className="card">
        <h3>Retrieval-augmented search</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          Query the institutional policy corpus — exam regulations, attendance policy, hostel rules,
          scholarship criteria and more — with citations.
        </p>
        <form className="chat-input-row" onSubmit={search}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. attendance policy, exam regulations, hostel rules…"
          />
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>

        {err && <div className="form-error" style={{ marginTop: 12 }}>{err}</div>}

        {results && (
          <div style={{ marginTop: 16 }}>
            <div className="small muted" style={{ marginBottom: 10 }}>
              {results.results.length} result(s) for “{results.query}” · {results.mode}
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

      <section>
        <div className="grid grid-2">
          <AgentQuery
            query="Summarize the attendance policy."
            title="Attendance policy"
            buttonLabel="Summarize"
          />
          <AgentQuery
            query="Summarize the exam regulations and eligibility."
            title="Exam regulations"
            buttonLabel="Summarize"
          />
        </div>
      </section>
    </div>
  );
}
