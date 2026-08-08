"""
FastAPI server for the AgentX 2026 Smart Campus Multi-Agent AI System.

- POST /api/chat         : run the full multi-agent pipeline (non-streaming)
- WS   /ws/chat          : streaming chat with live agent reasoning trace
- POST /api/hitl/respond : human-in-the-loop approval (emails / grievances)
- GET  /api/*            : read-only data endpoints
"""

import asyncio
import json
import time
import uuid
from typing import Any, Dict, Optional

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend import auth
from backend.core.events import event_bus
from backend.core.graph import graph
from backend.core.llm import llm
from backend.data import db
from backend.rag.engine import rag_engine
from backend.agents.registry import AGENTS

app = FastAPI(
    title="AgentX 2026 — Smart Campus Multi-Agent AI System",
    description="Multi-agent AI system with autonomous planning, RAG, tool calling, agent memory, "
                "and workflow orchestration (Sarvepalli Radhakrishna Engineering College)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str
    student_id: Optional[str] = "S101"
    session_id: Optional[str] = None


class HITLRequest(BaseModel):
    action: str  # approve | reject
    draft_id: str
    session_id: Optional[str] = None


class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3


class RegisterRequest(BaseModel):
    username: str
    password: str
    student_id: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


def require_auth(authorization: Optional[str] = Header(default=None)) -> dict:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    else:
        token = None
    user = auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@app.post("/api/auth/register")
def register(req: RegisterRequest) -> Dict[str, Any]:
    try:
        user = auth.register_user(req.username, req.password, req.student_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    _, token = auth.authenticate(req.username, req.password)
    return {"username": user["username"], "student_id": user["student_id"], "token": token}


@app.post("/api/auth/login")
def login(req: LoginRequest) -> Dict[str, Any]:
    result = auth.authenticate(req.username, req.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    user, token = result
    return {"username": user["username"], "student_id": user["student_id"], "token": token}


@app.post("/api/auth/logout")
def logout(user: dict = Depends(require_auth), authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = authorization[7:].strip() if authorization else None
    auth.logout(token)
    return {"status": "logged_out"}


@app.get("/api/auth/me")
def me(user: dict = Depends(require_auth)) -> Dict[str, Any]:
    return {"username": user["username"], "student_id": user["student_id"]}


# ---------------------------------------------------------------------------
# Core chat (shared between REST and WebSocket)
# ---------------------------------------------------------------------------
def _build_state(query: str, student_id: str, session_id: str) -> Dict[str, Any]:
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
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


async def _run_graph(state: Dict[str, Any]) -> Dict[str, Any]:
    return await asyncio.to_thread(graph.invoke, state)


@app.post("/api/chat")
async def process_chat(req: ChatRequest, user: dict = Depends(require_auth)) -> Dict[str, Any]:
    student_id = req.student_id or user.get("student_id") or "S101"
    session_id = req.session_id or f"sess-{uuid.uuid4().hex[:8]}"
    state = _build_state(req.query, student_id, session_id)
    start = time.time()
    result = await _run_graph(state)
    return {
        "session_id": session_id,
        "query": req.query,
        "status": "success",
        "execution_time_seconds": round(time.time() - start, 3),
        "execution_graph": {
            "nodes": [{"id": f"step_{i}", "agent": s["agent"], "label": s["task"]} for i, s in enumerate(result.get("plan", []))],
            "edges": [{"from": f"step_{i}", "to": f"step_{i + 1}"} for i in range(max(0, len(result.get("plan", [])) - 1))],
        },
        "final_markdown_response": result.get("final_response", ""),
        "agent_logs": result.get("agent_logs", []),
        "hitl_pending": result.get("hitl_pending", False),
        "hitl_payload": result.get("hitl_payload"),
        "mode": llm.mode,
    }


# ---------------------------------------------------------------------------
# Streaming WebSocket
# ---------------------------------------------------------------------------
@app.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    user = auth.get_user(token)
    if not user:
        await websocket.close(code=4401, reason="Unauthorized")
        return
    session_id = websocket.query_params.get("session_id") or f"sess-{uuid.uuid4().hex[:8]}"
    await websocket.accept()
    q = event_bus.subscribe(session_id)

    async def send_buffer() -> None:
        for event in event_bus.drain(session_id, q):
            await websocket.send_json(event)

    async def pump_until(task: asyncio.Task) -> None:
        while not task.done():
            await send_buffer()
            await asyncio.sleep(0.02)
        await send_buffer()

    try:
        await websocket.send_json({"type": "ready", "session_id": session_id, "mode": llm.mode,
                                   "username": user.get("username")})
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "chat":
                query = data.get("query", "")
                student_id = data.get("student_id") or user.get("student_id") or "S101"
                # clear any stale buffered events from previous turns
                event_bus.drain(session_id, q)
                state = _build_state(query, student_id, session_id)
                task = asyncio.create_task(_run_graph(state))
                await pump_until(task)
                final = task.result()
                await websocket.send_json({"type": "complete", "session_id": session_id,
                                           "hitl_pending": final.get("hitl_pending", False)})
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json({"type": "error", "message": f"Unknown message type '{msg_type}'."})
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001
        try:
            await websocket.send_json({"type": "error", "message": f"Server error: {exc}"})
        except Exception:
            pass
    finally:
        event_bus.unsubscribe(session_id, q)


# ---------------------------------------------------------------------------
# HITL
# ---------------------------------------------------------------------------
@app.post("/api/hitl/respond")
async def hitl_respond(req: HITLRequest, user: dict = Depends(require_auth)) -> Dict[str, Any]:
    action = (req.action or "").lower()
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'.")

    session_id = req.session_id
    if session_id:
        event_bus.publish(session_id, {
            "type": "hitl_result",
            "draft_id": req.draft_id,
            "action": action,
        })

    if action == "approve":
        return {"status": "approved", "draft_id": req.draft_id,
                "message": f"{req.draft_id} approved and dispatched."}
    return {"status": "rejected", "draft_id": req.draft_id,
            "message": f"{req.draft_id} rejected; transmission cancelled."}


# ---------------------------------------------------------------------------
# Health & diagnostics
# ---------------------------------------------------------------------------
@app.get("/")
def read_root() -> Dict[str, Any]:
    return {
        "status": "online",
        "system": "AgentX 2026 — Smart Campus Multi-Agent AI System",
        "institution": "Sarvepalli Radhakrishna Engineering College",
        "version": "2.0.0",
        "llm_mode": llm.mode,
    }


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "llm_mode": llm.mode,
        "agents_loaded": len(AGENTS),
        "rag_documents": rag_engine.doc_count(),
        "students": len(db.STUDENTS),
        "events": len(db.EVENTS),
        "placements": len(db.PLACEMENTS),
    }


# ---------------------------------------------------------------------------
# Data endpoints
# ---------------------------------------------------------------------------
@app.get("/api/students")
def get_students() -> Dict[str, Any]:
    return {"students": list(db.STUDENTS.values())}


@app.get("/api/students/{student_id}")
def get_student_profile(student_id: str) -> Dict[str, Any]:
    profile = db.STUDENTS.get(student_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile


@app.get("/api/events")
def get_events() -> Dict[str, Any]:
    return {"events": db.EVENTS}


@app.get("/api/placements")
def get_placements() -> Dict[str, Any]:
    return {"placements": db.PLACEMENTS}


@app.get("/api/scholarships")
def get_scholarships() -> Dict[str, Any]:
    return {"scholarships": db.SCHOLARSHIPS}


@app.get("/api/transport")
def get_transport() -> Dict[str, Any]:
    return {"routes": db.TRANSPORT_ROUTES}


@app.get("/api/faqs")
def get_faqs() -> Dict[str, Any]:
    return {"faqs": db.FAQS}


@app.get("/api/map")
def get_map() -> Dict[str, Any]:
    return {"map": db.CAMPUS_MAP}


@app.get("/api/grievances")
def get_grievances() -> Dict[str, Any]:
    return {"grievances": db.list_grievances()}


@app.post("/api/rag/search")
def rag_search(req: RAGQueryRequest) -> Dict[str, Any]:
    results = rag_engine.search(req.query, top_k=req.top_k)
    return {"query": req.query, "results": results, "mode": "chromadb+bm25"}


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
