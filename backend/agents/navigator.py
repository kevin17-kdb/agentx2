"""Campus Navigator Agent: facility lookup and directions over a geo-JSON map."""

import math
import re
from typing import Any, Dict, List, Tuple

from backend.agents.base import BaseAgent, ToolResult
from backend.data import db

MAP = db.CAMPUS_MAP

FACILITY_ALIASES = {
    "atm": "atm", "cash": "atm", "money": "atm",
    "printer": "printer", "print": "printer", "photocopy": "printer",
    "cafeteria": "cafeteria", "canteen": "cafeteria", "food": "cafeteria", "coffee": "cafeteria",
    "medical": "medical", "doctor": "medical", "clinic": "medical",
    "gym": "gym", "sports": "gym", "workout": "gym",
    "library": "library", "books": "library",
    "auditorium": "auditorium",
    "free classroom": "free_classroom", "classroom": "free_classroom", "empty class": "free_classroom",
    "wifi": "wifi_help", "wi-fi": "wifi_help", "it helpdesk": "wifi_help", "internet": "wifi_help",
    "placement": "placement_cell",
    "hub": "innovation_hub", "innovation": "innovation_hub",
    "hostel": "hostel",
}


def _nearest_node(x: float, y: float) -> Tuple[str, Tuple[float, float]]:
    best, best_d = None, math.inf
    for nid, node in MAP["walkway_nodes"].items():
        d = (node["x"] - x) ** 2 + (node["y"] - y) ** 2
        if d < best_d:
            best, best_d = nid, d
    return best, (MAP["walkway_nodes"][best]["x"], MAP["walkway_nodes"][best]["y"])


def _path(start_nid: str, goal_nid: str) -> List[str]:
    """BFS over walkway graph."""
    graph: Dict[str, List[str]] = {}
    for a, b in MAP["walkways"]:
        graph.setdefault(a, []).append(b)
        graph.setdefault(b, []).append(a)
    from collections import deque
    q = deque([[start_nid]])
    seen = {start_nid}
    while q:
        path = q.popleft()
        node = path[-1]
        if node == goal_nid:
            return path
        for nb in graph.get(node, []):
            if nb not in seen:
                seen.add(nb)
                q.append(path + [nb])
    return [start_nid, goal_nid]


class NavigatorAgent(BaseAgent):
    name = "navigator"
    description = "Finds campus buildings, free classrooms, printers, ATMs with directions."
    color = "#38bdf8"
    glyph = "NV"

    # -- find_nearest ---------------------------------------------------------------
    def _find_nearest(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Find the nearest facility to the student's current location and give directions."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        query = (params.get("query") or "").lower()

        facility = None
        for key, val in FACILITY_ALIASES.items():
            if key in query:
                facility = val
                break
        if not facility:
            facility = "cafeteria"

        candidates = [b for b in MAP["buildings"] if b["id"] in MAP["facilities"].get(facility, [])]
        if not candidates:
            return ToolResult(
                data={"facility": facility, "found": False},
                summary=f"No campus facility matches '{facility}'.",
                markdown=f"#### 🧭 Campus Navigator\nCouldn't locate *{facility}* on the campus map.",
            )

        # Start from the student's hostel (or CS building for day scholars)
        start_id = "HOST_B" if student.get("hostel_resident") else "CS"
        start_building = next((b for b in MAP["buildings"] if b["id"] == start_id), MAP["buildings"][0])
        sx, sy = start_building["x"], start_building["y"]

        best = None
        for b in candidates:
            dist = math.hypot(b["x"] - sx, b["y"] - sy)
            if best is None or dist < best[0]:
                best = (dist, b)

        dist, target = best
        start_node, _ = _nearest_node(sx, sy)
        goal_node, _ = _nearest_node(target["x"], target["y"])
        path = _path(start_node, goal_node)
        step_count = max(0, len(path) - 1)
        walking = round(dist * 0.75 + step_count * 5, 0)  # rough walking-seconds model

        steps = ["Start from " + start_building["name"]]
        for i, nid in enumerate(path[1:], start=1):
            node = MAP["walkway_nodes"][nid]
            steps.append(f"Walk to waypoint {i} (grid {node['x']},{node['y']})")
        steps.append(f"Arrive at **{target['name']}** ({target['floor']})")

        return ToolResult(
            data={"facility": facility, "building": target, "distance_m": round(dist), "est_seconds": int(walking),
                  "path": path},
            summary=f"Nearest {facility} to {start_building['name']}: {target['name']}, ~{round(dist)}m away.",
            markdown=(
                f"#### 🧭 Campus Navigator\n"
                f"Nearest **{facility.replace('_', ' ')}**: **{target['name']}** — approx **{round(dist)} m** "
                f"({int(walking)}s walk) from {start_building['name']}.\n\n"
                + "\n".join(f"{i}. {s}" for i, s in enumerate(steps, start=1))
            ),
        )


NavigatorAgent.TOOLS = {
    "find_nearest": NavigatorAgent._find_nearest,
}

navigator_agent = NavigatorAgent()
