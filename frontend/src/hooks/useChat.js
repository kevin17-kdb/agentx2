import { useCallback, useEffect, useRef, useState } from "react";

const PROTO = window.location.protocol === "https:" ? "wss" : "ws";

let idCounter = 0;
const uid = () => `m${++idCounter}-${Date.now()}`;

export function useChat({ token }) {
  const [messages, setMessages] = useState([]);
  const [run, setRun] = useState(null); // live reasoning trace for the current turn
  const [hitl, setHitl] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState("deterministic");

  const wsRef = useRef(null);
  const sessionRef = useRef(null);
  const hitlRef = useRef(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  hitlRef.current = hitl;

  const pushRun = useCallback((fn) => {
    setRun((prev) => (prev ? { ...prev, ...fn(prev) } : prev));
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus("disconnected");
      return undefined;
    }
    let closed = false;
    let retryTimer = null;

    const connect = () => {
      const ws = new WebSocket(`${PROTO}://${window.location.host}/ws/chat?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => setStatus("connected");
      ws.onclose = () => {
        if (!closed) {
          setStatus("disconnected");
          retryTimer = setTimeout(connect, 1500);
        }
      };

      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        switch (data.type) {
          case "ready":
            sessionRef.current = data.session_id;
            setMode(data.mode);
            break;
          case "plan":
            setMode(data.mode);
            setRun({ reasoning: data.reasoning, steps: data.steps, entries: [] });
            break;
          case "agent_start":
            pushRun((r) => ({ entries: [...r.entries, { kind: "agent_start", agent: data.agent, glyph: data.glyph, color: data.color, task: data.task, ts: data.ts }] }));
            break;
          case "tool_call":
            pushRun((r) => ({ entries: [...r.entries, { kind: "tool_call", agent: data.agent, tool: data.tool, args: data.args, ts: data.ts }] }));
            break;
          case "tool_result":
            pushRun((r) => ({ entries: [...r.entries, { kind: "tool_result", agent: data.agent, tool: data.tool, summary: data.summary, status: data.status, ts: data.ts }] }));
            break;
          case "error":
            pushRun((r) => ({ entries: [...r.entries, { kind: "error", agent: data.agent || "system", message: data.message, retry: data.retry, degraded: data.degraded, ts: data.ts }] }));
            break;
          case "hitl":
            setHitl({ draftId: data.payload.draft_id || data.payload.ticket_id, payload: data.payload, agent: data.agent });
            break;
          case "hitl_result":
            setHitl((prev) => (prev ? { ...prev, action: data.action } : prev));
            break;
          case "final":
            setMessages((prev) => [
              ...prev,
              { id: uid(), role: "assistant", content: data.markdown, time: Date.now(), meta: { mode: data.mode, agents: data.agent_count, steps: data.steps_executed } },
            ]);
            pushRun((r) => ({ status: "done" }));
            setThinking(false);
            break;
          case "complete":
            setThinking(false);
            break;
          default:
            break;
        }
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, [token, pushRun]);

  const sendMessage = useCallback((query, studentId) => {
    if (!query.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: query, time: Date.now() }]);
    setHitl(null);
    setRun(null);
    setThinking(true);
    wsRef.current.send(JSON.stringify({ type: "chat", query, student_id: studentId }));
  }, []);

  const respondToHitl = useCallback(
    (action) => {
      const active = hitlRef.current;
      if (!active || !active.draftId) return;
      setHitl((prev) => (prev ? { ...prev, submitting: true } : prev));
      fetch(`/api/hitl/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({ action, draft_id: active.draftId, session_id: sessionRef.current }),
      })
        .then((r) => r.json())
        .then((res) => {
          setHitl(null);
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: action === "approve"
                ? `**Approved & dispatched** — ${res.message}`
                : `**Draft cancelled** — ${res.message}`,
              time: Date.now(),
              meta: { system: true },
            },
          ]);
        })
        .catch(() => setHitl((prev) => (prev ? { ...prev, submitting: false } : prev)));
    },
    []
  );

  return { messages, run, hitl, status, thinking, mode, sendMessage, respondToHitl };
}
