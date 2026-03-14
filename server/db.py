import sqlite3
from pathlib import Path

from config import DB_PATH

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sandboxes (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    vm_name TEXT UNIQUE NOT NULL,
    ip TEXT,
    status TEXT NOT NULL DEFAULT 'creating',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
"""


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = _connect()
    conn.executescript(_SCHEMA)
    conn.close()


def create_sandbox(sandbox_id: str, vm_name: str, user_id: str | None = None) -> dict:
    conn = _connect()
    conn.execute(
        "INSERT INTO sandboxes (id, user_id, vm_name, status) VALUES (?, ?, ?, 'creating')",
        (sandbox_id, user_id, vm_name),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM sandboxes WHERE id = ?", (sandbox_id,)).fetchone()
    conn.close()
    return dict(row)


def get_sandbox(sandbox_id: str) -> dict | None:
    conn = _connect()
    row = conn.execute("SELECT * FROM sandboxes WHERE id = ?", (sandbox_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_sandboxes(user_id: str | None = None) -> list[dict]:
    conn = _connect()
    if user_id:
        rows = conn.execute(
            "SELECT * FROM sandboxes WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM sandboxes ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_sandbox(sandbox_id: str, **kwargs) -> dict | None:
    if not kwargs:
        return get_sandbox(sandbox_id)
    conn = _connect()
    sets = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [sandbox_id]
    conn.execute(f"UPDATE sandboxes SET {sets} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM sandboxes WHERE id = ?", (sandbox_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_sandbox(sandbox_id: str) -> bool:
    conn = _connect()
    cursor = conn.execute("DELETE FROM sandboxes WHERE id = ?", (sandbox_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0
