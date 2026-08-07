"""Wellness Agent: detects stress/overload and responds with support."""

import re
from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.data import db

STRESS_SIGNALS = {
    "high": ["can't handle", "cant handle", "overwhelm", "burnt out", "burnout", "burn out", "too many",
             "too much", "deadline", "anxious", "panic", "giving up", "stressed", "pressure", "exhaust"],
    "medium": ["tired", "sleep", "worried", "worried about", "worried", "backlog", "exam", "worried",
               "can't focus", "cant focus", "burn"],
}

BREAK_SUGGESTIONS = [
    "Try the 90/15 rule: focus for 90 minutes, then take a 15-minute walk or stretch break.",
    "Use the campus fitness complex for low-intensity activity — it measurably reduces exam-week stress.",
    "The Central Library AV room hosts free stress-management workshops monthly — worth a visit.",
    "Keep 7 hours of sleep during exam weeks; your retention will thank you.",
]


class WellnessAgent(BaseAgent):
    name = "wellness"
    description = "Detects stress/overload signals and suggests breaks, resources, and counseling."
    color = "#2dd4bf"
    glyph = "WL"

    # -- assess_workload ----------------------------------------------------------
    def _assess_workload(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Assess stress/overload signals in the student's message and recommend support."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        query = (params.get("query") or "").lower()

        level = "low"
        for sig in STRESS_SIGNALS["high"]:
            if sig in query:
                level = "high"
                break
        if level == "low":
            for sig in STRESS_SIGNALS["medium"]:
                if sig in query:
                    level = "medium"
                    break

        exams = student.get("upcoming_exams", [])
        load = min(10, len(exams) * 2)

        if level == "high":
            message = (
                f"I hear you, {student['name']} — juggling **{len(exams)} upcoming assessment(s)** with everything "
                f"else sounds genuinely heavy. You don't have to push through this alone."
            )
        elif level == "medium":
            message = (
                f"Thanks for checking in, {student['name']}. A little stress before exams is normal — "
                f"let's make sure it doesn't tip into overload."
            )
        else:
            message = (
                f"Hi {student['name']} — I'm here to help you keep a healthy rhythm this semester. "
                f"Even when things feel calm, a bit of structure helps."
            )

        resources = [
            "Student Wellness Center, 10 AM - 5 PM, Mon-Sat (free & confidential)",
            "24x7 helpline: +91 90000 12345",
            "Peer support group: every Friday, Wellness Center",
        ]
        suggested_break = BREAK_SUGGESTIONS[0]

        return ToolResult(
            data={"level": level, "load_score": load, "exams": exams, "resources": resources},
            summary=f"Wellness check for {student['name']}: stress level {level}, load {load}/10.",
            markdown=(
                f"#### 💜 Wellness Check — {student['name']}\n\n{message}\n\n"
                f"- **Detected signals**: `{level}` stress / load {load}/10\n"
                f"- **Suggestion**: {suggested_break}\n\n"
                f"**Support resources:**\n" + "\n".join(f"- {r}" for r in resources) +
                "\n\n> You can also ask me to *\"reschedule a deadline\"* or file an *overload note* to your mentor."
            ),
        )

    # -- wellness_tips ---------------------------------------------------------------
    def _wellness_tips(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Return practical wellness tips and campus resources."""
        tips = "\n".join(f"- {t}" for t in BREAK_SUGGESTIONS)
        return ToolResult(
            data={"tips": BREAK_SUGGESTIONS},
            summary="Provided wellness tips.",
            markdown=f"#### 🌿 Wellness Tips\n{tips}",
        )


WellnessAgent.TOOLS = {
    "assess_workload": WellnessAgent._assess_workload,
    "wellness_tips": WellnessAgent._wellness_tips,
}

wellness_agent = WellnessAgent()
