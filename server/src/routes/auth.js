import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PREFERRED_INTERESTS = new Set(["coffee", "creative", "travel", "academy", "all"]);
const ACCOUNT_TYPES = new Set(["customer", "admin"]);

function normalizePhone(p) {
  return String(p || "").replace(/\s/g, "").slice(0, 40);
}

/** mysql2 often sets `code`; older drivers / proxies may only set errno / sqlMessage */
function isMissingUsersProfileColumns(e) {
  if (!e || typeof e !== "object") return false;
  const msg = String(e.sqlMessage || e.message || "");
  return (
    e.code === "ER_BAD_FIELD_ERROR" ||
    e.errno === 1054 ||
    /unknown column/i.test(msg)
  );
}

function isDuplicateEmail(e) {
  return e?.code === "ER_DUP_ENTRY" || e?.errno === 1062 || /duplicate entry/i.test(String(e?.sqlMessage || ""));
}

async function insertUserMinimal(pool, email, passwordHash, displayName) {
  const [r] = await pool.query(
    "INSERT INTO users (email, password_hash, display_name) VALUES (:email, :ph, :dn)",
    { email, ph: passwordHash, dn: displayName }
  );
  return r.insertId;
}

router.post("/register", async (req, res, next) => {
  try {
    const body = req.body || {};
    const emailIn = body.email ?? body.Email;
    const passwordIn = body.password;
    const fullName =
      body.full_name ?? body.fullName ?? body.displayName ?? body.display_name ?? "";
    const phoneIn = body.phone ?? "";
    const preferredRaw = String(body.preferred_interest ?? body.preferredInterest ?? "all")
      .toLowerCase()
      .trim();
    const preferredInterest = PREFERRED_INTERESTS.has(preferredRaw) ? preferredRaw : "all";
    const accountRaw = String(body.account_type ?? body.accountType ?? "customer")
      .toLowerCase()
      .trim();
    let accountType = ACCOUNT_TYPES.has(accountRaw) ? accountRaw : "customer";
    if (
      accountType === "admin" &&
      process.env.NODE_ENV === "production" &&
      !process.env.ALLOW_SELF_SERVICE_ADMIN
    ) {
      accountType = "customer";
    }

    const email = String(emailIn || "")
      .toLowerCase()
      .trim();
    const displayName = String(fullName).trim().slice(0, 120);
    const password = String(passwordIn || "");
    const phone = normalizePhone(phoneIn);

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Full name, email, and password are required" });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (phone.replace(/\D/g, "").length < 10) {
      return res.status(400).json({ error: "Please enter a valid phone number (at least 10 digits)" });
    }

    const pool = getPool();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = :email LIMIT 1", { email });
    if (existing.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 11);
    const params = {
      email,
      ph: passwordHash,
      dn: displayName,
      phone,
      pref: preferredInterest,
      acct: accountType,
    };

    let id;
    try {
      const [r] = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type)
         VALUES (:email, :ph, :dn, :phone, :pref, :acct)`,
        params
      );
      id = r.insertId;
    } catch (e) {
      if (isDuplicateEmail(e)) {
        return res.status(409).json({ error: "Email already registered" });
      }
      if (isMissingUsersProfileColumns(e)) {
        try {
          id = await insertUserMinimal(pool, email, passwordHash, displayName);
        } catch (e2) {
          if (isDuplicateEmail(e2)) {
            return res.status(409).json({ error: "Email already registered" });
          }
          throw e2;
        }
        const token = jwt.sign(
          { sub: id, email, role: "customer" },
          process.env.JWT_SECRET || "dev-secret",
          { expiresIn: process.env.JWT_EXPIRES || "7d" }
        );
        return res.json({
          token,
          message:
            "Account created successfully. Run server/scripts/migrate-users-profile.sql to store phone and preferences in the database.",
          user: { id, email, displayName, phone, preferredInterest, accountType },
        });
      }
      throw e;
    }

    const token = jwt.sign(
      { sub: id, email, role: accountType },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );
    return res.json({
      token,
      message:
        "Account created successfully. You can now access all partner companies in the marketplace.",
      user: {
        id,
        email,
        displayName,
        phone,
        preferredInterest,
        accountType,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const pool = getPool();
  let rows;
  try {
    [rows] = await pool.query(
      `SELECT id, email, password_hash, display_name, avatar_url,
              preferred_interest AS preferredInterest,
              account_type AS accountType
       FROM users WHERE email = :email LIMIT 1`,
      { email: String(email).toLowerCase().trim() }
    );
  } catch {
    [rows] = await pool.query(
      "SELECT id, email, password_hash, display_name, avatar_url FROM users WHERE email = :email LIMIT 1",
      { email: String(email).toLowerCase().trim() }
    );
  }
  const user = rows[0];
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      preferredInterest: user.preferredInterest ?? null,
      accountType: user.accountType ?? null,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const pool = getPool();
  let rows;
  try {
    [rows] = await pool.query(
      `SELECT id, email, display_name AS displayName, avatar_url AS avatarUrl,
              phone, preferred_interest AS preferredInterest,
              account_type AS accountType, created_at AS created_at
       FROM users WHERE id = :id LIMIT 1`,
      { id: req.user.id }
    );
  } catch {
    [rows] = await pool.query(
      "SELECT id, email, display_name AS displayName, avatar_url AS avatarUrl, created_at FROM users WHERE id = :id LIMIT 1",
      { id: req.user.id }
    );
  }
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

export default router;
