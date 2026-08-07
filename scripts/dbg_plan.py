import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.core.llm import DeterministicPlanner, _GREETINGS, _THANKS

q = "I'm a third-year CSE student. Am I eligible for the Google internship? If yes, register me for tomorrow's placement workshop, add it to my calendar, and remind me one hour before the event."
ql = q.lower()
for w in _GREETINGS:
    if w in ql:
        print("GREET MATCH:", repr(w))
for w in _THANKS:
    if w in ql:
        print("THANKS MATCH:", repr(w))
p = DeterministicPlanner()
res = p.plan(q, {"id": "S101", "branch": "CSE", "year": 3, "interests": ["AI"]})
print("STEPS:", [s.to_dict() for s in res["steps"]])
