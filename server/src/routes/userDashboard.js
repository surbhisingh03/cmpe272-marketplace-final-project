import { Router } from "express";
import { getPool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
  const pool = getPool();
  const uid = req.user.id;

  const [[visitStats]] = await pool.query(
    `SELECT COUNT(*) AS totalVisits,
            COUNT(DISTINCT company_id) AS companiesVisited,
            COUNT(DISTINCT product_id) AS productsVisited
     FROM visits WHERE user_id = :uid`,
    { uid }
  );

  const [recentVisits] = await pool.query(
    `SELECT v.visited_at AS at, p.name AS productName, p.id AS productId, p.hero_image AS heroImage,
            c.name AS companyName, c.slug AS companySlug
     FROM visits v
     JOIN products p ON p.id = v.product_id
     JOIN companies c ON c.id = v.company_id
     WHERE v.user_id = :uid ORDER BY v.visited_at DESC LIMIT 12`,
    { uid }
  );

  const [byCompany] = await pool.query(
    `SELECT c.name AS companyName, COUNT(*) AS visits
     FROM visits v JOIN companies c ON c.id = v.company_id
     WHERE v.user_id = :uid GROUP BY c.id ORDER BY visits DESC`,
    { uid }
  );

  const [reviews] = await pool.query(
    `SELECT COUNT(*) AS c FROM reviews WHERE user_id = :uid`,
    { uid }
  );

  const [favs] = await pool.query(
    `SELECT COUNT(*) AS c FROM favorites WHERE user_id = :uid`,
    { uid }
  );

  const [trending] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.hero_image AS heroImage, p.popularity_score AS score,
            c.slug AS companySlug, c.name AS companyName
     FROM products p JOIN companies c ON c.id = p.company_id
     ORDER BY p.popularity_score DESC LIMIT 6`
  );

  const [activity] = await pool.query(
    `(SELECT 'visit' AS type, visited_at AS at, CONCAT('Viewed ', p.name) AS label
      FROM visits v JOIN products p ON p.id = v.product_id WHERE v.user_id = :u1)
     UNION ALL
     (SELECT 'review' AS type, created_at AS at, CONCAT('Reviewed ', p.name) AS label
      FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.user_id = :u2)
     ORDER BY at DESC LIMIT 15`,
    { u1: uid, u2: uid }
  );

  const [heatmap] = await pool.query(
    `SELECT DATE(visited_at) AS d, COUNT(*) AS n
     FROM visits WHERE user_id = :uid AND visited_at >= (CURDATE() - INTERVAL 20 DAY)
     GROUP BY DATE(visited_at)`,
    { uid }
  );

  res.json({
    stats: {
      totalVisits: visitStats.totalVisits,
      companiesVisited: visitStats.companiesVisited,
      productsVisited: visitStats.productsVisited,
      reviewsWritten: reviews[0].c,
      favorites: favs[0].c,
    },
    recentVisits,
    visitsByCompany: byCompany,
    trendingServices: trending,
    activityTimeline: activity,
    visitHeatmap: heatmap,
  });
});

export default router;
