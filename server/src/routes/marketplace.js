import { Router } from "express";
import { getPool } from "../db.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { computePopularityScore } from "../utils/score.js";

const router = Router();

/** Full unified catalog — listing, filters, aggregates for Explore Marketplace */
router.get("/catalog", async (req, res) => {
  const pool = getPool();
  const [items] = await pool.query(`
    SELECT
      p.id,
      p.slug,
      p.name,
      p.excerpt,
      p.description,
      p.hero_image AS heroImage,
      p.visit_count AS visitCount,
      p.popularity_score AS popularityScore,
      p.category,
      p.created_at AS createdAt,
      c.slug AS companySlug,
      c.name AS companyName,
      c.external_url AS companyUrl,
      ROUND(COALESCE(agg.avg_rating, 0), 2) AS avgRating,
      COALESCE(agg.rc, 0) AS reviewCount
    FROM products p
    JOIN companies c ON c.id = p.company_id
    LEFT JOIN (
      SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS rc
      FROM reviews
      WHERE status = 'published'
      GROUP BY product_id
    ) agg ON agg.product_id = p.id
    ORDER BY p.popularity_score DESC, p.visit_count DESC, p.name
  `);
  res.json({ items });
});

router.get("/companies", async (req, res) => {
  const pool = getPool();
  const [companies] = await pool.query(
    `SELECT c.id, c.slug, c.name, c.tagline, c.description, c.banner_url AS bannerUrl,
            c.external_url AS externalUrl, c.avg_rating AS avgRating, c.review_count AS reviewCount
     FROM companies c ORDER BY c.name`
  );
  const topPreviewByCompany = {};
  for (const c of companies) {
    const [top] = await pool.query(
      `SELECT p.id, p.company_id AS companyId, p.slug, p.name, p.excerpt, p.hero_image AS heroImage,
              p.visit_count AS visitCount, p.category
       FROM products p
       WHERE p.company_id = :cid
       ORDER BY p.popularity_score DESC, p.visit_count DESC
       LIMIT 5`,
      { cid: c.id }
    );
    topPreviewByCompany[String(c.id)] = top;
  }
  res.json({ companies, topPreviewByCompany });
});

router.get("/companies/:slug", async (req, res) => {
  const pool = getPool();
  const [companies] = await pool.query(
    `SELECT id, slug, name, tagline, description, banner_url AS bannerUrl, external_url AS externalUrl,
            avg_rating AS avgRating, review_count AS reviewCount
     FROM companies WHERE slug = :slug LIMIT 1`,
    { slug: req.params.slug }
  );
  if (!companies.length) return res.status(404).json({ error: "Company not found" });
  const company = companies[0];
  const [products] = await pool.query(
    `SELECT id, slug, name, excerpt, description, hero_image AS heroImage, visit_count AS visitCount,
            popularity_score AS popularityScore, category, created_at AS createdAt
     FROM products WHERE company_id = :id ORDER BY popularity_score DESC, visit_count DESC`,
    { id: company.id }
  );
  res.json({ company, products });
});

router.get("/products/:id", optionalAuth, async (req, res) => {
  const pool = getPool();
  const id = Number(req.params.id);
  const [[product]] = await pool.query(
    `SELECT p.id, p.slug, p.name, p.excerpt, p.description, p.hero_image AS heroImage,
            p.visit_count AS visitCount, p.popularity_score AS popularityScore, p.category,
            p.listing_details AS listingDetails,
            c.id AS companyId, c.slug AS companySlug, c.name AS companyName, c.external_url AS companyUrl
     FROM products p JOIN companies c ON c.id = p.company_id WHERE p.id = :id LIMIT 1`,
    { id }
  );
  if (!product) return res.status(404).json({ error: "Product not found" });

  let uniqueVisitors = [{ c: 0 }];
  try {
    [uniqueVisitors] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS c FROM visits WHERE product_id = :pid",
      { pid: id }
    );
  } catch {
    /* ignore */
  }
  const uniqueCount = Number(uniqueVisitors?.[0]?.c ?? 0);
  const visitorCount =
    uniqueCount > 0 ? uniqueCount : Number(product.visitCount || 0);

  const [[stats]] = await pool.query(
    `SELECT COALESCE(AVG(rating),0) AS avg, COUNT(*) AS cnt FROM reviews
     WHERE product_id = :pid AND status = 'published'`,
    { pid: id }
  );

  const [relatedRows] = await pool.query(
    `SELECT id, slug, name, excerpt, hero_image AS heroImage, visit_count AS visitCount
     FROM products WHERE company_id = :cid AND id != :pid
     ORDER BY popularity_score DESC LIMIT 4`,
    { cid: product.companyId, pid: id }
  );

  res.json({
    product: { ...product, uniqueVisitorCount: Number(visitorCount) || 0 },
    ratingStats: { average: Number(stats.avg) || 0, count: stats.cnt },
    related: relatedRows,
  });
});

/** Single listing by URL slug (canonical marketplace detail page). */
router.get("/listing/:slug", optionalAuth, async (req, res) => {
  const pool = getPool();
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) return res.status(404).json({ error: "Listing not found" });

  const [[product]] = await pool.query(
    `SELECT p.id, p.slug, p.name, p.excerpt, p.description, p.hero_image AS heroImage,
            p.visit_count AS visitCount, p.popularity_score AS popularityScore, p.category,
            p.listing_details AS listingDetails,
            c.id AS companyId, c.slug AS companySlug, c.name AS companyName, c.external_url AS companyUrl
     FROM products p
     JOIN companies c ON c.id = p.company_id
     WHERE LOWER(p.slug) = :slug
     LIMIT 1`,
    { slug }
  );
  if (!product) return res.status(404).json({ error: "Listing not found" });

  const id = Number(product.id);
  let uniqueVisitors = [{ c: 0 }];
  try {
    [uniqueVisitors] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS c FROM visits WHERE product_id = :pid",
      { pid: id }
    );
  } catch {
    /* ignore */
  }
  const uniqueCount = Number(uniqueVisitors?.[0]?.c ?? 0);
  const visitorCount = uniqueCount > 0 ? uniqueCount : Number(product.visitCount || 0);

  const [[stats]] = await pool.query(
    `SELECT COALESCE(AVG(rating),0) AS avg, COUNT(*) AS cnt FROM reviews
     WHERE product_id = :pid AND status = 'published'`,
    { pid: id }
  );

  const [relatedRows] = await pool.query(
    `SELECT id, slug, name, excerpt, hero_image AS heroImage, visit_count AS visitCount, category
     FROM products WHERE company_id = :cid AND id != :pid
     ORDER BY popularity_score DESC LIMIT 4`,
    { cid: product.companyId, pid: id }
  );

  res.json({
    product: { ...product, uniqueVisitorCount: Number(visitorCount) || 0 },
    ratingStats: { average: Number(stats.avg) || 0, count: stats.cnt },
    related: relatedRows,
  });
});

router.post("/products/:id/visit", requireAuth, async (req, res) => {
  const pool = getPool();
  const productId = Number(req.params.id);
  const [[p]] = await pool.query(
    "SELECT company_id AS companyId FROM products WHERE id = :pid LIMIT 1",
    { pid: productId }
  );
  if (!p) return res.status(404).json({ error: "Product not found" });
  await pool.query(
    "INSERT INTO visits (user_id, company_id, product_id) VALUES (:uid, :cid, :pid)",
    { uid: req.user.id, cid: p.companyId, pid: productId }
  );
  await pool.query(
    "UPDATE products SET visit_count = visit_count + 1 WHERE id = :pid",
    { pid: productId }
  );
  const [[row]] = await pool.query(
    `SELECT visit_count AS v,
            (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE product_id = :pid2 AND status = 'published') AS ar,
            (SELECT COUNT(*) FROM reviews WHERE product_id = :pid3 AND status = 'published') AS rc
     FROM products WHERE id = :pid4 LIMIT 1`,
    { pid2: productId, pid3: productId, pid4: productId }
  );
  const rc = Number(row?.rc ?? 0) || 0;
  const ar = rc > 0 ? Number(row?.ar ?? 0) || 0 : 0;
  const score = computePopularityScore(row?.v ?? 0, ar, rc);
  await pool.query(
    "UPDATE products SET popularity_score = :score WHERE id = :pid",
    { score, pid: productId }
  );
  res.json({ ok: true });
});

router.get("/leaderboards", async (req, res) => {
  const pool = getPool();
  const [companies] = await pool.query("SELECT id FROM companies");

  const perCompany = {};
  for (const c of companies) {
    const [top] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.excerpt, p.hero_image AS heroImage,
              p.visit_count AS visitCount, p.popularity_score AS popularityScore, p.company_id AS companyId,
              c.slug AS companySlug, c.name AS companyName,
              (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'published') AS reviewCount
       FROM products p JOIN companies c ON c.id = p.company_id
       WHERE p.company_id = :cid ORDER BY popularity_score DESC, visit_count DESC LIMIT 5`,
      { cid: c.id }
    );
    perCompany[c.id] = top;
  }

  const [globalTop] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.excerpt, p.hero_image AS heroImage,
            p.visit_count AS visitCount, p.popularity_score AS popularityScore, p.company_id AS companyId,
            c.slug AS companySlug, c.name AS companyName,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'published') AS reviewCount
     FROM products p JOIN companies c ON c.id = p.company_id
     ORDER BY popularity_score DESC, visit_count DESC LIMIT 5`
  );

  res.json({ perCompany, globalTop });
});

router.post("/favorites/:productId", requireAuth, async (req, res) => {
  const pool = getPool();
  const productId = Number(req.params.productId);
  await pool.query(
    "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (:uid, :pid)",
    { uid: req.user.id, pid: productId }
  );
  res.json({ ok: true });
});

router.delete("/favorites/:productId", requireAuth, async (req, res) => {
  const pool = getPool();
  await pool.query(
    "DELETE FROM favorites WHERE user_id = :uid AND product_id = :pid",
    { uid: req.user.id, pid: Number(req.params.productId) }
  );
  res.json({ ok: true });
});

router.get("/favorites", requireAuth, async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.id, p.slug, p.name, p.excerpt, p.hero_image AS heroImage, p.visit_count AS visitCount,
            c.slug AS companySlug, c.name AS companyName
     FROM favorites f
     JOIN products p ON p.id = f.product_id
     JOIN companies c ON c.id = p.company_id
     WHERE f.user_id = :uid ORDER BY f.created_at DESC`,
    { uid: req.user.id }
  );
  res.json(rows);
});

export default router;
