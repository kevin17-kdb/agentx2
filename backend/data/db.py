"""Mock institutional database: static reference data (seeded JSON) + mutable
state (registrations, calendar, notifications, grievances, memory) in SQLite.
"""

import json
import os
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
SEED_DIR = os.path.join(DATA_DIR, "seed")
DB_PATH = os.path.join(DATA_DIR, "agentx.db")


def _load_seed(name: str) -> Any:
    with open(os.path.join(SEED_DIR, name), encoding="utf-8") as fh:
        return json.load(fh)


def _load_docs() -> List[Dict[str, Any]]:
    docs = []
    docs_dir = os.path.join(SEED_DIR, "docs")
    for fname in sorted(os.listdir(docs_dir)):
        if not fname.endswith(".md"):
            continue
        path = os.path.join(docs_dir, fname)
        with open(path, encoding="utf-8") as fh:
            content = fh.read().strip()
        title = fname.replace("-", " ").replace(".md", "").title()
        docs.append({"id": f"DOC-{fname.upper().replace('.', '')}", "title": title, "content": content})
    return docs


# ---- Static reference data -------------------------------------------------
STUDENTS: Dict[str, dict] = {s["id"]: s for s in _load_seed("students.json")}
EVENTS: List[dict] = _load_seed("events.json")
PLACEMENTS: List[dict] = _load_seed("placements.json")
SCHOLARSHIPS: List[dict] = _load_seed("scholarships.json")
TRANSPORT_ROUTES: List[dict] = _load_seed("transport.json")
CLUBS: List[dict] = _load_seed("clubs.json")
FAQS: List[dict] = _load_seed("faqs.json")
CAMPUS_MAP: dict = _load_seed("campus_map.json")
INSTITUTIONAL_DOCS: List[dict] = _load_docs()

TIMETABLES: Dict[str, dict] = {
    "CSE-3": {
        "Monday": [
            {"time": "09:20 - 10:20", "subject": "CS301 AI & ML", "room": "CS-201"},
            {"time": "10:20 - 11:20", "subject": "CS302 DBMS", "room": "CS-201"},
            {"time": "11:30 - 12:30", "subject": "CS304 Algorithms", "room": "CS-201"},
            {"time": "01:20 - 04:20", "subject": "AI/ML Lab", "room": "Lab 5"},
        ],
        "Today": [
            {"time": "09:20 - 10:20", "subject": "CS301 AI & ML", "room": "CS-201"},
            {"time": "10:20 - 11:20", "subject": "CS302 DBMS", "room": "CS-201"},
            {"time": "11:30 - 12:30", "subject": "CS303 Operating Systems", "room": "CS-201"},
            {"time": "01:20 - 04:20", "subject": "DBMS Project Lab", "room": "Lab 3"},
        ],
    }
}

ELECTIVES = [
    {"code": "CS405", "name": "Deep Learning & Neural Networks", "credits": 4, "prereq": "CS301 AI & ML", "level": 4},
    {"code": "CS409", "name": "Autonomous Agent Architectures", "credits": 3, "prereq": "Python", "level": 4},
    {"code": "CS412", "name": "Cloud-Native Distributed Systems", "credits": 3, "prereq": "CS302 DBMS", "level": 4},
    {"code": "CS413", "name": "Data Engineering & MLOps", "credits": 4, "prereq": "Python, SQL", "level": 4},
    {"code": "IT404", "name": "Cybersecurity & Ethical Hacking", "credits": 3, "prereq": "Computer Networks", "level": 4},
]

HOSTEL_DATA = {
    "in_time": "08:30 PM",
    "mess_timings": {
        "Breakfast": "07:00 - 09:00 AM",
        "Lunch": "12:30 - 02:00 PM",
        "Dinner": "07:30 - 09:30 PM",
    },
    "warden_contact": "warden@srec.ac.in | Ext. 204",
    "laundry": "Saturday pickups, Ground Floor Office",
    "wifi": "SREC-ResNet SSID, credentials via intranet portal",
    "night_out_pass": "Submit 24 hours in advance via Student Portal, approved by Warden",
}

FEE_STRUCTURE = {
    "tuition_per_year": 142000,
    "lab_fee_per_year": 8000,
    "exam_fee_mid": 1500,
    "exam_fee_sem": 2500,
    "hostel_fee_per_year": 68000,
    "transport_pass_monthly": 1200,
    "canteen_monthly_avg": 1800,
}


# ---- SQLite connection + schema --------------------------------------------
def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


_conn = _connect()

_SCHEMA = """
CREATE TABLE IF NOT EXISTS memory (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    user_id TEXT,
    role TEXT,
    content TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    event_id TEXT,
    event_title TEXT,
    reg_code TEXT,
    status TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS calendar (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    title TEXT,
    date TEXT,
    time TEXT,
    category TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    channel TEXT,
    title TEXT,
    trigger_at TEXT,
    status TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS grievances (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    category TEXT,
    description TEXT,
    status TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    interests TEXT,
    preferences TEXT,
    updated_at TEXT
);
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT,
    salt TEXT,
    student_id TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT,
    created_at TEXT
);
"""


def _init_db() -> None:
    _conn.executescript(_SCHEMA)
    _conn.commit()


_init_db()


def now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ---- Reference data helpers -------------------------------------------------
def get_student(student_id: str) -> Optional[dict]:
    return STUDENTS.get(student_id) or STUDENTS.get("S101")


def get_event_by_id(event_id: str) -> Optional[dict]:
    return next((e for e in EVENTS if e["id"] == event_id), None)


# ---- Mutable state helpers --------------------------------------------------
def add_registration(student_id: str, event_id: str, event_title: str) -> dict:
    reg = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "event_id": event_id,
        "event_title": event_title,
        "reg_code": f"REG-{1000 + _conn.total_changes % 9000 + 1}",
        "status": "CONFIRMED",
        "created_at": now(),
    }
    reg["reg_code"] = f"REG-{abs(hash(reg['id'])) % 900000 + 100000}"
    _conn.execute(
        "INSERT INTO registrations VALUES (?,?,?,?,?,?,?)",
        (reg["id"], reg["student_id"], reg["event_id"], reg["event_title"],
         reg["reg_code"], reg["status"], reg["created_at"]),
    )
    _conn.commit()
    return reg


def add_calendar_event(student_id: str, title: str, date: str, time: str, category: str = "Event") -> dict:
    ev = {
        "id": f"CAL-{abs(hash(title + date + time)) % 900000 + 100000}",
        "student_id": student_id,
        "title": title,
        "date": date,
        "time": time,
        "category": category,
        "created_at": now(),
    }
    _conn.execute(
        "INSERT INTO calendar VALUES (?,?,?,?,?,?,?)",
        (ev["id"], ev["student_id"], ev["title"], ev["date"], ev["time"], ev["category"], ev["created_at"]),
    )
    _conn.commit()
    return ev


def add_notification(student_id: str, channel: str, title: str, trigger_at: str) -> dict:
    n = {
        "id": f"REM-{abs(hash(title + trigger_at)) % 900000 + 100000}",
        "student_id": student_id,
        "channel": channel,
        "title": title,
        "trigger_at": trigger_at,
        "status": "SCHEDULED",
        "created_at": now(),
    }
    _conn.execute(
        "INSERT INTO notifications VALUES (?,?,?,?,?,?,?)",
        (n["id"], n["student_id"], n["channel"], n["title"], n["trigger_at"], n["status"], n["created_at"]),
    )
    _conn.commit()
    return n


def add_grievance(student_id: str, category: str, description: str) -> dict:
    g = {
        "id": f"GRV-{abs(hash(student_id + category + description + now())) % 900000 + 100000}",
        "student_id": student_id,
        "category": category,
        "description": description,
        "status": "pending_approval",
        "created_at": now(),
    }
    _conn.execute(
        "INSERT INTO grievances VALUES (?,?,?,?,?,?)",
        (g["id"], g["student_id"], g["category"], g["description"], g["status"], g["created_at"]),
    )
    _conn.commit()
    return g


def list_grievances(student_id: Optional[str] = None) -> List[dict]:
    if student_id:
        rows = _conn.execute("SELECT * FROM grievances WHERE student_id=?", (student_id,)).fetchall()
    else:
        rows = _conn.execute("SELECT * FROM grievances").fetchall()
    return [dict(r) for r in rows]


def list_notifications(student_id: str) -> List[dict]:
    rows = _conn.execute("SELECT * FROM notifications WHERE student_id=?", (student_id,)).fetchall()
    return [dict(r) for r in rows]


# ---- Memory (session + long-term) -------------------------------------------
def add_memory(session_id: str, user_id: str, role: str, content: str) -> None:
    _conn.execute(
        "INSERT INTO memory VALUES (?,?,?,?,?,?)",
        (str(uuid.uuid4()), session_id, user_id, role, content, now()),
    )
    _conn.commit()


def get_session_memory(session_id: str, limit: int = 20) -> List[dict]:
    rows = _conn.execute(
        "SELECT * FROM memory WHERE session_id=? ORDER BY created_at DESC LIMIT ?",
        (session_id, limit),
    ).fetchall()
    return list(reversed([dict(r) for r in rows]))


def summarize_user_memory(user_id: str) -> str:
    """Long-term memory: a compact summary of everything the user has asked."""
    rows = _conn.execute(
        "SELECT role, content FROM memory WHERE user_id=? ORDER BY created_at DESC LIMIT 40",
        (user_id,),
    ).fetchall()
    if not rows:
        return ""
    asks = [r["content"] for r in rows if r["role"] == "user"]
    summary = " | ".join(asks[:12])
    return summary


def get_user_profile(user_id: str) -> Optional[dict]:
    row = _conn.execute("SELECT * FROM user_profiles WHERE user_id=?", (user_id,)).fetchone()
    return dict(row) if row else None


def upsert_user_profile(user_id: str, name: str, interests: List[str], preferences: Dict[str, Any]) -> None:
    _conn.execute(
        "INSERT OR REPLACE INTO user_profiles VALUES (?,?,?,?,?)",
        (user_id, name, json.dumps(interests), json.dumps(preferences), now()),
    )
    _conn.commit()
