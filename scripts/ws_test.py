import asyncio, json, sys, os, urllib.request
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import websockets

BASE = "http://127.0.0.1:8000"


def login():
    body = json.dumps({"username": "student", "password": "demo123"}).encode()
    req = urllib.request.Request(BASE + "/api/auth/login", data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["token"]


async def main():
    token = login()
    print("Logged in as 'student'.")
    uri = f"ws://127.0.0.1:8000/ws/chat?token={token}"
    async with websockets.connect(uri) as ws:
        ready = json.loads(await ws.recv())
        print("READY:", ready.get("type"), ready.get("session_id"), ready.get("mode"))
        await ws.send(json.dumps({
            "type": "chat",
            "query": "Am I eligible for the Google internship? If yes, register me for the placement workshop and remind me before it.",
            "student_id": "S101",
        }))
        events = []
        while True:
            msg = json.loads(await ws.recv())
            events.append(msg)
            if msg.get("type") == "complete":
                break
        print("EVENT TYPES:", [e["type"] for e in events])
        print("HITL:", events[-1].get("hitl_pending"))
        plan = next((e for e in events if e["type"] == "plan"), None)
        print("PLAN STEPS:", [s["agent"] for s in plan["steps"]] if plan else None)
        final = next((e for e in events if e["type"] == "final"), None)
        print("FINAL:", (final or {}).get("markdown", "")[:200].replace("\n", " "))
        await ws.close()


if __name__ == "__main__":
    asyncio.run(main())
