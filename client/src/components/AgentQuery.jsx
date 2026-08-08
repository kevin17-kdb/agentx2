import { useEffect, useState } from "react";
import api, { normalizeError } from "../api/client";
import Markdown from "./Markdown";
import Trace from "./Trace";

const SESSION = `mern-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Runs a single agent query on demand (or on mount when auto=true) and renders
 * the markdown answer plus the agent trace. Used by Student / Services / Knowledge pages.
 *
 * When the agent service is offline or errors, displays clean status state.
 */
export default function AgentQuery({ query, auto, title, buttonLabel = "Run" }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ran, setRan] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    setIsOffline(false);
    try {
      const { data: res } = await api.post("/chat", { query, session_id: SESSION });
      setData(res);
      setErr("");
      setIsOffline(false);
    } catch (e) {
      const normalized = normalizeError(e);
      if (normalized.code === "NETWORK" || normalized.code === "TIMEOUT" ||
          e.response?.status === 503) {
        setIsOffline(true);
      } else {
        setErr(normalized.message);
      }
    } finally {
      setBusy(false);
      setRan(true);
    }
  };

  // Auto-run on mount when auto prop is true
  useEffect(() => {
    if (auto) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card fade-in">
      {title && <h3 style={{ marginBottom: 4 }}>{title}</h3>}
      <p className="small muted" style={{ marginTop: 0 }}>
        {query}
      </p>

      {!data && !err && !isOffline && !busy && (
        <button className="btn btn-animated" disabled={busy} onClick={run}>
          {ran ? "Retry" : buttonLabel}
        </button>
      )}

      {busy && (
        <div className="typing">
          <span />
          <span />
          <span />
        </div>
      )}

      {!data && isOffline && (
        <div className="agent-offline-card fade-in">
          <div className="offline-icon">⚡</div>
          <div className="offline-text">
            <h4>Agent service offline</h4>
            <p>The AI agent backend is currently unavailable. Start it with <code className="font-mono">npm run dev:agent</code></p>
          </div>
          <button className="btn btn-animated" style={{ marginLeft: "auto", flexShrink: 0 }} onClick={run}>
            Retry
          </button>
        </div>
      )}

      {!data && err && !isOffline && (
        <div className="form-error fade-in" style={{ margin: "10px 0" }}>
          {err}
          <button className="btn btn-animated" style={{ marginLeft: 12, padding: "6px 12px", fontSize: 12 }} onClick={run}>
            Retry
          </button>
        </div>
      )}

      {data && (
        <div className="fade-in">
          <div className="msg bot" style={{ maxWidth: "100%" }}>
            <Markdown>{data.final_markdown_response}</Markdown>
          </div>
          <Trace result={data} />
          <button className="btn btn-animated" style={{ marginTop: 10 }} onClick={() => run()}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
