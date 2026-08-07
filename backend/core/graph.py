"""LangGraph orchestration engine.

Graph: START -> planner -> executor (loop) -> composer -> END

- planner    : LLM builds an autonomous task plan from the user query.
- executor   : runs the current plan step on its specialized agent (tool call),
               then conditionally loops until the plan is exhausted.
- composer   : merges all tool results into the final Markdown response and
               persists memory.

Every node streams structured events to the session's WebSocket so the UI can
render a live "agent reasoning trace".
"""

from typing import Any, Dict, List

from langgraph.graph import END, START, StateGraph

from backend.agents.registry import AGENTS
from backend.core.events import event_bus
from backend.core.llm import llm
from backend.core.state import AgentState
from backend.data import db


def _get_student(state: AgentState) -> dict:
    return db.get_student(state.get("student_id", "S101"))


def _memory_context(state: AgentState) -> str:
    session_id = state.get("session_id", "default")
    student_id = state.get("student_id", "S101")
    session = db.get_session_memory(session_id, limit=6)
    session_lines = [m["content"][:120] for m in session]
    long_term = db.summarize_user_memory(student_id)
    parts = []
    if session_lines:
        parts.append("Recent session: " + " | ".join(session_lines))
    if long_term:
        parts.append("Long-term: " + long_term[:300])
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------
def plan_node(state: AgentState) -> AgentState:
    session_id = state.get("session_id", "default")
    student = _get_student(state)

    ctx = _memory_context(state)
    plan = llm.plan(state.get("user_query", ""), student, ctx)
    steps = plan["steps"]

    event_bus.publish(session_id, {
        "type": "plan",
        "reasoning": plan["reasoning"],
        "steps": steps,
        "mode": llm.mode,
    })

    return {
        **state,
        "plan": steps,
        "plan_reasoning": plan["reasoning"],
        "current_step": 0,
        "results": {},
        "agent_logs": [],
    }


def execute_step(state: AgentState) -> AgentState:
    session_id = state.get("session_id", "default")
    idx = state.get("current_step", 0)
    step: Dict[str, Any] = state["plan"][idx]
    agent_name = step["agent"]
    agent = AGENTS.get(agent_name)

    event_bus.publish(session_id, {
        "type": "agent_start",
        "agent": agent_name,
        "glyph": getattr(agent, "glyph", ""),
        "color": getattr(agent, "color", "#94a3b8"),
        "task": step["task"],
    })

    results = dict(state.get("results") or {})
    logs = list(state.get("agent_logs") or [])

    if agent is None:
        result = {"status": "error", "summary": f"Unknown agent '{agent_name}'", "markdown": f"⚠️ Unknown agent `{agent_name}`."}
    else:
        tool_result = agent.run(state, step.get("task", ""), step.get("tool", ""), step.get("params", {}))
        result = {
            "status": tool_result.status,
            "summary": tool_result.summary,
            "markdown": tool_result.markdown,
            "data": tool_result.data,
            "requires_hitl": tool_result.requires_hitl,
        }
        if tool_result.requires_hitl:
            event_bus.publish(session_id, {"type": "hitl", "agent": agent_name, "payload": tool_result.data})
            result["hitl_payload"] = tool_result.data

    results[f"{agent_name}.{step.get('tool', '')}"] = result
    logs.append({"step": idx, "agent": agent_name, "tool": step.get("tool", ""), "task": step.get("task", ""),
                 "status": result["status"], "summary": result["summary"]})

    event_bus.publish(session_id, {
        "type": "agent_end",
        "agent": agent_name,
        "status": result["status"],
        "summary": result["summary"],
    })

    return {**state, "results": results, "agent_logs": logs, "current_step": idx + 1}


def route_after_step(state: AgentState) -> str:
    if state.get("current_step", 0) < len(state.get("plan", [])):
        return "more"
    return "compose"


def _section_header(section: str) -> str:
    # Fallback lead-in when an agent returns no markdown.
    if not section:
        return ""
    return section


def compose_node(state: AgentState) -> AgentState:
    session_id = state.get("session_id", "default")
    student = _get_student(state)
    query = state.get("user_query", "")
    steps = state.get("plan", [])
    results = state.get("results", {})
    logs = state.get("agent_logs", [])

    sections: List[str] = []
    hitl_any = False
    for step in steps:
        key = f"{step['agent']}.{step.get('tool', '')}"
        res = results.get(key)
        if not res:
            continue
        if res.get("markdown"):
            sections.append(res["markdown"])
        if res.get("requires_hitl"):
            hitl_any = True

    body = "\n\n---\n\n".join(sections)
    final = body if body else "*I processed your request but produced no structured answer. Please rephrase.*"

    if llm.mode == "claude":
        try:
            final = llm.backend.compose(query, state["plan"], results, student)
        except Exception:  # pragma: no cover - fall back to deterministic composition
            pass

    # Persist memory
    db.add_memory(session_id, student["id"], "user", query)
    summary = logs[-1]["summary"] if logs else final[:120]
    db.add_memory(session_id, student["id"], "assistant", summary[:400])
    profile = db.get_user_profile(student["id"])
    if not profile:
        db.upsert_user_profile(student["id"], student["name"], student.get("interests", []), {"lang": "en"})

    event_bus.publish(session_id, {
        "type": "final",
        "markdown": final,
        "execution_time_ms": None,
        "mode": llm.mode,
        "agent_count": len(set(l["agent"] for l in logs)),
        "steps_executed": len(steps),
    })

    return {
        **state,
        "final_response": final,
        "hitl_pending": hitl_any,
        "hitl_payload": next((r.get("hitl_payload") for r in results.values() if r.get("requires_hitl")), None),
    }


# ---------------------------------------------------------------------------
# Compile graph
# ---------------------------------------------------------------------------
_builder = StateGraph(AgentState)
_builder.add_node("planner", plan_node)
_builder.add_node("executor", execute_step)
_builder.add_node("composer", compose_node)
_builder.add_edge(START, "planner")
_builder.add_edge("planner", "executor")
_builder.add_conditional_edges(
    "executor",
    route_after_step,
    {"more": "executor", "compose": "composer"},
)
_builder.add_edge("composer", END)

graph = _builder.compile()
