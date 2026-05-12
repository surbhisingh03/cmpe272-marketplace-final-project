/**
 * Adds facebook_id, nullable password_hash for Facebook-only users, and index.
 * Idempotent — safe to re-run. Uses DATABASE_URL from server/.env.
 *
 * Usage: npm run migrate:facebook  (from server/)
 */
import "../src/env.js";
import pg from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString?.trim()) {
    throw new Error(
      "DATABASE_URL is not set. Add the Supabase Postgres connection string to server/.env",
    );
  }

  const client = new pg.Client({
    connectionString: connectionString.trim(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const statements = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(64) NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_facebook_id ON users (facebook_id) WHERE facebook_id IS NOT NULL`,
    `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
  ];

  for (const sql of statements) {
    await client.query(sql);
    console.log("OK:", sql.slice(0, 90) + (sql.length > 90 ? "…" : ""));
  }

  await client.end();
  console.log("migrate:facebook complete (PostgreSQL / Supabase).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
