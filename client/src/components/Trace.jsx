const AGENT_COLORS = {
  academic: "#22d3ee",
  placement: "#f59e0b",
  events: "#a78bfa",
  services: "#34d399",
  communication: "#fb7185",
  knowledge: "#818cf8",
  notification: "#f472b6",
  wellness: "#2dd4bf",
  navigator: "#38bdf8",
  finance: "#fbbf24",
};

const AGENT_GLYPH = {
  academic: "AC",
  placement: "PL",
  events: "EV",
  services: "SV",
  communication: "CM",
  knowledge: "KB",
  notification: "NT",
  wellness: "WL",
  navigator: "NV",
  finance: "FN",
};

/**
 * Renders the agent trace for a buffered chat response: planned steps, then the
 * per-step tool calls and their summaries from agent_logs.
 */
export default function Trace({ result }) {
  const logs = result?.agent_logs || [];

  return (
    <div className="trace">
      <h4>Agent reasoning trace</h4>
      {result?.execution_graph?.nodes?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {result.execution_graph.nodes.map((n) => (
            <span
              key={n.id}
              className="badge accent"
              style={{
                color: AGENT_COLORS[n.agent] || "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
              }}
            >
              {AGENT_GLYPH[n.agent] || n.agent.slice(0, 2).toUpperCase()} · {n.label}
            </span>
          ))}
        </div>
      )}
      {logs.length === 0 && <div className="muted small">No tool calls were needed for this turn.</div>}
      {logs.map((l, i) => {
        const color = AGENT_COLORS[l.agent] || "var(--accent)";
        const ok = l.status === "success";
        return (
          <div key={i} className="trace-step">
            <span
              className="glyph"
              style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
            >
              {AGENT_GLYPH[l.agent] || l.agent.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div>
                <span className="agent">{l.agent}</span>
                <span className="tool"> {l.tool}</span>
                <span className={ok ? "muted small" : ""} style={ok ? {} : { color: "var(--bad)" }}>
                  {" "}
                  · {ok ? "ok" : "failed"}
                </span>
              </div>
              <div className="summary">{l.summary}</div>
            </div>
          </div>
        );
      })}
      {result?.hitl_pending && (
        <div className="muted small" style={{ marginTop: 8 }}>
          ⏸ Waiting for your approval before this action is dispatched.
        </div>
      )}
    </div>
  );
}
