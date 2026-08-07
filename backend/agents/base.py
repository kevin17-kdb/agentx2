"""Base agent machinery: tool dispatch, streaming events, retry + graceful
degradation, and Claude tool-calling support.
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from backend.core.events import event_bus


@dataclass
class ToolResult:
    status: str = "success"                     # success | error | requires_approval
    data: Dict[str, Any] = field(default_factory=dict)
    summary: str = ""
    markdown: str = ""
    requires_hitl: bool = False
    error: Optional[str] = None


class ToolFailure(Exception):
    pass


class BaseAgent:
    name: str = "base"
    description: str = ""
    color: str = "#94a3b8"
    glyph: str = "AG"
    tool_schemas: List[Dict[str, Any]] = []

    # Tool registry: name -> handler(state, params) -> ToolResult
    TOOLS: Dict[str, Callable[[Dict[str, Any], Dict[str, Any]], ToolResult]] = {}

    def __init__(self) -> None:
        # Bind the unbound handlers defined at class level to this instance.
        self.tools = {name: fn.__get__(self, type(self)) for name, fn in self.TOOLS.items()}
        self._build_schemas()

    def _build_schemas(self) -> None:
        if self.tool_schemas:
            return
        for name, handler in self.tools.items():
            doc = (handler.__doc__ or "").strip().split("\n")[0]
            params = getattr(handler, "_params_schema", {"type": "object", "properties": {}})
            self.tool_schemas.append({
                "name": f"{self.name}_{name}",
                "description": doc or f"Run the {name} tool of the {self.name} agent.",
                "input_schema": params,
            })

    # ------------------------------------------------------------------
    def _emit(self, session_id: str, event: Dict[str, Any]) -> None:
        event_bus.publish(session_id, event)

    def run(self, state: Dict[str, Any], task: str, tool: str, params: Dict[str, Any]) -> ToolResult:
        """Execute one tool call with retry-once and graceful degradation."""
        session_id = state.get("session_id", "default")

        if tool not in self.tools:
            return self._degrade(state, task, tool, params, f"Unknown tool '{tool}'")

        self._emit(session_id, {
            "type": "tool_call",
            "agent": self.name,
            "tool": tool,
            "args": params,
            "task": task,
        })

        for attempt in range(2):
            try:
                result = self.tools[tool](state, params)
                self._emit(session_id, {
                    "type": "tool_result",
                    "agent": self.name,
                    "tool": tool,
                    "summary": result.summary,
                    "status": result.status,
                    "markdown": result.markdown,
                })
                return result
            except ToolFailure as exc:
                if attempt == 0:
                    self._emit(session_id, {
                        "type": "error",
                        "agent": self.name,
                        "message": f"Tool '{tool}' failed: {exc}. Retrying once.",
                        "retry": True,
                    })
                    continue
                return self._degrade(state, task, tool, params, str(exc))
            except Exception as exc:  # noqa: BLE001
                if attempt == 0:
                    continue
                return self._degrade(state, task, tool, params, str(exc))

        return self._degrade(state, task, tool, params, "Unexpected failure")

    def _degrade(self, state: Dict[str, Any], task: str, tool: str, params: Dict[str, Any],
                 reason: str) -> ToolResult:
        """Graceful fallback so a single tool failure never crashes the flow."""
        session_id = state.get("session_id", "default")
        self._emit(session_id, {
            "type": "error",
            "agent": self.name,
            "message": f"Tool '{tool}' could not complete: {reason}. Degrading gracefully.",
            "degraded": True,
        })
        return ToolResult(
            status="error",
            summary=f"{self.name} could not complete '{tool}': {reason}",
            markdown=f"⚠️ *{self.name}* hit a snag running `{tool}` — **{reason}**. "
                     "The rest of the plan continues unaffected.",
            error=reason,
        )
