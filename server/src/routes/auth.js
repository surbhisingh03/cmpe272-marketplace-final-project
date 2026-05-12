import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  exchangeFacebookCode,
  facebookOAuthConfigured,
  fetchFacebookProfile,
  displayNameFromFacebookProfile,
} from "../lib/facebookOAuth.js";

const router = Router();

const PREFERRED_INTERESTS = new Set(["coffee", "creative", "travel", "academy", "all"]);
const ACCOUNT_TYPES = new Set(["customer", "admin"]);

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");

/** Only allow same-origin style paths (no open redirects). */
function safeRedirectPath(raw) {
  const s = String(raw || "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return "/marketplace/explore";
  return s.length > 512 ? "/marketplace/explore" : s;
}

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
        const role = accountType === "admin" ? "admin" : "customer";
        const token = jwt.sign(
          { sub: id, email, role },
          process.env.JWT_SECRET || "dev-secret",
          { expiresIn: process.env.JWT_EXPIRES || "7d" }
        );
        return res.json({
          token,
          message:
            "Account created successfully. Run server/scripts/migrate-users-profile.sql to store phone and preferences in the database.",
          user: {
            id,
            email,
            name: displayName,
            displayName,
            phone,
            preferredInterest,
            accountType,
            role,
          },
        });
      }
      throw e;
    }

    const role = accountType === "admin" ? "admin" : "customer";
    const token = jwt.sign(
      { sub: id, email, role },
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
        name: displayName,
        displayName,
        phone,
        preferredInterest,
        accountType,
        role,
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
  if (!user || !user.password_hash) {
    return res.status(401).json({
      error:
        "This account uses Facebook sign-in. Click “Continue with Facebook” below, or set a password if your team enabled that flow.",
    });
  }
  if (!(await bcrypt.compare(String(password), user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const accountType = user.accountType ?? "customer";
  const role = accountType === "admin" ? "admin" : "customer";
  const token = jwt.sign(
    { sub: user.id, email: user.email, role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.display_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      preferredInterest: user.preferredInterest ?? null,
      accountType,
      role,
    },
  });
});

router.get("/facebook/status", (req, res) => {
  res.json({ enabled: facebookOAuthConfigured() });
});

router.get("/facebook", (req, res) => {
  try {
    if (!facebookOAuthConfigured()) {
      return res.redirect(
        `${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent("Facebook login is not configured on the server")}`,
      );
    }
    const redirectAfter = safeRedirectPath(req.query.redirect);
    const state = jwt.sign(
      { purpose: "fb_oauth", redirect: redirectAfter },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "10m" },
    );
    const appId = process.env.FACEBOOK_APP_ID.trim();
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI.trim();
    const url = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "public_profile");
    url.searchParams.set("response_type", "code");
    res.redirect(url.toString());
  } catch (e) {
    console.error("[auth/facebook]", e);
    return res.redirect(
      `${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent("Facebook login failed to start. Check server logs.")}`,
    );
  }
});

router.get("/facebook/callback", async (req, res, next) => {
  if (!facebookOAuthConfigured()) {
    return res.redirect(`${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent("Facebook login is not configured")}`);
  }
  const { code, state, error, error_description: errDesc } = req.query;
  if (error) {
    const msg = String(errDesc || error || "Facebook login cancelled");
    return res.redirect(`${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent(msg)}`);
  }
  let redirectAfter = "/marketplace/explore";
  try {
    const decoded = jwt.verify(String(state || ""), process.env.JWT_SECRET || "dev-secret");
    if (decoded?.purpose !== "fb_oauth" || !decoded.redirect) {
      throw new Error("bad state");
    }
    redirectAfter = safeRedirectPath(decoded.redirect);
  } catch {
    return res.redirect(`${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent("Invalid or expired login state")}`);
  }
  try {
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI.trim();
    const accessToken = await exchangeFacebookCode(String(code), redirectUri);
    const me = await fetchFacebookProfile(accessToken);
    const fbId = String(me?.id ?? "").trim();
    if (!fbId) {
      return res.redirect(
        `${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent("Facebook did not return a profile id. Try again or use email/password sign-in.")}`,
      );
    }
    const pool = getPool();
    const rawEmail =
      typeof me.email === "string" && me.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(me.email.trim())
        ? me.email.trim().toLowerCase()
        : null;
    const email = rawEmail ?? `fb-${fbId}@oauth.fusionhub.local`;
    const primaryName = displayNameFromFacebookProfile(me);
    const displayName = primaryName || "Facebook user";
    const hasRichName = Boolean(primaryName);
    const pic = me.picture?.data?.url ? String(me.picture.data.url).slice(0, 512) : null;

    let [rows] = await pool.query(
      `SELECT id, email, display_name, avatar_url,
              preferred_interest AS preferredInterest,
              account_type AS accountType
       FROM users WHERE facebook_id = :fid LIMIT 1`,
      { fid: fbId },
    );
    let row = rows[0];
    if (!row && rawEmail) {
      [rows] = await pool.query(
        `SELECT id, email, display_name, avatar_url,
                preferred_interest AS preferredInterest,
                account_type AS accountType
         FROM users WHERE email = :email LIMIT 1`,
        { email: rawEmail },
      );
      row = rows[0];
      if (row) {
        await pool.query(
          `UPDATE users SET facebook_id = :fid, avatar_url = COALESCE(avatar_url, :pic) WHERE id = :id`,
          { fid: fbId, pic: pic, id: row.id },
        );
        const [r2] = await pool.query(
          `SELECT id, email, display_name, avatar_url,
                  preferred_interest AS preferredInterest,
                  account_type AS accountType
           FROM users WHERE id = :id LIMIT 1`,
          { id: row.id },
        );
        row = r2[0];
      }
    }
    if (!row) {
      let insertId;
      try {
        const [r] = await pool.query(
          `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type, avatar_url, facebook_id)
           VALUES (:email, NULL, :dn, '', 'all', 'customer', :pic, :fid)`,
          { email, dn: displayName, pic: pic, fid: fbId },
        );
        insertId = r.insertId;
      } catch (e) {
        if (isDuplicateEmail(e)) {
          [rows] = await pool.query(
            `SELECT id, email, display_name, avatar_url,
                    preferred_interest AS preferredInterest,
                    account_type AS accountType
             FROM users WHERE email = :email LIMIT 1`,
            { email },
          );
          row = rows[0];
          if (row) {
            await pool.query(
              `UPDATE users SET facebook_id = :fid, avatar_url = COALESCE(avatar_url, :pic) WHERE id = :id`,
              { fid: fbId, pic: pic, id: row.id },
            );
            const [r2] = await pool.query(
              `SELECT id, email, display_name, avatar_url,
                      preferred_interest AS preferredInterest,
                      account_type AS accountType
               FROM users WHERE id = :id LIMIT 1`,
              { id: row.id },
            );
            row = r2[0];
          }
        } else {
          throw e;
        }
      }
      if (!row && insertId) {
        const [r3] = await pool.query(
          `SELECT id, email, display_name, avatar_url,
                  preferred_interest AS preferredInterest,
                  account_type AS accountType
           FROM users WHERE id = :id LIMIT 1`,
          { id: insertId },
        );
        row = r3[0];
      }
    }

    if (!row) {
      return res.redirect(
        `${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent("Could not create or link your account. Try again or use email sign-in.")}`,
      );
    }

    if (hasRichName || pic) {
      if (hasRichName) {
        await pool.query(
          `UPDATE users SET display_name = :dn, avatar_url = COALESCE(:pic, avatar_url) WHERE id = :id`,
          { dn: primaryName, pic, id: row.id },
        );
      } else if (pic) {
        await pool.query(`UPDATE users SET avatar_url = COALESCE(avatar_url, :pic) WHERE id = :id`, {
          pic,
          id: row.id,
        });
      }
      const [rFresh] = await pool.query(
        `SELECT id, email, display_name AS displayName, avatar_url AS avatarUrl,
                preferred_interest AS preferredInterest, account_type AS accountType
         FROM users WHERE id = :id LIMIT 1`,
        { id: row.id },
      );
      row = rFresh[0];
    }

    const accountType = row.accountType ?? "customer";
    const role = accountType === "admin" ? "admin" : "customer";
    const token = jwt.sign(
      { sub: row.id, email: row.email, role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: process.env.JWT_EXPIRES || "7d" },
    );
    const hash = new URLSearchParams({ token }).toString();
    const nextQ = encodeURIComponent(redirectAfter);
    return res.redirect(`${CLIENT_ORIGIN}/login?next=${nextQ}#${hash}`);
  } catch (err) {
    const code = err?.code;
    const sqlMsg = String(err?.sqlMessage || err?.message || "");
    if (code === "ER_BAD_FIELD_ERROR" && /facebook_id/i.test(sqlMsg)) {
      return res.redirect(
        `${CLIENT_ORIGIN}/login?facebook_error=${encodeURIComponent(
          "Database needs the Facebook migration. In a terminal: cd server && npm run migrate:facebook",
        )}`,
      );
    }
    next(err);
  }
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
  const row = rows[0];
  const accountType = row.accountType ?? "customer";
  const role = accountType === "admin" ? "admin" : "customer";
  res.json({
    ...row,
    name: row.displayName,
    accountType,
    role,
  });
});

export default router;
