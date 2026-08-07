import { writeFileSync, rmSync } from "node:fs";

const BASE = process.env.API_URL || "http://127.0.0.1:5000";

let failures = 0;
const pass = (name, extra = "") => {
  console.log(`  \x1b[32m✓\x1b[0m ${name}${extra ? ` — ${extra}` : ""}`);
};
const fail = (name, err) => {
  failures += 1;
  console.log(`  \x1b[31m✗\x1b[0m ${name} — ${err?.message ?? err}`);
};

async function req(method, path, { token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json };
}

const CHECKLIST = {
  health: () => req("GET", "/api/health"),
  loginAdmin: () =>
    req("POST", "/api/auth/login", { body: { username: "admin", password: "admin123" } }),
  loginKevin: () =>
    req("POST", "/api/auth/login", { body: { username: "kevin", password: "kevin123" } }),
  loginEmily: () =>
    req("POST", "/api/auth/login", { body: { username: "emily", password: "emily123" } }),
  loginMessi: () =>
    req("POST", "/api/auth/login", { body: { username: "messi", password: "messi123" } }),
  badLogin: () =>
    req("POST", "/api/auth/login", { body: { username: "kevin", password: "wrong" } }),
  me: (t) => req("GET", "/api/auth/me", { token: t }),
  chat: (t) =>
    req("POST", "/api/chat", {
      token: t,
      body: {
        query: "Am I eligible for the Google internship? If yes register me for the placement workshop, add it to my calendar, and remind me before it.",
        session_id: "verify-session",
      },
    }),
  rag: (t) =>
    req("POST", "/api/rag/search", { token: t, body: { query: "attendance policy", top_k: 2 } }),
  hitl: (t) =>
    req("POST", "/api/chat", {
      token: t,
      body: { query: "File a grievance about the wifi in my hostel.", session_id: "verify-hitl" },
    }),
  respond: (t) =>
    req("POST", "/api/chat/respond", {
      token: t,
      body: { action: "approve", draft_id: "DRAFT-VERIFY", session_id: "verify-hitl" },
    }),
  garbageToken: () => req("GET", "/api/auth/me", { token: "garbage.token.here" }),
};

console.log(`\nAgentX 2026 API verification against ${BASE}\n`);

const h = await CHECKLIST.health();
if (h.status === 200 && h.json?.status === "ok" && h.json?.agentService === "up") {
  pass("GET /api/health", `agentService=${h.json.agentService}, agents=${h.json.agent?.agents_loaded}`);
} else {
  fail("GET /api/health", JSON.stringify(h));
  writeFileSync("verify-result.json", JSON.stringify({ ok: false }, null, 2));
  process.exit(1);
}

for (const name of ["loginAdmin", "loginKevin", "loginEmily", "loginMessi"]) {
  const { status, json } = await CHECKLIST[name]();
  if (status === 200 && json?.token && json?.user) pass(name, `studentId=${json.user.studentId}`);
  else fail(name, `${status} ${JSON.stringify(json)}`);
}

const login = await CHECKLIST.loginKevin();
const tok = login.json.token;

const bad = await CHECKLIST.badLogin();
if (bad.status === 401 && bad.json?.error?.code === "INVALID_CREDENTIALS") pass("wrong password → 401");
else fail("wrong password → 401", `${bad.status} ${JSON.stringify(bad.json)}`);

const gt = await CHECKLIST.garbageToken();
if (gt.status === 401 && gt.json?.error?.code === "TOKEN_EXPIRED") pass("garbage token → TOKEN_EXPIRED");
else fail("garbage token → TOKEN_EXPIRED", `${gt.status} ${JSON.stringify(gt.json)}`);

const noTok = await req("GET", "/api/auth/me");
if (noTok.status === 401 && noTok.json?.error?.code === "UNAUTHORIZED") pass("no token → 401");
else fail("no token → 401", `${noTok.status} ${JSON.stringify(noTok.json)}`);

const me = await CHECKLIST.me(tok);
if (me.status === 200 && me.json?.user?.username === "kevin") pass("GET /api/auth/me", me.json.user.studentId);
else fail("GET /api/auth/me", `${me.status} ${JSON.stringify(me.json)}`);

const chat = await CHECKLIST.chat(tok);
if (
  chat.status === 200 &&
  chat.json?.status === "success" &&
  chat.json?.final_markdown_response &&
  Array.isArray(chat.json?.execution_graph?.nodes) &&
  chat.json?.student_id === "S101"
) {
  pass("POST /api/chat (scenario)", `steps=${chat.json.execution_graph.nodes.length}, final_len=${chat.json.final_markdown_response.length}, JWT overrides student_id`);
} else {
  fail("POST /api/chat (scenario)", `${chat.status} ${JSON.stringify(chat.json)}`);
}

const rag = await CHECKLIST.rag(tok);
if (rag.status === 200 && Array.isArray(rag.json?.results) && rag.json.results.length > 0) {
  pass("POST /api/rag/search", `${rag.json.results.length} citations, top score=${rag.json.results[0].relevance_score?.toFixed?.(3)}`);
} else {
  fail("POST /api/rag/search", `${rag.status} ${JSON.stringify(rag.json)}`);
}

const hitl = await CHECKLIST.hitl(tok);
if (hitl.status === 200 && hitl.json?.hitl_pending && hitl.json?.hitl_payload?.ticket_id) {
  pass("HITL surfaced", `${hitl.json.hitl_payload.ticket_id} (SLA ${hitl.json.hitl_payload.expected_sla})`);
  const respond = await CHECKLIST.respond(tok);
  if (respond.status === 200 && respond.json?.status === "approved") pass("POST /api/chat/respond", "approved & dispatched");
  else fail("POST /api/chat/respond", `${respond.status} ${JSON.stringify(respond.json)}`);
} else {
  fail("HITL surfaced", `${hitl.status} ${JSON.stringify(hitl.json)}`);
}

const result = { ok: failures === 0, timestamp: new Date().toISOString() };
writeFileSync("verify-result.json", JSON.stringify(result, null, 2));
console.log(`\n${failures === 0 ? "\x1b[32mALL CHECKS PASSED\x1b[0m" : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`}\n`);
rmSync("verify-result.json", { force: true });
process.exit(failures === 0 ? 0 : 1);
