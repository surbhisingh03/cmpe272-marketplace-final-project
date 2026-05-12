/**
 * Database access for FusionHub.
 *
 * Connects to Supabase (or any PostgreSQL) using the `pg` driver, but exposes
 * a small adapter on top so existing route code written for `mysql2/promise`
 * keeps working without changes:
 *
 *  - `pool.query(sql, params)` still returns `[rows, fields]`
 *  - Named placeholders `:name` and positional `?` are both supported
 *  - `INSERT` statements automatically get `RETURNING id` appended, so the
 *    caller can still do `const [r] = await pool.query(...); r.insertId`
 *  - `INSERT IGNORE` is rewritten to `INSERT ... ON CONFLICT DO NOTHING`
 *  - MySQL-only date helpers (CURDATE, INTERVAL N DAY) are rewritten
 *  - Postgres unique/column errors are normalised to the MySQL codes
 *    (`ER_DUP_ENTRY`, `ER_BAD_FIELD_ERROR`) that the existing code branches on
 *  - camelCase `AS` aliases are auto-quoted so columns round-trip as
 *    camelCase in JSON (Postgres would otherwise lowercase the keys)
 */

import "./env.js";
import pg from "pg";

/* Postgres returns BIGINT and NUMERIC as strings by default; coerce to JS Number
   so existing code that does `Number(x)` (or relies on JSON serialisation) keeps
   producing real numbers in API responses. */
pg.types.setTypeParser(20, (v) => (v == null ? null : parseInt(v, 10)));      // INT8 / BIGINT
pg.types.setTypeParser(1700, (v) => (v == null ? null : parseFloat(v)));      // NUMERIC

const TABLES_WITHOUT_ID = new Set(["favorites"]);

function rewriteMysqlisms(sql) {
  let out = sql;
  let isInsertIgnore = false;

  out = out.replace(/\bCURDATE\s*\(\s*\)/gi, "CURRENT_DATE");
  out = out.replace(/\bINTERVAL\s+(\d+)\s+DAY\b/gi, "INTERVAL '$1 day'");

  /* MySQL preserves case in unquoted column aliases (e.g. `AS heroImage`),
     but Postgres folds unquoted identifiers to lowercase. The existing
     routes return JSON with camelCase keys (heroImage, visitCount, …) and
     the React client reads those keys verbatim. Auto-quote any AS alias
     that contains an uppercase letter so column-case round-trips intact. */
  out = out.replace(
    /\b(AS)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g,
    (match, as, ident) => (/[A-Z]/.test(ident) ? `${as} "${ident}"` : match)
  );

  if (/\bINSERT\s+IGNORE\s+INTO\b/i.test(out)) {
    out = out.replace(/\bINSERT\s+IGNORE\s+INTO\b/i, "INSERT INTO");
    isInsertIgnore = true;
  }

  return { sql: out, isInsertIgnore };
}

function bindParams(sql, params) {
  if (params == null) return { text: sql, values: [] };

  if (Array.isArray(params)) {
    let i = 0;
    const text = sql.replace(/\?/g, () => `$${++i}`);
    return { text, values: params };
  }

  const values = [];
  const seen = new Map();
  const text = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    if (!seen.has(name)) {
      values.push(params[name]);
      seen.set(name, values.length);
    }
    return `$${seen.get(name)}`;
  });
  return { text, values };
}

function adaptError(err) {
  if (!err || typeof err !== "object") return err;
  switch (err.code) {
    case "23505":
      err.code = "ER_DUP_ENTRY";
      err.errno = 1062;
      err.sqlMessage = err.detail || err.message;
      break;
    case "42703":
      err.code = "ER_BAD_FIELD_ERROR";
      err.errno = 1054;
      err.sqlMessage = err.message;
      break;
    case "42701":
      err.errno = 1060;
      err.sqlMessage = err.message;
      break;
    case "ECONNREFUSED":
    case "ENOTFOUND":
      break;
    default:
      err.sqlMessage = err.sqlMessage || err.message;
  }
  return err;
}

class PgAdapter {
  constructor(pool) {
    this.pool = pool;
  }

  async query(sql, params) {
    const { sql: transformed, isInsertIgnore } = rewriteMysqlisms(sql);

    let finalSql = transformed;
    let returningId = false;

    const insertMatch = /^\s*INSERT\s+INTO\s+["`]?(\w+)["`]?/i.exec(transformed);
    const hasReturning = /\bRETURNING\b/i.test(transformed);
    if (insertMatch && !hasReturning) {
      const table = insertMatch[1].toLowerCase();
      if (!TABLES_WITHOUT_ID.has(table)) {
        finalSql = transformed.replace(/;?\s*$/, " RETURNING id");
        returningId = true;
      }
    }

    if (isInsertIgnore) {
      if (returningId) {
        finalSql = finalSql.replace(
          /\s+RETURNING\s+id\s*$/i,
          " ON CONFLICT DO NOTHING RETURNING id"
        );
      } else {
        finalSql = finalSql.replace(/;?\s*$/, " ON CONFLICT DO NOTHING");
      }
    }

    const { text, values } = bindParams(finalSql, params);
    try {
      const result = await this.pool.query(text, values);
      const rows = result.rows || [];
      if (returningId && rows[0]?.id != null) {
        rows.insertId = rows[0].id;
      }
      rows.affectedRows = result.rowCount ?? rows.length;
      return [rows, result.fields || []];
    } catch (e) {
      throw adaptError(e);
    }
  }

  async execute(sql, params) {
    return this.query(sql, params);
  }

  async end() {
    await this.pool.end();
  }
}

let adapter;

function buildPool() {
  const databaseUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "").trim();
  if (!databaseUrl) {
    console.error(
      "FATAL: DATABASE_URL (or SUPABASE_DB_URL) is missing or empty in server/.env.\n" +
        "  Without it the server used to fall back to 127.0.0.1:5432 and crash on first DB use.\n" +
        "  Set your Supabase Postgres connection string (see server/.env.example)."
    );
    process.exit(1);
  }
  return new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
}

export function getPool() {
  if (!adapter) {
    adapter = new PgAdapter(buildPool());
  }
  return adapter;
}

export async function endPool() {
  if (adapter) {
    await adapter.end();
    adapter = null;
  }
}
