/**
 * Quick connectivity / table check.
 *   node scripts/check-db.js               -> ping DB & print row counts
 *   node scripts/check-db.js <conn-url>    -> use a custom URL instead of .env
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const url = process.argv[2] || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("No DATABASE_URL provided");
  process.exit(2);
}

const masked = url.replace(/:\/\/([^:]+):([^@]+)@/, (_, u) => `://${u}:****@`);
console.log("Connecting to:", masked);

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const t0 = Date.now();
try {
  await client.connect();
  const { rows: info } = await client.query(
    "SELECT current_database() AS db, current_user AS usr, version() AS v"
  );
  console.log("OK in", Date.now() - t0, "ms");
  console.log("  database:", info[0].db);
  console.log("  user:    ", info[0].usr);
  console.log("  version: ", info[0].v.split(",")[0]);

  const tables = ["users", "companies", "products", "visits", "favorites", "reviews"];
  console.log("\nTable counts:");
  for (const t of tables) {
    try {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
      console.log(`  ${t.padEnd(10)} ${rows[0].c}`);
    } catch (e) {
      console.log(`  ${t.padEnd(10)} (missing: ${e.message})`);
    }
  }
  await client.end();
  process.exit(0);
} catch (e) {
  console.error("FAILED in", Date.now() - t0, "ms");
  console.error("  code:   ", e.code);
  console.error("  message:", e.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
