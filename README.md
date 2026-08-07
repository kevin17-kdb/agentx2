# AgentX 2026 — Smart Campus Multi-Agent AI System

A hackathon-grade multi-agent AI assistant for **Vasavi College of Engineering**, migrated to a
**MERN stack** (v2). Ten specialized agents autonomously plan, reason, call tools, and retrieve from
a RAG knowledge base; a React client renders the chat, live reasoning trace, human-in-the-loop
approvals, and a 3D-tilt login page.

```
┌────────────────────────────────────────────────────────────────┐
│  React client (Vite) — chat · reasoning trace · HITL · 3D login│
└───────────────────────────────┬────────────────────────────────┘
                                │  REST (buffered JSON, no WS)
┌───────────────────────────────▼────────────────────────────────┐
│  Express + Mongoose API (server/)                              │
│   auth (JWT+bcrypt) · rate limits · proxy to agent service     │
│   MongoDB (in-memory fallback + auto-seed demo users)          │
└───────────────┬───────────────────────────┬────────────────────┘
                │ HTTP                         │ HTTP
┌───────────────▼───────────┐   ┌─────────────▼──────────────────┐
│  agent-service/           │   │  backend/ (v1 engine, reused)  │
│  zero-dep stdlib HTTP     │   │  LangGraph orchestrator        │
│  wrapper on :8100         │   │  10 agents · RAG (hash emb)    │
└───────────────────────────┘   └────────────────────────────────┘
```

## Quick start

Prereqs: Node 20+ (v25 used here), Python 3.12+.

```powershell
# 1. install dependencies
npm install                       # root (concurrently)
npm --prefix server install
npm --prefix client install

# 2. environment — server fails fast without these
Copy-Item server\.env.example server\.env   # then set JWT_SECRET (server/.env already committed for dev)

# 3. run everything (agent :8100 · api :5000 · ui :5173)
npm run dev
```

Open **http://127.0.0.1:5173**. Demo accounts (auto-seeded when the DB is empty):

| username | password  | student | role |
|---|---|---|---|
| `admin`  | `admin123` | S102 | admin |
| `kevin`  | `kevin123` | S101 | student |
| `emily`  | `emily123` | S103 | student |
| `messi`  | `messi123` | S104 | student |

### Alternative: Docker

```powershell
docker compose up --build
```

The agent service needs no model downloads (deterministic mode). If you set `MONGO_URI`, the server
uses that database; otherwise it spins up an in-memory MongoDB via `mongodb-memory-server` and seeds
the four demo users on boot.

## Verify

```powershell
npm run verify        # 13 end-to-end API checks (login, auth shapes, chat trace, RAG, HITL)
```

Also in `server/`: the API degrades gracefully — with the agent service down, `/api/chat` returns
`503 {error:{code:"AGENT_SERVICE_UNAVAILABLE"}}` and `/api/health` reports `agentService:"down"`.

## Architecture

| Layer | Stack |
|---|---|
| Client | React 19 · Vite 6 · react-router-dom 7 · axios · react-markdown · 3D-tilt login (CSS-only) |
| API | Express · Mongoose 8 · JWT (`jsonwebtoken`) · bcryptjs · express-rate-limit · CORS allowlist |
| DB | MongoDB (`mongodb-memory-server` fallback) · auto-seeded demo users |
| Agent engine | `agent-service/` — zero-dependency stdlib HTTP wrapper around `backend/` (LangGraph, 10 agents, RAG) |
| Orchestrator | LangGraph StateGraph: planner → executor → composer, retry-once, HITL gate |
| RAG | ChromaDB (hash embeddings) · BM25 rerank · markdown policy docs, all offline |

### The 10 agents

Academic · Placement · Events · Student Services · Communication · Knowledge · Notification ·
Wellness · Navigator · Finance.

### API surface

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` · `POST /api/auth/register` · `POST /api/auth/logout` | JWT auth (bcrypt-hashed) |
| `GET /api/auth/me` | Current user (bootstrap / session restore) |
| `POST /api/chat` | Buffered agent run (trace + `final_markdown_response`; HITL surfaced via `hitl_pending`/`hitl_payload`) |
| `POST /api/chat/respond` | Human decision on a pending draft (`approve`/`reject`) |
| `POST /api/rag/search` | Corpus search with citations |
| `GET /api/health` | Service + agent health |

Errors are always `{error:{code,message}}` — e.g. `INVALID_CREDENTIALS`, `USERNAME_TAKEN`,
`TOKEN_EXPIRED` (client redirects to `/login`), `AGENT_SERVICE_UNAVAILABLE`.

## Try these

- "Am I eligible for the Google internship? If yes, register me for the placement workshop, add it
  to my calendar, and remind me before it." *(multi-step orchestration)*
- "Summarize the exam regulations, calculate my attendance, and draft a makeup-exam email."
  *(RAG + email draft → HITL approval)*
- "Show today's classes, AI workshops, and ML clubs."
- "I'm overwhelmed with exams this week — any wellness resources?"
- "Where's the nearest ATM?" *(navigator BFS path)*
- "Can I afford a ₹5,000 hackathon trip?" *(finance budget)*
- "File a grievance about the wifi in my hostel." *(HITL ticket, 48h SLA)*

## Repo layout

```
package.json            root scripts (concurrently: npm run dev / verify)
docker-compose.yml      full stack (agent + api + ui)
.env.example            shared environment reference
scripts/verify.js       13-check end-to-end API verification
agent-service/          zero-dep HTTP wrapper on :8100 (api.py) + Dockerfile
server/                 Express + Mongoose API (:5000), auto-seed, in-memory Mongo
client/                 React 19 + Vite UI (:5173), proxy /api → :5000
backend/                v1 engine (LangGraph + 10 agents + RAG) — tagged v1-stable
frontend/               v1 React/Tailwind/Framer UI (fallback) — tagged v1-stable
```

## Notes

- **Environment**: the server fails fast without `JWT_SECRET` and `PORT`. Copy `server/.env.example` to
  `server/.env` (`.env` files are gitignored — never commit credentials).
- **Windows**: run the agent service from the repo root (`python agent-service/api.py`) so `backend`
  imports resolve; prefix `PYTHONIOENCODING=utf-8` for Python output.
- **HITL**: v2 surfaces drafts/tickets from the buffered response (`hitl_pending` +
  `hitl_payload`) rather than separate re-approval endpoints; dispatch is recorded via
  `POST /api/chat/respond` (a stub in buffered mode).
