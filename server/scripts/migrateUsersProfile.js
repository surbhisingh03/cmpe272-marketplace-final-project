/**
 * Adds phone / preferred_interest / account_type to `users` if missing.
 * Idempotent — safe to re-run. Uses the same DATABASE_URL as the server.
 *
 * Usage: npm run migrate:users  (from server/)
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add the Supabase Postgres connection string to server/.env"
    );
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const statements = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_interest VARCHAR(32) NOT NULL DEFAULT 'all'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(32) NOT NULL DEFAULT 'customer'`,
  ];

  for (const sql of statements) {
    await client.query(sql);
    console.log("OK:", sql.slice(0, 80) + (sql.length > 80 ? "…" : ""));
  }

  await client.end();
  console.log("migrate:users complete (PostgreSQL / Supabase).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
