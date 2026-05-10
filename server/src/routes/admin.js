import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** Ensures a users row exists for ADMIN_EMAIL (password hash from ADMIN_PASSWORD for DB consistency). */
async function ensureAdminUserRow(pool, emailLower, plainPassword) {
  const [existing] = await pool.query("SELECT id FROM users WHERE email = :e LIMIT 1", { e: emailLower });
  if (existing.length) return;
  const hash = await bcrypt.hash(plainPassword, 11);
  try {
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type)
       VALUES (:e, :h, :n, '', 'all', 'admin')`,
      { e: emailLower, h: hash, n: "FusionHub Admin" }
    );
  } catch {
    await pool.query("INSERT INTO users (email, password_hash, display_name) VALUES (:e, :h, :n)", {
      e: emailLower,
      h: hash,
      n: "FusionHub Admin",
    });
  }
}

async function ensureAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({ error: "Admin not configured" });
    }
    console.warn(
      "[FusionHub] ADMIN_EMAIL/ADMIN_PASSWORD unset — allowing any signed-in user for admin API (dev only)"
    );
    return next();
  }
  const pool = getPool();
  const [users] = await pool.query(
    "SELECT id, email FROM users WHERE email = :e LIMIT 1",
    { e: adminEmail.toLowerCase() }
  );
  if (!users.length) {
    await ensureAdminUserRow(pool, adminEmail.toLowerCase(), adminPass);
  }
  if (req.user?.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

router.post("/login", async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) {
    return res.status(503).json({
      error: "Set ADMIN_EMAIL and ADMIN_PASSWORD in server .env for admin access",
    });
  }
  const { email, password } = req.body || {};
  if (
    String(email || "").toLowerCase() !== adminEmail.toLowerCase() ||
    String(password || "") !== adminPass
  ) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }
  const pool = getPool();
  const emailLower = adminEmail.toLowerCase();
  await ensureAdminUserRow(pool, emailLower, adminPass);
  const [rows] = await pool.query("SELECT id, email FROM users WHERE email = :e LIMIT 1", { e: emailLower });
  const user = rows[0];
  if (!user) {
    return res.status(500).json({ error: "Could not create or load admin user" });
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: "admin" },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
  res.json({ token, user: { id: user.id, email: user.email } });
});

router.get("/overview", requireAuth, ensureAdmin, async (req, res) => {
  const pool = getPool();

  /** Exclude synthetic seed-only reviewers (see server/scripts/seed.js review pool). */
  const [[counts]] = await pool.query(`SELECT 
    (SELECT COUNT(*) FROM users WHERE email NOT LIKE 'review.pool.%@fusionhub.demo') AS users,
    (SELECT COUNT(*) FROM visits) AS visits,
    (SELECT COUNT(*) FROM reviews WHERE status='published') AS reviews,
    (SELECT COUNT(*) FROM products) AS products
  `);

  const [dailyTraffic] = await pool.query(
    `SELECT DATE(visited_at) AS d, COUNT(*) AS n FROM visits
     WHERE visited_at >= (CURDATE() - INTERVAL 14 DAY)
     GROUP BY DATE(visited_at) ORDER BY d ASC`
  );

  const [companyTraffic] = await pool.query(
    `SELECT c.name AS label, COUNT(v.id) AS value
     FROM visits v JOIN companies c ON c.id = v.company_id
     GROUP BY c.id ORDER BY value DESC`
  );

  const [reviewsPending] = await pool.query(
    `SELECT r.id, r.title, r.rating, r.status, r.created_at AS createdAt,
            u.display_name AS author, p.name AS productName, p.id AS productId
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     WHERE r.status = 'pending' ORDER BY r.created_at DESC LIMIT 40`
  );

  const [topProducts] = await pool.query(
    `SELECT p.id, p.name, p.visit_count AS visits, p.popularity_score AS score,
            c.name AS companyName
     FROM products p JOIN companies c ON c.id = p.company_id
     ORDER BY p.popularity_score DESC LIMIT 12`
  );

  res.json({
    counts,
    dailyTraffic,
    companyTraffic,
    reviewsPending,
    topProducts,
  });
});

router.patch("/reviews/:id", requireAuth, ensureAdmin, async (req, res) => {
  const pool = getPool();
  const status = req.body?.status;
  if (!["published", "pending", "hidden"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  await pool.query(
    `UPDATE reviews SET status = :s WHERE id = :id`,
    { s: status, id: Number(req.params.id) }
  );
  const [[pid]] = await pool.query(
    `SELECT product_id AS pid FROM reviews WHERE id = :id LIMIT 1`,
    { id: Number(req.params.id) }
  );
  if (pid) {
    const productId = pid.pid;
    const [[row]] = await pool.query(
      `SELECT visit_count AS v,
              (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE product_id = :p1 AND status = 'published') AS ar,
              (SELECT COUNT(*) FROM reviews WHERE product_id = :p2 AND status = 'published') AS rc
       FROM products WHERE id = :p3 LIMIT 1`,
      { p1: productId, p2: productId, p3: productId }
    );
    const score =
      Math.log1p(Number(row?.v || 0)) * 12 +
      Number(row?.ar || 4) * Math.min(28, Number(row?.rc || 1) * 3);
    await pool.query("UPDATE products SET popularity_score = :s WHERE id = :pid", {
      s: +score.toFixed(4),
      pid: productId,
    });
  }
  res.json({ ok: true });
});

router.get("/products", requireAuth, ensureAdmin, async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.visit_count AS visitCount,
            p.popularity_score AS score, p.category, c.name AS companyName, c.slug AS companySlug
     FROM products p JOIN companies c ON c.id = p.company_id
     ORDER BY p.id DESC LIMIT 500`
  );
  res.json(rows);
});

export default router;
