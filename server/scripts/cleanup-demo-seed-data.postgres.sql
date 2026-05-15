-- Remove historical synthetic seed users/reviews (patterns from older server/scripts/seed.js).
-- Safe to run multiple times. Apply with: psql "$DATABASE_URL" -f server/scripts/cleanup-demo-seed-data.postgres.sql

DELETE FROM reviews
WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'review.pool.%@fusionhub.demo');

DELETE FROM users WHERE email LIKE 'review.pool.%@fusionhub.demo';

DELETE FROM users WHERE email = 'marketplace-demo@fusionhub.demo';

-- Popularity score: visits + (review_count × 10) + (avg_rating × 100), rating terms 0 when no reviews
UPDATE products p
SET popularity_score = ROUND(
  (
    COALESCE(p.visit_count, 0)::numeric
    + COALESCE(
        (SELECT COUNT(*)::numeric FROM reviews r WHERE r.product_id = p.id AND r.status = 'published'),
        0
      )
      * 10
    + CASE
        WHEN COALESCE(
          (SELECT COUNT(*) FROM reviews r2 WHERE r2.product_id = p.id AND r2.status = 'published'),
          0
        ) > 0
        THEN COALESCE(
          (SELECT AVG(r3.rating::numeric) FROM reviews r3 WHERE r3.product_id = p.id AND r3.status = 'published'),
          0
        )
          * 100
        ELSE 0::numeric
      END
  )::numeric,
  4
);

UPDATE companies c
SET
  avg_rating = COALESCE(
    (
      SELECT ROUND(AVG(r.rating::numeric), 2)
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      WHERE p.company_id = c.id AND r.status = 'published'
    ),
    0
  ),
  review_count = COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      WHERE p.company_id = c.id AND r.status = 'published'
    ),
    0
  );
