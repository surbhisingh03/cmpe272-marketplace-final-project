import { Router } from "express";
import { getPool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computePopularityScore } from "../utils/score.js";

const router = Router();

/** Recent published reviews across the marketplace (Explore hub feed). */
router.get("/recent", async (req, res) => {
  const pool = getPool();
  const raw = Number(req.query.limit);
  const limit = Math.min(Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 12, 40);
  const [rows] = await pool.query(
    `SELECT r.title, r.body, r.rating, r.created_at AS createdAt,
            u.display_name AS authorName, p.name AS productName,
            c.name AS companyName, c.slug AS companySlug
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     JOIN companies c ON c.id = p.company_id
     WHERE r.status = 'published'
     ORDER BY r.created_at DESC
     LIMIT :lim`,
    { lim: limit }
  );
  res.json({ reviews: rows });
});

router.get("/products/:productId", async (req, res) => {
  const pool = getPool();
  const pid = Number(req.params.productId);
  const [rows] = await pool.query(
    `SELECT r.id, r.title, r.body, r.rating, r.recommend, r.verified, r.created_at AS createdAt,
            u.display_name AS authorName
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = :pid AND r.status = 'published'
     ORDER BY r.created_at DESC`,
    { pid }
  );
  const [[agg]] = await pool.query(
    `SELECT COUNT(*) AS total, AVG(rating) AS avg,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS s5,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS s4,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS s3,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS s2,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS s1
     FROM reviews WHERE product_id = :pid AND status = 'published'`,
    { pid }
  );
  res.json({ reviews: rows, distribution: agg });
});

router.post("/products/:productId", requireAuth, async (req, res) => {
  const pool = getPool();
  const pid = Number(req.params.productId);
  const { title, body, rating, recommend = true } = req.body || {};
  if (!title || !body || !rating) {
    return res.status(400).json({ error: "Title, body, and rating required" });
  }
  const r = Number(rating);
  if (r < 1 || r > 5) return res.status(400).json({ error: "Rating 1-5" });
  try {
    await pool.query(
      `INSERT INTO reviews (user_id, product_id, title, body, rating, recommend, verified, status)
       VALUES (:uid, :pid, :t, :b, :rate, :rec, TRUE, 'published')`,
      {
        uid: req.user.id,
        pid,
        t: String(title).slice(0, 180),
        b: String(body),
        rate: r,
        rec: Boolean(recommend),
      }
    );
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "You already reviewed this product" });
    }
    throw e;
  }

  const [[row]] = await pool.query(
    `SELECT visit_count AS v,
            (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE product_id = :p1 AND status = 'published') AS ar,
            (SELECT COUNT(*) FROM reviews WHERE product_id = :p2 AND status = 'published') AS rc
     FROM products WHERE id = :p3 LIMIT 1`,
    { p1: pid, p2: pid, p3: pid }
  );
  const rc = Number(row?.rc ?? 0) || 0;
  const ar = rc > 0 ? Number(row?.ar ?? 0) || 0 : 0;
  const score = computePopularityScore(row?.v ?? 0, ar, rc);
  await pool.query("UPDATE products SET popularity_score = :s WHERE id = :pid", {
    s: score,
    pid,
  });

  res.json({ ok: true });
});

router.get("/user/me", requireAuth, async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.id, r.title, r.rating, r.created_at AS createdAt, p.name AS productName, p.id AS productId
     FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE r.user_id = :uid ORDER BY r.created_at DESC LIMIT 50`,
    { uid: req.user.id }
  );
  res.json(rows);
});

export default router;
