"""Smoke test: run the multi-agent pipeline across all key scenarios."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.graph import graph  # noqa: E402
from backend.core.llm import llm  # noqa: E402

QUERIES = [
    ("S101", "I'm a third-year CSE student. Am I eligible for the Google internship? If yes, register me for tomorrow's placement workshop, add it to my calendar, and remind me one hour before the event."),
    ("S101", "Summarize the examination regulations, calculate my attendance eligibility, and draft an email requesting permission for a makeup exam."),
    ("S101", "Show today's classes, recommend upcoming AI workshops, and suggest clubs related to Machine Learning."),
    ("S102", "I'm so overwhelmed, I have 2 exams and a hackathon deadline this week. Can you help? What wellness resources are available?"),
    ("S101", "Where's the nearest ATM? Also where can I print a document?"),
    ("S103", "Can I afford a 5000 rupee hackathon trip?"),
    ("S103", "Am I eligible for the Microsoft internship?"),
    ("S101", "What are the hostel rules about night out passes?"),
    ("S101", "Summarize the attendance policy"),
    ("S102", "What scholarships am I eligible for?"),
    ("S101", "File a grievance about the wifi in my hostel."),
    ("S101", "hello"),
    ("S101", "recommend me electives and improve my resume"),
]


async def main():
    print(f"LLM mode: {llm.mode}\n")
    for student_id, query in QUERIES:
        print("=" * 100)
        print(f"QUERY [{student_id}]: {query}")
        state = {
            "user_query": query,
            "student_id": student_id,
            "session_id": f"test-{abs(hash(query)) % 9999}",
            "plan": [], "plan_reasoning": "", "current_step": 0,
            "results": {}, "agent_logs": [], "final_response": "",
            "hitl_pending": False, "hitl_payload": None, "memory_context": "", "error": None,
        }
        result = await asyncio.to_thread(graph.invoke, state)
        print(f"PLAN: {[s['agent'] for s in result.get('plan', [])]}")
        print(f"HITL: {result.get('hitl_pending')}")
        print("-" * 60)
        print(result.get("final_response", "")[:1500])
        print()


if __name__ == "__main__":
    asyncio.run(main())
