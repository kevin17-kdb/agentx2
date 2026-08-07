"""Zero-dependency HTTP service exposing the AgentX agent runtime.

Runs the existing `backend` package (LangGraph orchestrator, 10 agents, RAG,
SQLite seed data) behind the Python standard library's http.server — no FastAPI,
no uvicorn, no new dependencies. The Express server proxies to this service.

Endpoints
  GET  /health        service + runtime status
  POST /chat          run the full multi-agent pipeline   {query, student_id, session_id?}
  POST /rag/search    RAG retrieval                       {query, top_k?}
"""

import concurrent.futures
import json
import os
import sys
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Make the repo root importable so `backend` resolves regardless of CWD.
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from backend.core.graph import graph  # noqa: E402
from backend.core.llm import llm  # noqa: E402
from backend.data import db  # noqa: E402
from backend.rag.engine import rag_engine  # noqa: E402
from backend.agents.registry import AGENTS  # noqa: E402

PORT = int(os.environ.get("AGENT_SERVICE_PORT", "8100"))
POOL = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _build_state(query, student_id, session_id):
    return {
        "user_query": query.strip(),
        "student_id": student_id,
        "session_id": session_id,
        "plan": [],
        "plan_reasoning": "",
        "current_step": 0,
        "results": {},
        "agent_logs": [],
        "final_response": "",
        "hitl_pending": False,
        "hitl_payload": None,
        "memory_context": "",
        "error": None,
    }


def _run_chat(payload):
    query = (payload.get("query") or "").strip()
    if not query:
        return {"error": "Query cannot be empty."}, 400
    student_id = payload.get("student_id") or "S101"
    session_id = payload.get("session_id") or f"sess-{uuid.uuid4().hex[:8]}"
    start = time.time()
    result = POOL.submit(graph.invoke, _build_state(query, student_id, session_id)).result()
    plan = result.get("plan", [])
    return {
        "session_id": session_id,
        "query": query,
        "status": "success",
        "execution_time_seconds": round(time.time() - start, 3),
        "execution_graph": {
            "nodes": [{"id": f"step_{i}", "agent": s["agent"], "label": s["task"]} for i, s in enumerate(plan)],
            "edges": [{"from": f"step_{i}", "to": f"step_{i + 1}"} for i in range(max(0, len(plan) - 1))],
        },
        "final_markdown_response": result.get("final_response", ""),
        "agent_logs": result.get("agent_logs", []),
        "hitl_pending": result.get("hitl_pending", False),
        "hitl_payload": result.get("hitl_payload"),
        "mode": llm.mode,
    }, 200


def _run_rag(payload):
    query = (payload.get("query") or "").strip()
    if not query:
        return {"error": "Query cannot be empty."}, 400
    top_k = int(payload.get("top_k") or 3)
    results = rag_engine.search(query, top_k=top_k)
    return {"query": query, "results": results, "mode": "chromadb+bm25"}, 200


def _health():
    return {
        "status": "ok",
        "service": "agentx-agent-service",
        "llm_mode": llm.mode,
        "agents_loaded": len(AGENTS),
        "rag_documents": rag_engine.doc_count(),
        "students": len(db.STUDENTS),
        "events": len(db.EVENTS),
        "placements": len(db.PLACEMENTS),
    }, 200


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def log_message(self, fmt, *args):
        sys.stdout.write("[agent-service %s] %s\n" % (time.strftime("%H:%M:%S"), fmt % args))

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):  # noqa: N802
        try:
            if self.path == "/health" or self.path == "/":
                payload, status = _health()
                self._send(status, payload)
            else:
                self._send(404, {"error": "Not found."})
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": f"Server error: {exc}"})

    def do_POST(self):  # noqa: N802
        try:
            payload = self._read_body()
            if self.path == "/chat":
                payload, status = _run_chat(payload)
                self._send(status, payload)
            elif self.path == "/rag/search":
                payload, status = _run_rag(payload)
                self._send(status, payload)
            else:
                self._send(404, {"error": "Not found."})
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": f"Server error: {exc}"})


if __name__ == "__main__":
    print(f"AgentX agent-service listening on http://127.0.0.1:{PORT} (llm_mode={llm.mode})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
