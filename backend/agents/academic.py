"""Academic Agent: timetables, attendance, exams, electives."""

import math
from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult, ToolFailure
from backend.data import db


def _params_schema(props: Dict[str, Any]) -> Dict[str, Any]:
    return {"type": "object", "properties": props, "additionalProperties": False}


class AcademicAgent(BaseAgent):
    name = "academic"
    description = "Handles timetables, attendance, exam schedules, and elective recommendations."
    color = "#22d3ee"
    glyph = "AC"

    # -- get_timetable ------------------------------------------------------
    def _get_timetable(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Fetch the student's class timetable for a given day."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        day = params.get("day", "Today")
        key = f"{student['branch']}-{student['year']}"
        table = db.TIMETABLES.get(key, db.TIMETABLES["CSE-3"]).get(day, db.TIMETABLES["CSE-3"]["Today"])
        lines = "\n".join(f"- **{item['time']}**: {item['subject']} *(Room: {item['room']})*" for item in table)
        return ToolResult(
            data={"student": student["name"], "branch": student["branch_full"], "day": day, "schedule": table},
            summary=f"Retrieved {day}'s schedule ({len(table)} classes) for {student['name']}.",
            markdown=f"#### 📖 {day}'s Classes — {student['branch_full']} (Year {student['year']})\n{lines}",
        )

    # -- calculate_attendance ------------------------------------------------
    def _calculate_attendance(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Compute the student's attendance percentage, eligibility, and projections."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        attended = student["attended_classes"]
        total = student["total_classes"]
        pct = student["attendance_percentage"]
        threshold = 75.0
        condonation = 65.0

        # Classes required to reach the threshold
        if pct < threshold:
            needed = math.ceil((threshold / 100 * total - attended) / (threshold / 100)) if attended < threshold / 100 * total else 0
        else:
            # Classes that can be missed while staying above threshold
            safe_miss = math.floor((attended - threshold / 100 * total) / (threshold / 100))
            needed = -safe_miss  # negative means buffer

        status = "Eligible" if pct >= threshold else ("Condonation Eligible" if pct >= condonation else "Detained")
        # Projection if they skip the next 5 classes
        proj = round(attended / (total + 5) * 100, 2)

        return ToolResult(
            data={
                "student_name": student["name"],
                "current_attendance": f"{pct}% ({attended}/{total} classes)",
                "status": status,
                "threshold": f"{threshold}%",
                "condonation_threshold": f"{condonation}%",
                "projection_after_5_misses": f"{proj}%",
                "classes_needed": max(0, needed) if needed > 0 else 0,
                "miss_buffer": max(0, -needed) if needed < 0 else 0,
            },
            summary=f"Attendance for {student['name']}: {pct}% — status: {status}.",
            markdown=(
                f"#### 📊 Attendance — {student['name']}\n"
                f"- **Current**: {pct}% ({attended}/{total} classes)\n"
                f"- **Status**: **{status}** (threshold {threshold}%, condonation {condonation}%)\n"
                + (
                    f"- If you miss 5 more classes: {proj}%\n- Classes needed to stay eligible: **{max(0, needed)}**"
                    if needed >= 0 else
                    f"- You can safely miss up to **{max(0, -needed)}** more classes and stay eligible.\n- If you miss 5 more classes: {proj}%"
                )
            ),
        )

    # -- recommend_electives --------------------------------------------------
    def _recommend_electives(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Recommend elective courses based on the student's branch, year, and interests."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        interests = " ".join(student.get("interests", []))
        scoring = []
        for c in db.ELECTIVES:
            score = 0
            if "AI" in interests or "ML" in interests or "Learning" in c["name"]:
                if "Deep" in c["name"] or "Agent" in c["name"]:
                    score += 2
            if "Cloud" in interests and "Cloud" in c["name"]:
                score += 2
            if "Data" in interests and ("Data" in c["name"] or "MLOps" in c["name"]):
                score += 2
            if "Cybersecurity" in interests and "Cybersecurity" in c["name"]:
                score += 2
            scoring.append((score, c))
        scoring.sort(key=lambda x: x[0], reverse=True)
        top = [c for _, c in scoring[:3]]
        lines = "\n".join(f"- **{c['code']}** {c['name']} ({c['credits']} credits) — *Prereq: {c['prereq']}*" for c in top)
        return ToolResult(
            data={"student": student["name"], "recommended_courses": top},
            summary=f"Recommended {len(top)} electives for {student['name']} based on interests.",
            markdown=f"#### 🎓 Recommended Electives for {student['name']}\n{lines}",
        )

    # -- upcoming_load --------------------------------------------------------
    def _upcoming_load(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Summarize the student's upcoming exams and calendar load (used by Wellness)."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        exams = student.get("upcoming_exams", [])
        calendar = db.list_notifications(student["id"]) + [{"title": e["title"], "trigger_at": e["date"]} for e in exams]
        load_score = min(10, len(exams) * 2 + len(calendar))
        lines = "\n".join(f"- **{e['title']}** on {e['date']}" for e in exams) or "- No upcoming exams recorded."
        return ToolResult(
            data={"exams": exams, "calendar_count": len(calendar), "load_score": load_score},
            summary=f"Upcoming load for {student['name']}: {len(exams)} exams, load score {load_score}/10.",
            markdown=f"#### 🗓️ Upcoming Academic Load — {student['name']}\n{lines}\n- *Load score: {load_score}/10*",
        )


AcademicAgent.TOOLS = {
    "get_timetable": AcademicAgent._get_timetable,
    "calculate_attendance": AcademicAgent._calculate_attendance,
    "recommend_electives": AcademicAgent._recommend_electives,
    "upcoming_load": AcademicAgent._upcoming_load,
}

academic_agent = AcademicAgent()
