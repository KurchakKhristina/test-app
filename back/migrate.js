// Окрема команда міграцій: `node migrate.js` (у compose — сервіс migrate).
// Застосовує файли з migrations/ по черзі, кожен рівно один раз.
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dbConfig = require("./db");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function main() {
  const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });

  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  const [rows] = await conn.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip    ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    await conn.query(sql);
    await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
    console.log(`applied ${file}`);
  }

  await conn.end();
  console.log("Migrations done");
}

main().catch((err) => {
  console.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
