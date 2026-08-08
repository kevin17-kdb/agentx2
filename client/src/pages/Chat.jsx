import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { normalizeError } from "../api/client";
import Markdown from "../components/Markdown";
import Trace from "../components/Trace";

const SESSION_ID = `mern-${Math.random().toString(36).slice(2, 10)}`;

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTrace, setLastTrace] = useState(null);
  const [hitl, setHitl] = useState(null);
  const [error, setError] = useState("");
  const [showPipeline, setShowPipeline] = useState(false);
  const scrollRef = useRef(null);
  const sentRef = useRef(false);

  // Chat history sessions
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agentx.chatHistory") || "[]");
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  // Save to history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const existing = chatHistory.filter(h => h.sessionId !== SESSION_ID);
      const firstUserMsg = messages.find(m => m.role === "user");
      const summary = firstUserMsg?.content?.slice(0, 60) || "Chat session";
      const updated = [
        { sessionId: SESSION_ID, summary, msgCount: messages.length, timestamp: Date.now(), messages },
        ...existing,
      ].slice(0, 20); // Keep last 20 sessions
      setChatHistory(updated);
      localStorage.setItem("agentx.chatHistory", JSON.stringify(updated));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const loadSession = (session) => {
    setMessages(session.messages || []);
    setShowHistory(false);
  };

  const deleteSession = (sessionId, e) => {
    e.stopPropagation();
    const updated = chatHistory.filter(h => h.sessionId !== sessionId);
    setChatHistory(updated);
    localStorage.setItem("agentx.chatHistory", JSON.stringify(updated));
  };

  const send = async (text) => {
    const query = (text || input).trim();
    if (!query || busy) return;
    setBusy(true);
    setError("");
    setInput("");
    setHitl(null);
    setLastTrace(null);
    const userMsg = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setMessages((prev) => [...prev, { role: "bot", content: "", typing: true }]);
    try {
      const { data } = await api.post("/chat", { query, session_id: SESSION_ID });
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findLastIndex((m) => m.typing);
        if (idx >= 0) {
          next[idx] = { role: "bot", content: data.final_markdown_response, typing: false, result: data };
        }
        return next;
      });
      if (data.hitl_pending && data.hitl_payload) {
        setHitl({ payload: data.hitl_payload, draftId: data.hitl_payload.draft_id || data.hitl_payload.ticket_id });
      }
      setLastTrace(data);
    } catch (err) {
      const e = normalizeError(err);
      setError(e.message);
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findLastIndex((m) => m.typing);
        if (idx >= 0) next[idx] = { role: "bot", content: "", typing: false, failed: true };
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !sentRef.current) {
      sentRef.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const respond = async (action) => {
    if (!hitl) return;
    setBusy(true);
    try {
      const { data } = await api.post("/chat/respond", {
        action,
        draft_id: hitl.draftId,
        session_id: SESSION_ID,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: action === "approve"
            ? `**Approved & dispatched** — ${data.message}`
            : `**Draft cancelled** — ${data.message}`,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "**Error** — could not record your decision. Try again." }]);
    } finally {
      setHitl(null);
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ display: "flex", gap: 0, height: "100%" }}>
      {/* Chat History Sidebar */}
      <div style={{
        width: showHistory ? 260 : 0,
        minWidth: showHistory ? 260 : 0,
        overflow: "hidden",
        transition: "all 0.2s ease",
        borderRight: showHistory ? "1px solid var(--border)" : "none",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Chat History</div>
          <div className="small muted">{chatHistory.length} sessions saved</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
          {chatHistory.length === 0 ? (
            <div className="muted small" style={{ padding: 12, textAlign: "center" }}>No chat history yet</div>
          ) : (
            chatHistory.map((h) => (
              <button
                key={h.sessionId}
                onClick={() => loadSession(h)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", textAlign: "left", padding: "10px 12px",
                  borderRadius: 10, marginBottom: 4,
                  background: h.sessionId === SESSION_ID
                    ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: 13, color: "var(--text-1)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {h.summary || "Chat"}
                  </div>
                  <div className="small muted">
                    {h.msgCount} msgs · {new Date(h.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <span
                  onClick={(e) => deleteSession(h.sessionId, e)}
                  style={{ color: "var(--text-3)", fontSize: 14, padding: 4, cursor: "pointer", flexShrink: 0 }}
                  title="Delete"
                >✕</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Chat toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderBottom: "1px solid var(--border)",
        }}>
          <button className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)} style={{ padding: "6px 10px", fontSize: 13 }}>
            {showHistory ? "◁ Hide" : "▷ History"}
          </button>
          <button
            className={`btn btn-ghost${showPipeline ? " active" : ""}`}
            onClick={() => setShowPipeline(!showPipeline)}
            style={{ padding: "6px 10px", fontSize: 13 }}
          >
            ◈ Pipeline
          </button>
          <div className="grow" />
          <button className="btn btn-ghost" onClick={() => {
            setMessages([]);
            setLastTrace(null);
            setHitl(null);
            setError("");
          }} style={{ padding: "6px 10px", fontSize: 13 }}>
            ✦ New Chat
          </button>
        </div>

        {/* Pipeline Flow Visualization */}
        {showPipeline && lastTrace && (
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid var(--border)",
            background: "color-mix(in srgb, var(--surface) 50%, transparent)",
          }}>
            <div className="small muted" style={{ marginBottom: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Agent Pipeline Flow
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
              {/* User input node */}
              <div className="pipeline-node pipeline-user">
                <div className="pipeline-icon">👤</div>
                <div className="pipeline-label">User Query</div>
              </div>
              <div className="pipeline-arrow">→</div>

              {/* Planner node */}
              <div className="pipeline-node pipeline-planner">
                <div className="pipeline-icon">🧠</div>
                <div className="pipeline-label">Planner</div>
                <div className="pipeline-sub">{lastTrace.execution_graph?.nodes?.length || 0} steps</div>
              </div>
              <div className="pipeline-arrow">→</div>

              {/* Agent execution nodes */}
              {(lastTrace.agent_logs || []).map((log, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div className={`pipeline-node ${log.status === "success" ? "pipeline-ok" : "pipeline-err"}`}>
                    <div className="pipeline-icon" style={{ fontSize: 14 }}>
                      {log.status === "success" ? "✓" : "✗"}
                    </div>
                    <div className="pipeline-label">{log.agent}</div>
                    <div className="pipeline-sub font-mono">{log.tool}</div>
                  </div>
                  {i < arr.length - 1 && <div className="pipeline-arrow">→</div>}
                </div>
              ))}

              <div className="pipeline-arrow">→</div>

              {/* Composer node */}
              <div className="pipeline-node pipeline-composer">
                <div className="pipeline-icon">📝</div>
                <div className="pipeline-label">Composer</div>
                <div className="pipeline-sub">Final Response</div>
              </div>
            </div>
          </div>
        )}

        <div className="chat-wrap" style={{ flex: 1 }}>
          <div ref={scrollRef} className="chat-scroll">
            {messages.length === 0 && (
              <div className="muted" style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "var(--text-2)" }}>
                  Campus AI Assistant
                </div>
                <div className="small" style={{ marginBottom: 16 }}>
                  10 specialized agents · RAG knowledge base · LangGraph orchestration
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {[
                    "Where's the nearest ATM?",
                    "Show my timetable",
                    "Am I eligible for placements?",
                    "File a wifi grievance",
                  ].map((q) => (
                    <button key={q} className="btn" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              if (m.typing) {
                return (
                  <div key={i} className="typing">
                    <span /><span /><span />
                  </div>
                );
              }
              if (m.role === "user") {
                return <div key={i} className="msg user">{m.content}</div>;
              }
              if (m.failed) {
                return (
                  <div key={i} className="msg banner">
                    {error || "Something went wrong."} — the agent service may be offline.
                  </div>
                );
              }
              return (
                <div key={i} className="msg bot">
                  <div className="msg-answer">
                    <Markdown>{m.content}</Markdown>
                  </div>
                  {m.result && (
                    <div className="msg-trace">
                      <Trace result={m.result} />
                    </div>
                  )}
                </div>
              );
            })}

            {hitl && (
              <div className="hitl-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <strong>Human-in-the-loop · action required</strong>
                  <span className="badge accent">
                    {hitl.payload.recipient ? "Draft email" : "Grievance ticket"}
                  </span>
                </div>
                <pre className="font-mono">{JSON.stringify(hitl.payload, null, 2)}</pre>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="btn" disabled={busy} onClick={() => respond("reject")}>Reject</button>
                  <button className="btn btn-primary" disabled={busy} onClick={() => respond("approve")}>Approve & send</button>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask your campus agents anything…"
              rows={2}
            />
            <button className="btn btn-primary" disabled={busy || !input.trim()} onClick={() => send()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
