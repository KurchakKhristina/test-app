const express = require("express");
const mysql = require("mysql2/promise");
const dbConfig = require("./db");

const PORT = Number(process.env.PORT || 5000);

const app = express();
app.use(express.json());

const pool = mysql.createPool(dbConfig);

// Liveness: процес живий. БД не чіпаємо — під ALB health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Readiness: чи можемо обслуговувати запити (є з'єднання з БД)
app.get("/api/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready" });
  } catch (err) {
    console.error(`Readiness check failed: ${err.message}`);
    res.status(503).json({ status: "not ready", error: err.message });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, text, created_at FROM messages ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(`GET /api/messages failed: ${err.message}`);
    res.status(500).json({ error: "internal error" });
  }
});

app.post("/api/messages", async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }
  try {
    const [result] = await pool.query("INSERT INTO messages (text) VALUES (?)", [text]);
    res.status(201).json({ id: result.insertId, text });
  } catch (err) {
    console.error(`POST /api/messages failed: ${err.message}`);
    res.status(500).json({ error: "internal error" });
  }
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on port ${PORT}`);
});

// docker stop / ECS шлють SIGTERM — коректно закриваємо з'єднання
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down");
  server.close(() => pool.end().then(() => process.exit(0)));
});
