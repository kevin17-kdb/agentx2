"""LLM abstraction for the campus system.

Two interchangeable backends:
- ClaudeBackend  : real tool-calling via the Anthropic API (used when
                   ANTHROPIC_API_KEY is set).
- Deterministic  : rule-based planner/composer (offline, instant, reliable).

Both expose the same interface so the orchestration graph is identical. The
deterministic backend keeps the demo fully self-contained while the Claude
backend is the production path.
"""

import json
import os
import re
from typing import Any, Dict, List

from backend.data.db import get_student

AGENT_DESCRIPTIONS: Dict[str, str] = {
    "academic": "Handles timetables, attendance, exam schedules, and elective recommendations.",
    "placement": "Checks internship/placement eligibility, resume analysis, interview prep.",
    "events": "Discovers workshops/hackathons, registers students, suggests clubs.",
    "services": "Student services: hostel, scholarships, transport, library, FAQs, grievances.",
    "communication": "Drafts emails, adds calendar events, coordinates appointments.",
    "knowledge": "Answers institutional questions using RAG over campus policies and handbooks.",
    "notification": "Schedules reminders and pushes notifications to in-app and Discord channels.",
    "wellness": "Detects stress/overload signals and suggests breaks, resources, and counseling.",
    "navigator": "Finds campus buildings, free classrooms, printers, ATMs with directions.",
    "finance": "Fees, dues, scholarship disbursement status, and affordability checks.",
}

# Tool schemas exposed to Claude for autonomous planning.
PLAN_TOOL_SCHEMA = {
    "name": "plan_task",
    "description": "Decompose the user's campus request into a plan of specialized-agent steps. Each step names one agent and the concrete tool call that agent should make.",
    "input_schema": {
        "type": "object",
        "properties": {
            "reasoning": {
                "type": "string",
                "description": "Concise explanation of why this plan was chosen.",
            },
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "agent": {
                            "type": "string",
                            "enum": list(AGENT_DESCRIPTIONS.keys()),
                        },
                        "task": {"type": "string"},
                        "tool": {"type": "string"},
                        "params": {"type": "object"},
                    },
                    "required": ["agent", "task", "tool", "params"],
                },
            },
        },
        "required": ["reasoning", "steps"],
    },
}


class PlanStep:
    def __init__(self, agent: str, task: str, tool: str, params: Dict[str, Any]) -> None:
        self.agent = agent
        self.task = task
        self.tool = tool
        self.params = params or {}

    def to_dict(self) -> Dict[str, Any]:
        return {"agent": self.agent, "task": self.task, "tool": self.tool, "params": self.params}


# ---------------------------------------------------------------------------
# Intent detection helpers (used by the deterministic planner)
# ---------------------------------------------------------------------------
def _contains(text: str, words: List[str]) -> bool:
    """Word-boundary-aware keyword match (start-boundary), so 'hi' does not
    match inside 'third' and 'fee' does not match inside 'coffee'."""
    for w in words:
        if re.search(r"(?:^|\b)" + re.escape(w), text):
            return True
    return False


_GREETINGS = ["hello", "hey", "hi", "namaste", "namaskaram", "good morning", "good afternoon",
              "good evening", "who are you", "what can you do", "how are you"]
_THANKS = ["thanks", "thank you", "thanku", "thx"]

_WELLNESS_PHRASES = ["too many exams", "too many assignments", "can't handle", "cant handle",
                     "can't cope", "cant cope", "burnt out", "burnout", "burn out", "so much work",
                     "so stressed", "stressed out", "anxious", "anxiety", "panic attack", "giving up",
                     "overwhelmed", "overloaded", "exhausted", "no sleep", "can't sleep", "not sleeping",
                     "deadline this week", "deadlines this week", "exam week is killing",
                     "i feel burnt", "i'm overwhelmed", "im overwhelmed", "i'm stressed", "im stressed",
                     "pressure is getting", "worried about exams", "worried about my exams"]
_MEALS = ["breakfast", "lunch", "dinner", "mess"]

_SPATIAL = ["nearest", "where is", "where's", "where are", "how do i reach", "directions",
            "find the", "find me", "find a", "find an", "reach the", "located"]
_NAV_ITEMS = ["atm", "printer", "cafeteria", "canteen", "classroom", "auditorium", "library",
              "hostel", "gym", "medical", "building", "hub", "location", "where", "directions", "print"]

_FINANCE = ["fee", "fees", "dues", "afford", "budget", "wallet", "balance", "tuition", "installment",
            "scholarship disbursement", "can i afford", "how much is", "cost", "paid"]

_PLACEMENT_STRONG = ["internship", "placement", "apply to", "apply for", "stipend", "dream offer",
                     "company", "recruiter", "hiring", "drive"]
_PLACEMENT_WEAK = ["eligible", "eligibility"]
_PLACEMENT = _PLACEMENT_STRONG + _PLACEMENT_WEAK

_EXAM = ["examination regulation", "exam regulation", "makeup exam", "make-up exam", "attendance eligibility",
         "attendance percentage", "my attendance", "condonation", "detained", "end-sem", "endsem",
         "evaluation structure", "backlog clearance"]

_TIMETABLE = ["today's class", "today classes", "timetable", "time table", "schedule", "my classes",
              "what classes", "class today", "lab today", "classes today"]

_EVENTS = ["workshop", "hackathon", "events", "clubs", "meetup", "masterclass", "register", "webinar",
           "session", "talk", "hack"]

_SERVICES = ["hostel", "warden", "scholarship", "scholarships", "transport", "bus route", "bus",
             "faq", "bonafide", "grievance", "complaint", "library", "wifi", "wi-fi", "internet",
             "certificate"]

_RECOMMEND = ["recommend", "suggest", "elective", "course", "courses", "improve", "personalized",
              "what should i", "best", "advice", "advise", "study plan"]

_MEMORY = ["continue", "as i asked", "earlier", "from where we left", "that thing", "as we discussed",
           "what else", "remember"]

_COMPANY_KEYWORDS = ["google", "microsoft", "amazon", "tcs", "ozonetel", "meta", "adobe", "flipkart"]


class DeterministicPlanner:
    """Rule-based planner that mirrors Claude's autonomous planning."""

    def plan(self, query: str, student: dict, memory_context: str = "") -> Dict[str, Any]:
        q = query.lower()
        steps: List[PlanStep] = []
        reasoning_parts: List[str] = []

        student_id = student.get("id", "S101")

        if _contains(q, _GREETINGS):
            return {
                "reasoning": "Detected a conversational greeting. Responding with a capability menu and recalling any prior session memory.",
                "steps": [PlanStep("communication", "Greet the student and summarize system capabilities", "greet", {"query": query})],
            }
        if _contains(q, _THANKS):
            return {
                "reasoning": "Detected gratitude. Acknowledging politely without running tools.",
                "steps": [PlanStep("communication", "Acknowledge thanks", "acknowledge", {})],
            }

        wellness_hit = _contains(q, _WELLNESS_PHRASES) and not _contains(q, _MEALS)
        spatial_hit = _contains(q, _SPATIAL) and _contains(q, _NAV_ITEMS)
        finance_hit = _contains(q, _FINANCE)
        placement_hit = _contains(q, _PLACEMENT_STRONG) or (_contains(q, _PLACEMENT_WEAK) and _contains(q, _COMPANY_KEYWORDS))
        exam_hit = _contains(q, _EXAM)
        timetable_hit = _contains(q, _TIMETABLE)
        events_hit = _contains(q, _EVENTS)
        services_hit = _contains(q, _SERVICES)
        recommend_hit = _contains(q, _RECOMMEND)
        memory_hit = _contains(q, _MEMORY)

        # --- Wellness -----------------------------------------------------
        if wellness_hit:
            reasoning_parts.append("Detected stress/overload signals; routing to the Wellness Agent for workload assessment and support.")
            steps.append(PlanStep("wellness", "Assess workload and stress signals", "assess_workload", {"query": query}))
            steps.append(PlanStep("knowledge", "Retrieve wellness policy and counseling resources", "rag_search", {"query": "wellness counseling support overload policy"}))
            if exam_hit or timetable_hit:
                steps.append(PlanStep("academic", "Summarize upcoming academic load", "upcoming_load", {"student_id": student_id}))

        # --- Navigation ----------------------------------------------------
        if spatial_hit and not (placement_hit or exam_hit or wellness_hit):
            reasoning_parts.append("Spatial navigation intent detected; routing to the Campus Navigator for facility lookup and directions.")
            steps.append(PlanStep("navigator", "Find the requested facility and route", "find_nearest", {"query": query}))

        # --- Finance ------------------------------------------------------
        if finance_hit and not wellness_hit:
            reasoning_parts.append("Finance intent detected; routing to the Finance Agent for fees, dues, and affordability.")
            steps.append(PlanStep("finance", "Analyze fees, dues, and affordability", "fee_analysis", {"query": query, "student_id": student_id}))

        # --- Placement / internship ---------------------------------------
        if placement_hit and not (wellness_hit or spatial_hit):
            company = next((c for c in _COMPANY_KEYWORDS if c in q), "google")
            reasoning_parts.append(f"Placement intent detected; checking eligibility for {company.title()}, then planning downstream actions.")
            steps.append(PlanStep("placement", f"Check eligibility for {company.title()}", "check_eligibility", {"company": company, "student_id": student_id}))
            steps.append(PlanStep("knowledge", "Retrieve placement policy rules for verification", "rag_search", {"query": "Tier-1 internship eligibility CGPA backlog attendance workshop"}))
            if _contains(q, ["register", "workshop", "orientation", "prep workshop"]):
                steps.append(PlanStep("events", "Register student for the placement workshop", "register_workshop", {"student_id": student_id}))
                reasoning_parts.append("User requested registration; adding event registration step.")
            if _contains(q, ["calendar", "add to my calendar", "schedule"]):
                steps.append(PlanStep("communication", "Add workshop to the student's calendar", "add_calendar_event", {"student_id": student_id, "event_title": "Google Placement & Internship Prep Workshop"}))
                reasoning_parts.append("Calendar integration requested; adding calendar step.")
            if _contains(q, ["remind", "reminder", "notification"]):
                steps.append(PlanStep("notification", "Schedule a reminder before the event", "schedule_reminder", {"student_id": student_id, "title": "Google Placement & Internship Prep Workshop"}))
                reasoning_parts.append("Reminder requested; adding notification step.")

        # --- Exam / attendance ---------------------------------------------
        if exam_hit and not (wellness_hit or spatial_hit):
            reasoning_parts.append("Examination-regulation intent detected; retrieving policy, computing attendance, and preparing actions.")
            steps.append(PlanStep("knowledge", "Retrieve exam & attendance regulations", "rag_search", {"query": "examination regulations attendance condonation makeup exam"}))
            steps.append(PlanStep("academic", "Calculate attendance and eligibility status", "calculate_attendance", {"student_id": student_id}))
            if _contains(q, ["email", "draft", "makeup exam", "permission", "write to", "mail"]):
                steps.append(PlanStep("communication", "Draft makeup exam permission email (requires approval)", "draft_email", {"student_id": student_id, "kind": "makeup_exam"}))
                reasoning_parts.append("Email requested; adding communication step gated by human approval.")

        # --- Timetable / schedule -------------------------------------------
        if timetable_hit and not (placement_hit or exam_hit or wellness_hit or spatial_hit):
            reasoning_parts.append("Timetable intent detected; fetching today's classes.")
            steps.append(PlanStep("academic", "Fetch today's class timetable", "get_timetable", {"day": "Today", "student_id": student_id}))
            if events_hit:
                reasoning_parts.append("Workshop/club interest also detected; adding discovery steps in parallel.")
                steps.append(PlanStep("events", "Discover relevant AI workshops", "discover_events", {"topic": "AI", "student_id": student_id}))
                steps.append(PlanStep("events", "Suggest matching clubs", "suggest_clubs", {"interests": student.get("interests", ["AI"]), "student_id": student_id}))

        # --- Events / clubs alone -------------------------------------------
        elif events_hit and not (placement_hit or exam_hit or wellness_hit or spatial_hit) and not steps:
            topic = "AI"
            for t in ["ml", "machine learning", "ai", "hackathon", "robotics", "finance", "design", "workshop"]:
                if t in q:
                    topic = t
                    break
            reasoning_parts.append(f"Event discovery intent detected; searching for '{topic}' related events and clubs.")
            steps.append(PlanStep("events", "Discover matching workshops and events", "discover_events", {"topic": topic, "student_id": student_id}))
            steps.append(PlanStep("events", "Suggest matching clubs", "suggest_clubs", {"interests": student.get("interests", ["AI"]), "student_id": student_id}))
            if _contains(q, ["register", "sign up", "book", "join"]):
                steps.append(PlanStep("events", "Register student for an event", "register_event", {"query": query, "student_id": student_id}))

        # --- Student services ------------------------------------------------
        if services_hit and not (placement_hit or exam_hit or wellness_hit or finance_hit or spatial_hit):
            if _contains(q, ["scholarship"]):
                reasoning_parts.append("Scholarship intent detected; checking matching scholarships.")
                steps.append(PlanStep("services", "Check matching scholarships", "check_scholarships", {"student_id": student_id}))
                if _contains(q, ["remind", "reminder", "apply", "application"]):
                    steps.append(PlanStep("notification", "Set scholarship application reminder", "schedule_reminder", {"student_id": student_id, "title": "Scholarship application deadline"}))
            elif _contains(q, ["transport", "bus"]):
                reasoning_parts.append("Transport intent detected; fetching bus routes.")
                steps.append(PlanStep("services", "Fetch campus transport routes", "get_transport", {}))
            elif _contains(q, ["grievance", "complaint"]):
                reasoning_parts.append("Grievance intent detected; preparing a ticket for human approval.")
                steps.append(PlanStep("services", "File a grievance ticket (requires approval)", "file_grievance", {"query": query, "student_id": student_id}))
            elif _contains(q, ["hostel", "warden"]):
                reasoning_parts.append("Hostel intent detected; fetching hostel details.")
                steps.append(PlanStep("services", "Fetch hostel & residence details", "get_hostel_info", {"student_id": student_id}))
            elif _contains(q, ["library"]):
                reasoning_parts.append("Library intent detected; retrieving library rules.")
                steps.append(PlanStep("knowledge", "Retrieve library services policy", "rag_search", {"query": "library timings borrowing fines printer"}))
            elif _contains(q, ["wifi", "wi-fi", "internet"]):
                reasoning_parts.append("Wi-Fi/IT support intent detected; retrieving network policy.")
                steps.append(PlanStep("knowledge", "Retrieve Wi-Fi / IT helpdesk policy", "rag_search", {"query": "wifi reset password IT helpdesk"}))
            else:
                reasoning_parts.append("Student-services intent detected; retrieving campus FAQ.")
                steps.append(PlanStep("services", "Look up campus FAQ", "get_campus_faq", {"query": query}))

        # --- Personalized recommendations -------------------------------------
        if recommend_hit and not (placement_hit or exam_hit or wellness_hit or finance_hit or spatial_hit) and not steps:
            reasoning_parts.append("Recommendation intent detected; building a personalized plan from the student profile.")
            steps.append(PlanStep("academic", "Recommend elective courses", "recommend_electives", {"student_id": student_id}))
            steps.append(PlanStep("placement", "Analyze resume health", "analyze_resume", {"student_id": student_id}))
            steps.append(PlanStep("events", "Match workshops and clubs to interests", "discover_events", {"topic": student.get("interests", ["AI"])[0] if student.get("interests") else "AI", "student_id": student_id}))

        # --- Memory continuation -----------------------------------------------
        if memory_hit and not steps and memory_context:
            reasoning_parts.append("Continuation intent detected; using session memory to resume the previous task.")
            steps.append(PlanStep("communication", "Recall prior context and continue", "recall_memory", {"query": query}))

        # --- Fallback: knowledge / RAG -------------------------------------------
        if not steps:
            reasoning_parts.append("No specialized intent matched; treating this as an institutional knowledge question and routing to the RAG Knowledge Agent.")
            steps.append(PlanStep("knowledge", "Answer from institutional documents", "rag_search", {"query": query}))

        return {
            "reasoning": " ".join(reasoning_parts) or "Parsing the request and constructing an execution plan.",
            "steps": steps,
        }


# ---------------------------------------------------------------------------
# Claude backend
# ---------------------------------------------------------------------------
class ClaudeBackend:
    def __init__(self, model: str = "claude-sonnet-4-20250514") -> None:
        import anthropic  # imported lazily so the module imports without the SDK

        self.client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        self.model = os.environ.get("ANTHROPIC_MODEL", model)

    def plan(self, query: str, student: dict, memory_context: str = "") -> Dict[str, Any]:
        sys_prompt = (
            "You are the Orchestrator Agent of a smart campus multi-agent system. "
            "Decompose the student's request into a minimal plan of specialized-agent steps. "
            "The student is " + json.dumps({"name": student.get("name"), "branch": student.get("branch"), "year": student.get("year")}, ensure_ascii=False)
            + (". Prior context: " + memory_context[:600] if memory_context else "")
            + "\nAvailable agents: " + ", ".join(f"{k}: {v}" for k, v in AGENT_DESCRIPTIONS.items())
        )
        resp = self.client.messages.create(
            model=self.model,
            max_tokens=1200,
            system=sys_prompt,
            messages=[{"role": "user", "content": query}],
            tools=[PLAN_TOOL_SCHEMA],
            tool_choice={"type": "tool", "name": "plan_task"},
        )
        for block in resp.content:
            if getattr(block, "type", "") == "tool_use":
                raw = block.input
                steps = [PlanStep(s["agent"], s.get("task", ""), s.get("tool", ""), s.get("params", {})) for s in raw.get("steps", [])]
                return {"reasoning": raw.get("reasoning", "Claude planned the task decomposition."), "steps": steps}
        raise RuntimeError("Claude did not return a plan.")

    def compose(self, query: str, steps: List[PlanStep], results: Dict[str, Any], student: dict) -> str:
        context = json.dumps({
            "query": query,
            "student": student.get("name"),
            "results": {k: {"summary": v.get("summary"), "data": v.get("data")} for k, v in results.items()},
        }, ensure_ascii=False)
        resp = self.client.messages.create(
            model=self.model,
            max_tokens=1200,
            system="You are the final composer agent. Write a clean, well-structured Markdown answer for the student using ONLY the provided tool results. Be concise and helpful.",
            messages=[{"role": "user", "content": context}],
        )
        return "".join(getattr(b, "text", "") for b in resp.content)


# ---------------------------------------------------------------------------
# Public client
# ---------------------------------------------------------------------------
class LLMClient:
    def __init__(self) -> None:
        self._backend: Any = None

    @property
    def backend(self) -> Any:
        if self._backend is None:
            if os.environ.get("ANTHROPIC_API_KEY"):
                self._backend = ClaudeBackend()
            else:
                self._backend = DeterministicPlanner()
        return self._backend

    @property
    def mode(self) -> str:
        return "claude" if isinstance(self.backend, ClaudeBackend) else "deterministic"

    def plan(self, query: str, student: dict, memory_context: str = "") -> Dict[str, Any]:
        plan = self.backend.plan(query, student, memory_context)
        return {"reasoning": plan["reasoning"], "steps": [s.to_dict() for s in plan["steps"]]}


llm = LLMClient()
