"""Typed state passed through the orchestration graph."""

from typing import Any, Dict, List, Optional, TypedDict


class AgentState(TypedDict, total=False):
    # Request context
    user_query: str
    student_id: str
    session_id: str

    # Orchestrator planning output
    plan: List[Dict[str, Any]]            # [{agent, task, args}]
    plan_reasoning: str                    # why this plan was chosen
    current_step: int

    # Accumulated results + live trace
    results: Dict[str, Any]                # agent name -> result
    agent_logs: List[Dict[str, Any]]       # streamed trace events
    final_response: str

    # Human-in-the-loop
    hitl_pending: bool
    hitl_payload: Optional[Dict[str, Any]]

    # Memory
    memory_context: str
    error: Optional[str]
