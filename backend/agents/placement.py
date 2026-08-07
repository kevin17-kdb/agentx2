"""Placement Agent: eligibility audits, internships, resume analysis."""

from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.data import db


class PlacementAgent(BaseAgent):
    name = "placement"
    description = "Checks internship/placement eligibility, resume analysis, interview prep."
    color = "#f59e0b"
    glyph = "PL"

    # -- check_eligibility ----------------------------------------------------
    def _check_eligibility(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Check a student's eligibility against an internship/company criteria."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        company = (params.get("company") or "google").lower()
        listing = next((p for p in db.PLACEMENTS if company in p["company"].lower()), db.PLACEMENTS[0])

        checks = []
        checks.append(("CGPA", student["gpa"] >= listing["min_cgpa"], f"{student['gpa']} >= {listing['min_cgpa']}"))
        checks.append(("Backlogs", student["active_backlogs"] <= listing["max_backlogs"],
                       f"{student['active_backlogs']} <= {listing['max_backlogs']}"))
        year_ok = student["year"] in listing["eligible_years"]
        checks.append(("Year", year_ok, f"{student['year']} in {listing['eligible_years']}"))
        branch_ok = "All Branches" in listing["eligible_branches"] or student["branch"] in listing["eligible_branches"]
        checks.append(("Branch", branch_ok, f"{student['branch']} in {listing['eligible_branches']}"))

        eligible = all(ok for _, ok, _ in checks)
        check_lines = "\n".join(
            f"- {'✅' if ok else '❌'} **{name}**: {detail} {'PASS' if ok else 'FAIL'}"
            for name, ok, detail in checks
        )
        verdict = "✅ **ELIGIBLE**" if eligible else "❌ **NOT ELIGIBLE**"
        return ToolResult(
            data={
                "student_name": student["name"],
                "company": listing["company"],
                "role": listing["role"],
                "eligible": eligible,
                "criteria_breakdown": checks,
                "stipend": listing["stipend"],
                "deadline": listing["deadline"],
                "duration": listing["duration"],
            },
            summary=f"{student['name']} is {'ELIGIBLE' if eligible else 'NOT ELIGIBLE'} for {listing['company']} ({listing['role']}).",
            markdown=(
                f"#### 🎯 {listing['company']} — {listing['role']}\n"
                f"*{listing['duration']} · Stipend {listing['stipend']} · Apply by {listing['deadline']}*\n\n"
                f"{check_lines}\n\n**Verdict for {student['name']}**: {verdict}"
            ),
        )

    # -- analyze_resume -------------------------------------------------------
    def _analyze_resume(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Analyze the student's resume and suggest improvements."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        strengths = [
            f"Strong CGPA ({student['gpa']})",
            *([f"Skills: {', '.join(student.get('skills', [])[:4])}"] if student.get("skills") else []),
        ]
        suggestions = [
            "Add GitHub links for top projects",
            "Quantify project outcomes with metrics",
            "Tailor the summary to target roles",
        ]
        score = 62 + min(30, int(student["gpa"] * 3))
        return ToolResult(
            data={"student": student["name"], "resume_score": score, "strengths": strengths, "suggestions": suggestions},
            summary=f"Resume analysis for {student['name']}: score {score}/100.",
            markdown=(
                f"#### 📄 Resume Health — {student['name']}\n"
                f"- **Score**: {score}/100\n"
                f"- **Strengths**: {', '.join(strengths)}\n"
                f"- **Suggestions**: {'; '.join(suggestions)}"
            ),
        )

    # -- list_internships ------------------------------------------------------
    def _list_internships(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """List open internships filtered by a keyword."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        q = (params.get("query") or "").lower()
        listings = [p for p in db.PLACEMENTS if q in p["company"].lower() or q in p["role"].lower()] if q else db.PLACEMENTS
        lines = "\n".join(
            f"- **{p['company']}** — {p['role']} · {p['stipend']} · min CGPA {p['min_cgpa']} · Apply by {p['deadline']}"
            for p in listings
        )
        return ToolResult(
            data={"listings": listings},
            summary=f"Found {len(listings)} internships matching '{q or 'any'}'.",
            markdown=f"#### 💼 Open Internships\n{lines}",
        )


PlacementAgent.TOOLS = {
    "check_eligibility": PlacementAgent._check_eligibility,
    "analyze_resume": PlacementAgent._analyze_resume,
    "list_internships": PlacementAgent._list_internships,
}

placement_agent = PlacementAgent()
