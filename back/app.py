import os
import time

import pymysql
from flask import Flask, jsonify, request

app = Flask(__name__)


def get_conn():
    return pymysql.connect(
        host=os.environ["DB_HOST"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def init_db():
    # MySQL може ще стартувати, тому пробуємо кілька разів
    for attempt in range(30):
        try:
            with get_conn() as conn, conn.cursor() as cur:
                cur.execute(
                    """CREATE TABLE IF NOT EXISTS messages (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        text VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )"""
                )
            print("DB ready", flush=True)
            return
        except pymysql.err.OperationalError as e:
            print(f"DB not ready ({attempt + 1}/30): {e}", flush=True)
            time.sleep(2)
    raise RuntimeError("Could not connect to DB")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/messages")
def list_messages():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, text, created_at FROM messages ORDER BY id DESC")
        rows = cur.fetchall()
    for r in rows:
        r["created_at"] = r["created_at"].isoformat()
    return jsonify(rows)


@app.post("/api/messages")
def add_message():
    text = (request.get_json(silent=True) or {}).get("text", "").strip()
    if not text:
        return {"error": "text is required"}, 400
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO messages (text) VALUES (%s)", (text,))
        new_id = cur.lastrowid
    return {"id": new_id, "text": text}, 201


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
