"""Communication & Calendar Agent: email drafts (HITL), calendar, greeting."""

from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.core.events import event_bus
from backend.data import db


class CommunicationAgent(BaseAgent):
    name = "communication"
    description = "Drafts emails, adds calendar events, coordinates appointments."
    color = "#fb7185"
    glyph = "CM"

    # -- greet -----------------------------------------------------------------
    def _greet(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Greet the student and summarize the system's capabilities."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        return ToolResult(
            data={"student": student["name"]},
            summary=f"Greeted {student['name']} with a capability menu.",
            markdown=(
                f"Hey **{student['name']}** 👋\n\n"
                "I'm your **Smart Campus Multi-Agent System** — 10 specialized agents working together "
                "with autonomous planning, RAG, tool calling, and memory.\n\n"
                "**Try asking me about:**\n"
                "- 🎯 Internship **eligibility** (Google / Microsoft) + workshop registration + calendar + reminders\n"
                "- 📋 **Exam regulations**, attendance calculation, makeup-exam email\n"
                "- 📅 **Today's classes**, AI workshops, ML clubs\n"
                "- 🏨 Hostel, scholarships, transport, **grievances**\n"
                "- 🧭 Nearest ATM / free classroom, finance & fee help\n"
                "- 💜 Stress overload support (try: *\"I'm overwhelmed this week\"*)\n"
                "- 🎓 Personalized electives / resume analysis"
            ),
        )

    # -- acknowledge -------------------------------------------------------------
    def _acknowledge(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Acknowledge a polite message."""
        return ToolResult(
            data={},
            summary="Acknowledged the student.",
            markdown="You're welcome! Anything else I can help with?",
        )

    # -- recall_memory -------------------------------------------------------------
    def _recall_memory(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Recall recent session memory to continue a previous task."""
        session_id = state.get("session_id", "default")
        mem = db.get_session_memory(session_id, limit=4)
        lines = "\n".join(f"- You said: *{m['content'][:90]}*" for m in mem if m["role"] == "user")
        return ToolResult(
            data={"memory": mem},
            summary=f"Recalled {len(mem)} recent session messages.",
            markdown=f"🧠 **Memory active** — here's what I remember from this session:\n{lines}\n\nGo ahead, tell me what to continue.",
        )

    # -- add_calendar_event ----------------------------------------------------------
    def _add_calendar_event(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Add an event to the student's calendar."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        event = db.get_event_by_id("EVT-101") or db.EVENTS[0]
        title = params.get("event_title", event["title"])
        date = params.get("date", event["date"])
        time = params.get("time", event["time"])
        ev = db.add_calendar_event(student["id"], title, date, time, "Event")
        return ToolResult(
            data={"event_id": ev["id"], "title": title, "date": date, "time": time,
                  "calendar": f"{student['name']}'s campus calendar"},
            summary=f"Added '{title}' to {student['name']}'s calendar for {date} at {time}.",
            markdown=f"#### 📅 Calendar Synced\nAdded **{title}** on {date} at {time} to your campus calendar.",
        )

    # -- draft_email ----------------------------------------------------------------
    def _draft_email(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Draft a formal email for the student (requires human approval to send)."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        kind = params.get("kind", "makeup_exam")

        if kind == "makeup_exam":
            recipient = "Dean of Examinations <examdean@srec.ac.in>"
            subject = f"Request for Makeup Examination — {student['name']} ({student['roll_number']})"
            body = (
                f"Dear Dean of Examinations,\n\n"
                f"I am writing to formally request permission to appear for a makeup examination.\n\n"
                f"Student Details:\n- Name: {student['name']}\n- Roll Number: {student['roll_number']}\n"
                f"- Branch: {student['branch_full']} (Year {student['year']})\n- CGPA: {student['gpa']}\n\n"
                f"Reason: I missed the scheduled examination due to a sanctioned placement orientation "
                f"collision, as per Section 4.4 of the Academic Regulations. My attendance stands at "
                f"{student['attendance_percentage']}%.\n\n"
                f"I request your kind approval to appear for a makeup examination.\n\n"
                f"Sincerely,\n{student['name']}\nContact: {student['email']}"
            )
        else:
            recipient = params.get("recipient", "Office <office@srec.ac.in>")
            subject = params.get("subject", "Official Correspondence")
            body = params.get("body", "Dear Sir/Madam,\n\nPlease find attached my request.\n\nThank you,\n" + student["name"])

        draft_id = f"DRAFT-{abs(hash(subject + student['id'])) % 900000 + 100000}"
        payload = {"draft_id": draft_id, "recipient": recipient, "subject": subject, "body": body,
                   "student_name": student["name"]}
        event_bus.publish(state.get("session_id", "default"), {"type": "hitl", "agent": self.name, "payload": payload})
        return ToolResult(
            status="requires_approval",
            requires_hitl=True,
            data=payload,
            summary=f"Drafted email to {recipient}. Waiting for human approval.",
            markdown=(
                f"#### ✉️ Email Draft Ready for Approval\n"
                f"- **To**: {recipient}\n- **Subject**: {subject}\n\n"
                f"```text\n{body}\n```\n\n*Approve below to send it.*"
            ),
        )


CommunicationAgent.TOOLS = {
    "greet": CommunicationAgent._greet,
    "acknowledge": CommunicationAgent._acknowledge,
    "recall_memory": CommunicationAgent._recall_memory,
    "add_calendar_event": CommunicationAgent._add_calendar_event,
    "draft_email": CommunicationAgent._draft_email,
}

communication_agent = CommunicationAgent()
