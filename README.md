# AgentX 2026 — Smart Campus Multi-Agent AI System

A hackathon-grade multi-agent AI assistant for **Vasavi College of Engineering**. Ten specialized
agents autonomously plan, reason, call tools, retrieve from a RAG knowledge base, and stream their
live reasoning to a glassmorphic UI with five themes.

```
┌────────────────────────────────────────────────────────────────┐
│  User chat + live Agent Reasoning Trace (React 19 / Vite 6)    │
└───────────────────────────────┬────────────────────────────────┘
                                │  WebSocket (plan/tool/reason events)
┌───────────────────────────────▼────────────────────────────────┐
│  Orchestrator (LangGraph StateGraph)                           │
│    planner → executor(agent loop) → composer                   │
│    + conditional edges, retry-once, human-in-the-loop gate     │
└───────────────┬───────────────────────────┬────────────────────┘
                │ tool calls                │ context
┌───────────────▼───────────┐   ┌───────────▼────────────────────┐
│  10 Agents (typed tools)  │   │  RAG Engine                    │
│  Academic · Placement     │   │  ChromaDB (hash-embed, offline)│
│  Events · Services ·      │   │  + BM25 rerank · domain boost  │
│  Communication ·          │   │  + markdown policy docs        │
│  Knowledge · Notification │   │                                │
│  Wellness · Navigator ·   │   │  SQLite seed data (students,   │
│  Finance                  │   │  events, placements, transport)│
└───────────────┬───────────┘   └────────────────────────────────┘
```

## Features

- **Autonomous orchestration** — LLM (or deterministic fallback) plans steps; LangGraph routes
  each step to the right agent, runs tool calls, streams live reasoning events.
- **10 specialized agents** covering every mandated campus feature:
  - *Academic* (timetable, attendance, GPA, results), *Placement* (eligibility, interviews),
    *Events* (workshops/hackathons), *Student Services* (IDs, fee desk), *Communication*
    (makeup-exam email drafting), *Knowledge* (RAG over policy docs), *Notification*
    (reminders, calendar), *Wellness* (stress resources), *Navigator* (campus paths via BFS),
    *Finance* (budget planner).
- **Human-in-the-loop** — drafted emails and grievance tickets pause for explicit approve/reject.
- **User accounts** — simple username/password register + login with session tokens
  (PBKDF2-hashed passwords, bearer-token auth on the chat API and WebSocket). No OAuth required.
- **RAG** — offline vector store (ChromaDB, hash embeddings) + BM25 fallback; no model downloads.
- **Resilience** — retry-once on tool failure, graceful degradation to a readable fallback answer.
- **Live reasoning trace** — WebSocket streams `plan → agent_start → tool_call → tool_result →
  agent_end → final`; the trace panel shows reasoning, planned steps, and the live tool stream.
- **5 visual themes** — Midnight Aurora (default), Neo-Terminal, Vaporwave, Holo-Deck, Analog Console.

## Architecture

| Layer | Stack |
|---|---|
| Backend | Python 3.14 · FastAPI · Uvicorn · LangGraph · LangChain |
| LLM | Anthropic Claude (`ANTHROPIC_API_KEY`) with built-in deterministic planner fallback |
| RAG | ChromaDB (hash embeddings) · BM25 rerank · markdown section chunking |
| Data | SQLite (seeded) + markdown policy docs |
| Frontend | React 19 · Vite 6 · Tailwind v4 · Framer Motion · lucide-react · react-markdown |
| Realtime | FastAPI WebSocket → Vite proxy → React hook |

## Run it

### 1. Backend

```powershell
cd C:\Users\adaba\OneDrive\Documents\Agentx2
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

> Set `ANTHROPIC_API_KEY` in your environment to use Claude. Without it, the system runs in
> `deterministic` mode (no network, fully offline) — a rule-based planner covers all demo queries.

### 2. Frontend

```powershell
cd C:\Users\adaba\OneDrive\Documents\Agentx2\frontend
npm install        # first time only
npm run dev
```

Open **http://127.0.0.1:5173** — the Vite dev server proxies `/api` and `/ws` to the backend.

You'll land on a login screen. Demo account: username `student`, password `demo123`
(linked to student S101). Create your own account from the "Create account" tab and link any
student profile.

> Auth is required for `/api/chat`, `/api/hitl/respond`, and `/ws/chat`
> (`Authorization: Bearer <token>`; WebSocket takes `?token=`).

### (Optional) Discord notification webhook

Set `DISCORD_WEBHOOK_URL` to have the notification agent push calendar/reminder digests to Discord.

## Try these

- "Am I eligible for the Google internship? If yes, register me for the placement workshop, add it
  to my calendar, and remind me before it." *(multi-step orchestration)*
- "Summarize the exam regulations, calculate my attendance, and draft a makeup-exam email."
  *(RAG + email draft → HITL approval)*
- "Show today's classes, AI workshops, and ML clubs."
- "I'm overwhelmed with exams this week — any wellness resources?"
- "Where's the nearest ATM?" *(navigator BFS path)*
- "Can I afford a ₹5,000 hackathon trip?" *(finance budget)*

## Verify

- `scripts/smoke_test.py` — routes 13 query scenarios against the expected agents (in-process).
- `scripts/ws_test.py` — logs in, then asserts the authenticated WebSocket event stream contract.

## Repo layout

```
backend/
  main.py            FastAPI app (REST + WebSocket + HITL + auth endpoints)
  auth.py            username/password auth + session tokens (PBKDF2)
  core/              events (bus), graph (LangGraph), llm (Claude/deterministic), state
  agents/            base agent + 10 specialist agents + registry
  rag/               vector store + retrieval engine
  data/              SQLite loader + seed JSON + policy markdown docs
frontend/
  src/               React app (chat, trace panel, HITL modal, themes)
scripts/             smoke + websocket verification
```
