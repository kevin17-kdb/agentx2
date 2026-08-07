"""Thread-safe event bus for streaming agent reasoning traces.

Graph nodes (running in worker threads) publish structured events keyed by
session; each WebSocket subscriber drains them via a thread-safe queue.
"""

import queue
import threading
import time
from typing import Any, Dict, List


class EventBus:
    def __init__(self) -> None:
        self._subscribers: Dict[str, List[queue.Queue]] = {}
        self._lock = threading.Lock()

    def subscribe(self, session_id: str) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=1000)
        with self._lock:
            self._subscribers.setdefault(session_id, []).append(q)
        return q

    def unsubscribe(self, session_id: str, q: queue.Queue) -> None:
        with self._lock:
            queues = self._subscribers.get(session_id, [])
            if q in queues:
                queues.remove(q)
            if not queues:
                self._subscribers.pop(session_id, None)

    def publish(self, session_id: str, event: Dict[str, Any]) -> None:
        event.setdefault("ts", round(time.time() * 1000))
        with self._lock:
            queues = list(self._subscribers.get(session_id, []))
        for q in queues:
            try:
                q.put_nowait(dict(event))
            except queue.Full:
                # Drop oldest, keep latest so the live trace stays current.
                try:
                    q.get_nowait()
                except queue.Empty:
                    pass
                try:
                    q.put_nowait(dict(event))
                except queue.Full:
                    pass

    def drain(self, session_id: str, q: queue.Queue) -> List[Dict[str, Any]]:
        events: List[Dict[str, Any]] = []
        while True:
            try:
                events.append(q.get_nowait())
            except queue.Empty:
                break
        return events


event_bus = EventBus()
