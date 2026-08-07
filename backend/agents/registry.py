"""Agent registry: maps agent names to their singleton instances and exposes
the union of all tool schemas for Claude tool calling."""

from typing import Dict, List

from backend.agents.academic import academic_agent
from backend.agents.communication import communication_agent
from backend.agents.events import events_agent
from backend.agents.finance import finance_agent
from backend.agents.knowledge import knowledge_agent
from backend.agents.navigator import navigator_agent
from backend.agents.notification import notification_agent
from backend.agents.placement import placement_agent
from backend.agents.services import services_agent
from backend.agents.wellness import wellness_agent

AGENTS: Dict[str, object] = {
    a.name: a
    for a in [
        academic_agent,
        placement_agent,
        events_agent,
        services_agent,
        communication_agent,
        knowledge_agent,
        notification_agent,
        wellness_agent,
        navigator_agent,
        finance_agent,
    ]
}

AGENT_ORDER = [
    "academic", "placement", "events", "services", "communication",
    "knowledge", "notification", "wellness", "navigator", "finance",
]


def all_tool_schemas() -> List[Dict]:
    schemas: List[Dict] = []
    for name in AGENT_ORDER:
        schemas.extend(AGENTS[name].tool_schemas)
    return schemas
