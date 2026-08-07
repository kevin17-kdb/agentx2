import { useState } from "react";
import api, { normalizeError } from "../api/client";
import Markdown from "./Markdown";
import Trace from "./Trace";

const SESSION = `mern-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Runs a single agent query on demand (or on mount) and renders the markdown
 * answer plus the agent trace. Used by the Student / Services / Knowledge pages.
 */
export default function AgentQuery({ query, auto, title, buttonLabel = "Run" }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ran, setRan] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    setData(null);
    try {
      const { data: res } = await api.post("/chat", { query, session_id: SESSION });
      setData(res);
    } catch (e) {
      setErr(normalizeError(e).message);
    } finally {
      setBusy(false);
      setRan(true);
    }
  };

  return (
    <div className="card">
      {title && <h3 style={{ marginBottom: 4 }}>{title}</h3>}
      <p className="small muted" style={{ marginTop: 0 }}>
        {query}
      </p>

      {!data && !err && (
        <button className="btn" disabled={busy} onClick={run}>
          {busy ? "Agents are thinking…" : ran ? "Retry" : buttonLabel}
        </button>
      )}

      {busy && (
        <div className="typing">
          <span />
          <span />
          <span />
        </div>
      )}

      {err && (
        <div className="form-error" style={{ margin: "10px 0" }}>
          {err}
        </div>
      )}

      {data && (
        <>
          <div className="msg bot" style={{ maxWidth: "100%" }}>
            <Markdown>{data.final_markdown_response}</Markdown>
          </div>
          <Trace result={data} />
          {!auto && (
            <button className="btn" style={{ marginTop: 10 }} onClick={() => run()}>
              Refresh
            </button>
          )}
        </>
      )}
    </div>
  );
}
