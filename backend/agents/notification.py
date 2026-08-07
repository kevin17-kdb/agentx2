"""Notification Agent: reminders with optional Discord webhook delivery."""

import os
from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.data import db

try:
    import httpx
    HAS_HTTPX = True
except Exception:  # pragma: no cover
    HAS_HTTPX = False


class NotificationAgent(BaseAgent):
    name = "notification"
    description = "Schedules reminders and pushes notifications to in-app and Discord channels."
    color = "#f472b6"
    glyph = "NT"

    # -- schedule_reminder --------------------------------------------------------
    def _schedule_reminder(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Schedule a reminder for an event, delivered in-app and optionally via Discord."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        title = params.get("title", "Event reminder")
        event = db.get_event_by_id("EVT-101") or db.EVENTS[0]
        trigger = params.get("trigger_at", f"1 hour before {event['time']}")
        reminder = db.add_notification(student["id"], "in-app + push", title, trigger)

        delivery = ["In-app notification", "Mobile push"]
        webhook_ok = None
        webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
        if webhook_url and HAS_HTTPX:
            try:
                resp = httpx.post(webhook_url, json={
                    "content": f"🔔 **Reminder for {student['name']}**\n{title} — {trigger}\n"
                               f"(sent by AgentX Smart Campus)"
                }, timeout=8)
                webhook_ok = resp.status_code == 204 or resp.status_code == 200
                if webhook_ok:
                    delivery.append("Discord webhook")
            except Exception:
                webhook_ok = False

        markdown = (
            f"#### 🔔 Reminder Scheduled\n- **Title**: {title}\n- **Trigger**: {trigger}\n"
            f"- **Channels**: {', '.join(delivery)}"
        )
        if webhook_ok is True:
            markdown += "\n- **Discord**: ✅ delivered to configured webhook channel"
        elif webhook_ok is False:
            markdown += "\n- **Discord**: ⚠️ webhook set but delivery failed (check `DISCORD_WEBHOOK_URL`)"

        return ToolResult(
            data={"reminder_id": reminder["id"], "title": title, "trigger_at": trigger,
                  "channel": ", ".join(delivery), "discord_delivered": webhook_ok},
            summary=f"Scheduled reminder for '{title}' at {trigger} via {', '.join(delivery)}.",
            markdown=markdown,
        )


NotificationAgent.TOOLS = {
    "schedule_reminder": NotificationAgent._schedule_reminder,
}

notification_agent = NotificationAgent()
