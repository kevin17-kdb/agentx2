"""Simple username/password auth with session tokens.

No external dependencies: passwords are hashed with PBKDF2-SHA256 and a per-user
random salt; sessions are random bearer tokens stored in SQLite.
"""

import hashlib
import hmac
import os
import secrets
import uuid
from typing import Optional, Tuple

from backend.data import db

_PBKDF2_ITERATIONS = 100_000


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS
    ).hex()


def register_user(username: str, password: str, student_id: Optional[str] = None) -> dict:
    username = username.strip()
    if not username or not password:
        raise ValueError("Username and password are required.")
    existing = db._conn.execute("SELECT username FROM users WHERE username=?", (username,)).fetchone()
    if existing:
        raise ValueError(f"Username '{username}' is already taken.")
    if not student_id:
        student_id = "S101"
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    db._conn.execute(
        "INSERT INTO users VALUES (?,?,?,?,?)",
        (username, password_hash, salt, student_id, db.now()),
    )
    db._conn.commit()
    return {"username": username, "student_id": student_id}


def _verify_password(password: str, salt: str, expected_hash: str) -> bool:
    actual = _hash_password(password, salt)
    return hmac.compare_digest(actual, expected_hash)


def authenticate(username: str, password: str) -> Optional[Tuple[dict, str]]:
    """Returns (user, token) on success, None on failure."""
    row = db._conn.execute(
        "SELECT username, password_hash, salt, student_id FROM users WHERE username=?",
        (username.strip(),),
    ).fetchone()
    if not row or not _verify_password(password, row["salt"], row["password_hash"]):
        return None
    token = f"tok-{uuid.uuid4().hex}"
    db._conn.execute(
        "INSERT INTO sessions VALUES (?,?,?)", (token, row["username"], db.now())
    )
    db._conn.commit()
    user = {"username": row["username"], "student_id": row["student_id"]}
    return user, token


def get_user(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    row = db._conn.execute(
        "SELECT u.username, u.student_id FROM sessions s "
        "JOIN users u ON u.username = s.username WHERE s.token=?",
        (token,),
    ).fetchone()
    return dict(row) if row else None


def logout(token: Optional[str]) -> None:
    if not token:
        return
    db._conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    db._conn.commit()


def _seed_demo_users() -> None:
    if not db._conn.execute("SELECT username FROM users LIMIT 1").fetchone():
        register_user("student", "demo123", "S101")
        register_user("admin", "demo123", "S102")


_seed_demo_users()
