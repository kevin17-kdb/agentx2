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
  const scrollRef = useRef(null);
  const sentRef = useRef(false);

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

  // Auto-run a scenario prefill from the dashboard (?q=...).
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
    <div className="chat-wrap">
      <div ref={scrollRef} className="chat-scroll">
        {messages.length === 0 && (
          <div className="muted" style={{ textAlign: "center", padding: "60px 0" }}>
            Ask your campus agents anything. Try:{" "}
            <button className="btn btn-ghost" onClick={() => send("Where's the nearest ATM?")}>
              “Where's the nearest ATM?”
            </button>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.typing) {
            return (
              <div key={i} className="typing">
                <span />
                <span />
                <span />
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={i} className="msg user">
                {m.content}
              </div>
            );
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
              <Markdown>{m.content}</Markdown>
              {m.result && <Trace result={m.result} />}
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
              <button className="btn" disabled={busy} onClick={() => respond("reject")}>
                Reject
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={() => respond("approve")}>
                Approve & send
              </button>
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
  );
}
