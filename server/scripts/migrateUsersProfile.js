/**
 * Adds phone / preferred_interest / account_type to `users` if missing.
 * Uses the same MYSQL_* settings as seed.js — no mysql CLI password needed.
 *
 * Usage: npm run migrate:users  (from server/)
 */
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const db = process.env.MYSQL_DATABASE || "fusionhub";

function isDuplicateColumn(err) {
  return err?.errno === 1060 || /duplicate column name/i.test(String(err?.sqlMessage || err?.message || ""));
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: db,
    multipleStatements: false,
  });

  const statements = [
    `ALTER TABLE users ADD COLUMN phone VARCHAR(40) NULL AFTER display_name`,
    `ALTER TABLE users ADD COLUMN preferred_interest VARCHAR(32) NOT NULL DEFAULT 'all' AFTER phone`,
    `ALTER TABLE users ADD COLUMN account_type VARCHAR(32) NOT NULL DEFAULT 'customer' AFTER preferred_interest`,
  ];

  for (const sql of statements) {
    try {
      await conn.query(sql);
      console.log("OK:", sql.slice(0, 70) + "…");
    } catch (err) {
      if (isDuplicateColumn(err)) {
        console.log("Skip (already exists):", sql.slice(0, 55) + "…");
        continue;
      }
      throw err;
    }
  }

  await conn.end();
  console.log("migrate:users complete. Database:", db);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
