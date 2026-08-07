"""Events Agent: workshops, hackathons, club discovery, registration."""

from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult, ToolFailure
from backend.data import db


class EventsAgent(BaseAgent):
    name = "events"
    description = "Discovers workshops/hackathons, registers students, suggests clubs."
    color = "#a78bfa"
    glyph = "EV"

    def _match_events(self, query: str) -> list:
        q = query.lower()
        hits = [e for e in db.EVENTS if q in " ".join(e.get("tags", [])).lower() or q in e["title"].lower()
                or q in e["category"].lower() or q in e["organizer"].lower()]
        return hits or db.EVENTS

    # -- discover_events ------------------------------------------------------
    def _discover_events(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Discover workshops and events matching a topic keyword."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        topic = params.get("topic", "AI")
        events = self._match_events(topic)
        lines = "\n".join(
            f"- **{e['title']}** · {e['date']} | {e['time']} · *{e['location']}* · {e['seats_left']} seats left"
            for e in events
        )
        return ToolResult(
            data={"student": student["name"], "topic": topic, "workshops": events},
            summary=f"Found {len(events)} events matching '{topic}'.",
            markdown=f"#### 🚀 Events & Workshops ({topic})\n{lines}",
        )

    # -- suggest_clubs --------------------------------------------------------
    def _suggest_clubs(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Suggest campus clubs matching the student's interests."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        interests = [str(i).lower() for i in params.get("interests", student.get("interests", []))]
        scored = []
        for club in db.CLUBS:
            focus = " ".join(club["focus"]).lower()
            score = sum(1 for i in interests if i in focus or any(f in i for f in club["focus"]))
            if club["name"].lower() in " ".join(interests):
                score += 1
            scored.append((score, club))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = [c for s, c in scored if s > 0][:3] or [c for _, c in scored[:3]]
        lines = "\n".join(f"- **{c['name']}** — focus: {', '.join(c['focus'])} · contact {c['contact']}" for c in top)
        return ToolResult(
            data={"student": student["name"], "clubs": top},
            summary=f"Suggested {len(top)} clubs for {student['name']} based on interests.",
            markdown=f"#### 🤝 Clubs Matched to Your Interests\n{lines}",
        )

    # -- register_workshop ----------------------------------------------------
    def _register_workshop(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Register the student for the placement prep workshop."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        event = db.get_event_by_id("EVT-101") or db.EVENTS[0]
        if event["seats_left"] <= 0:
            raise ToolFailure("Workshop is fully booked.")
        reg = db.add_registration(student["id"], event["id"], event["title"])
        return ToolResult(
            data={"registration_id": reg["reg_code"], "event_title": event["title"], "event_date": event["date"],
                  "event_time": event["time"], "location": event["location"], "seat": "Seat B-42"},
            summary=f"Registered {student['name']} for '{event['title']}' ({reg['reg_code']}).",
            markdown=(
                f"#### ✅ Workshop Registration Confirmed\n"
                f"- **Event**: {event['title']}\n- **When**: {event['date']} | {event['time']}\n"
                f"- **Where**: {event['location']}\n- **Confirmation**: `{reg['reg_code']}`"
            ),
        )

    # -- register_event ---------------------------------------------------------
    def _register_event(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Register the student for a named event."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        query = (params.get("query") or "").lower()
        event = next((e for e in db.EVENTS if query in e["title"].lower() or query in e["category"].lower()), db.EVENTS[0])
        if event["seats_left"] <= 0:
            raise ToolFailure(f"'{event['title']}' is fully booked.")
        reg = db.add_registration(student["id"], event["id"], event["title"])
        return ToolResult(
            data={"registration_id": reg["reg_code"], "event_title": event["title"], "event_date": event["date"]},
            summary=f"Registered {student['name']} for '{event['title']}' ({reg['reg_code']}).",
            markdown=f"#### ✅ Registered for {event['title']}\nConfirmation `{reg['reg_code']}` on {event['date']}.",
        )


EventsAgent.TOOLS = {
    "discover_events": EventsAgent._discover_events,
    "suggest_clubs": EventsAgent._suggest_clubs,
    "register_workshop": EventsAgent._register_workshop,
    "register_event": EventsAgent._register_event,
}

events_agent = EventsAgent()
