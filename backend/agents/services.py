"""Student Services Agent: hostel, scholarships, transport, library, FAQs, grievances."""

import re
from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.data import db


def _extract_category(query: str) -> str:
    q = query.lower()
    if any(k in q for k in ["wifi", "wi-fi", "internet", "network"]):
        return "Wi-Fi & Network"
    if any(k in q for k in ["mess", "food", "canteen"]):
        return "Mess Quality"
    if any(k in q for k in ["hostel", "room", "ac", "electricity", "fan"]):
        return "Hostel & Infrastructure"
    if any(k in q for k in ["harass", "ragging", "bully"]):
        return "Anti-Ragging (Confidential)"
    return "Infrastructure"


class ServicesAgent(BaseAgent):
    name = "services"
    description = "Student services: hostel, scholarships, transport, library, FAQs, grievances."
    color = "#34d399"
    glyph = "SV"

    # -- get_hostel_info ------------------------------------------------------
    def _get_hostel_info(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Fetch hostel, mess, and residence details for the student."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        d = db.HOSTEL_DATA
        return ToolResult(
            data={"student_name": student["name"], "resident": student["hostel_resident"],
                  "accommodation": student["hostel_block"], "details": d},
            summary=f"Hostel details for {student['name']} (accommodation: {student['hostel_block']}).",
            markdown=(
                f"#### 🏨 Hostel & Services — {student['name']}\n"
                f"- **Resident**: {'Yes' if student['hostel_resident'] else 'Day Scholar'} · {student['hostel_block']}\n"
                f"- **In-time / Curfew**: {d['in_time']}\n"
                f"- **Mess**: Breakfast {d['mess_timings']['Breakfast']} · Lunch {d['mess_timings']['Lunch']} · Dinner {d['mess_timings']['Dinner']}\n"
                f"- **Night-out pass**: {d['night_out_pass']}\n"
                f"- **Laundry**: {d['laundry']}\n- **Wi-Fi**: {d['wifi']}\n- **Warden**: {d['warden_contact']}"
            ),
        )

    # -- check_scholarships -----------------------------------------------------
    def _check_scholarships(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Check scholarships the student is likely eligible for."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        matches = []
        for s in db.SCHOLARSHIPS:
            ok = True
            if s.get("min_cgpa") is not None and student["gpa"] < s["min_cgpa"]:
                ok = False
            if s.get("branch_filter") and student["branch"] not in s["branch_filter"]:
                ok = False
            if ok:
                matches.append(s)
        lines = "\n".join(f"- **{s['name']}** — {s['amount_text']} · *{s['criteria']}* · Apply by {s['deadline']}" for s in matches)
        return ToolResult(
            data={"student_name": student["name"], "gpa": student["gpa"], "branch": student["branch_full"],
                  "scholarships": matches},
            summary=f"{len(matches)} scholarship matches for {student['name']}.",
            markdown=f"#### 🎓 Scholarships for {student['name']} (CGPA {student['gpa']})\n{lines or '_No direct matches — see the aid office._'}",
        )

    # -- get_transport -----------------------------------------------------------
    def _get_transport(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Fetch campus transport routes and timings."""
        lines = "\n".join(
            f"- **{r['route']}** · Pickup {r['pickup']} · Drop {r['drop']} · {', '.join(r['stops'])}"
            for r in db.TRANSPORT_ROUTES
        )
        return ToolResult(
            data={"routes": db.TRANSPORT_ROUTES},
            summary=f"Returned {len(db.TRANSPORT_ROUTES)} campus bus routes.",
            markdown=f"#### 🚌 Campus Transport\n{lines}",
        )

    # -- get_campus_faq ----------------------------------------------------------
    def _get_campus_faq(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Answer a campus question from the FAQ index."""
        q = (params.get("query") or "").lower()
        matched = [f for f in db.FAQS if q in f["q"].lower() or any(w in f["q"].lower() for w in re.findall(r"[a-z]+", q)) and q]
        faqs = matched or db.FAQS
        lines = "\n".join(f"- **Q:** {f['q']}\n  **A:** {f['a']}" for f in faqs)
        return ToolResult(
            data={"faqs": faqs},
            summary=f"Matched {len(faqs)} FAQ entries.",
            markdown=f"#### 📖 Campus FAQ\n{lines}",
        )

    # -- file_grievance ------------------------------------------------------------
    def _file_grievance(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Prepare a grievance ticket for the student (requires approval)."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        query = params.get("query", "")
        category = _extract_category(query)
        desc_match = re.search(r"(?:about|regarding|the|for)?\s*(.+?)(?:\?|$)", query)
        description = (desc_match.group(1).strip() if desc_match and desc_match.group(1).strip() else "Reported via campus assistant")
        ticket = db.add_grievance(student["id"], category, description)
        return ToolResult(
            status="requires_approval",
            requires_hitl=True,
            data={"ticket_id": ticket["id"], "category": category, "description": description,
                  "student_name": student["name"], "expected_sla": "48 hours", "recipient": "student-services@vasavi.edu.in"},
            summary=f"Prepared grievance ticket {ticket['id']} ({category}) for {student['name']}.",
            markdown=(
                f"#### 🛠️ Grievance Ticket Prepared\n"
                f"- **Ticket ID**: `{ticket['id']}`\n- **Category**: {category}\n- **Description**: {description}\n"
                f"- **Expected SLA**: 48 hours\n\n*Approve below to submit it to Student Services.*"
            ),
        )


ServicesAgent.TOOLS = {
    "get_hostel_info": ServicesAgent._get_hostel_info,
    "check_scholarships": ServicesAgent._check_scholarships,
    "get_transport": ServicesAgent._get_transport,
    "get_campus_faq": ServicesAgent._get_campus_faq,
    "file_grievance": ServicesAgent._file_grievance,
}

services_agent = ServicesAgent()
