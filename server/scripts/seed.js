import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { computePopularityScore } from "../src/utils/score.js";
import { getMarketplaceProductSeeds } from "./catalogSeeds.js";

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    multipleStatements: true,
  });

  const schema = `
    CREATE DATABASE IF NOT EXISTS fusionhub;
    USE fusionhub;
    
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS visits;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS companies;
    DROP TABLE IF EXISTS users;
    
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(120) NOT NULL,
      avatar_url VARCHAR(512) NULL,
      phone VARCHAR(40) NOT NULL DEFAULT '',
      preferred_interest ENUM('coffee','creative','travel','academy','all') NOT NULL DEFAULT 'all',
      account_type ENUM('customer','admin') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      tagline VARCHAR(255) NULL,
      description TEXT NOT NULL,
      banner_url VARCHAR(512) NOT NULL,
      external_url VARCHAR(512) NOT NULL,
      avg_rating DECIMAL(3,2) DEFAULT 4.70,
      review_count INT DEFAULT 128
    );
    
    CREATE TABLE products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      slug VARCHAR(120) NOT NULL,
      name VARCHAR(200) NOT NULL,
      excerpt VARCHAR(380) NOT NULL,
      description TEXT NOT NULL,
      hero_image VARCHAR(512) NOT NULL,
      category VARCHAR(80) NULL,
      listing_details JSON NULL,
      visit_count INT DEFAULT 0,
      popularity_score DECIMAL(12,4) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_company_slug (company_id, slug),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
    
    CREATE TABLE visits (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      company_id INT NOT NULL,
      product_id INT NOT NULL,
      visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_user_time (user_id, visited_at)
    );
    
    CREATE TABLE favorites (
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    
    CREATE TABLE reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      title VARCHAR(180) NOT NULL,
      body TEXT NOT NULL,
      rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      recommend BOOLEAN DEFAULT TRUE,
      verified BOOLEAN DEFAULT TRUE,
      status ENUM('published','pending','hidden') DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product_status (product_id, status),
      UNIQUE KEY uniq_user_product (user_id, product_id)
    );
  `;

  await conn.query(schema);

  const companies = [
    {
      slug: "srikavya-enterprise",
      name: "Bean & Brew Co.",
      tagline: "Artisan coffee experiences",
      description:
        "Premium artisan coffee, blends, and cafe experiences. Ethically sourced small-batch roasts and signature Portland storytelling.",
      banner_url:
        "https://images.unsplash.com/photo-1447933601403-0c6688de94e5?w=1600&q=80",
      external_url: "https://srikavyagelli.com/index.php",
      avg_rating: 4.82,
      review_count: 214,
    },
    {
      slug: "krativerse",
      name: "Krativerse",
      tagline: "Echo Creative Studio — stories that resonate",
      description:
        "Video production, photography, and creative branding. Resonance Finder treatments, campaigns, and cinematic brand storytelling.",
      banner_url:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=80",
      external_url: "https://krativerse.com/",
      avg_rating: 4.76,
      review_count: 189,
    },
    {
      slug: "travel-agency",
      name: "Seaside Travels",
      tagline: "Premium travel planning worldwide",
      description:
        "Luxury escapes and adventure itineraries with 24/7 support. Personalized routes, curated stays, and transparent planning.",
      banner_url:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80",
      external_url: "https://surbhisingh.com/travel-agency/index.php",
      avg_rating: 4.71,
      review_count: 156,
    },
    {
      slug: "nexus-academy",
      name: "Nexus Academy",
      tagline: "Cross-domain enterprise learning",
      description:
        "Unified education and upskilling for modern enterprises. Workshops, certifications, and intelligent learning tracks.",
      banner_url:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80",
      external_url: "http://geeshitha.com/nexus-academy/",
      avg_rating: 4.69,
      review_count: 142,
    },
  ];

  for (const c of companies) {
    await conn.query(
      `INSERT INTO companies (slug, name, tagline, description, banner_url, external_url, avg_rating, review_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.slug,
        c.name,
        c.tagline,
        c.description,
        c.banner_url,
        c.external_url,
        c.avg_rating,
        c.review_count,
      ]
    );
  }

  const [companyRows] = await conn.query("SELECT id, slug FROM companies");
  const idBySlug = Object.fromEntries(companyRows.map((r) => [r.slug, r.id]));

  /** Marketplace catalog seeded from partner public pages (exact SKUs/services where listed) */
  const products = getMarketplaceProductSeeds(idBySlug);

  for (const p of products) {
    const score = computePopularityScore(
      p.visits,
      p.seedAvg ?? 4.7,
      p.seedReviews ?? 30
    );
    await conn.query(
      `INSERT INTO products (company_id, slug, name, excerpt, description, hero_image, category, visit_count, popularity_score, listing_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.cid,
        p.slug,
        p.name,
        p.excerpt,
        p.description,
        p.hero_image,
        p.category,
        p.visits,
        score,
        p.listing_details ? JSON.stringify(p.listing_details) : null,
      ]
    );
  }

  const demoHash = await bcrypt.hash("MarketplaceDemo!", 11);
  await conn.query(
    `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type)
     VALUES (?, ?, ?, ?, 'all', 'customer')`,
    ["marketplace-demo@fusionhub.demo", demoHash, "Marketplace Demo", ""]
  );

  const adminHash = await bcrypt.hash("fusionhub123", 11);
  await conn.query(
    `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type)
     VALUES (?, ?, ?, ?, 'all', 'admin')`,
    ["admin@fusionhub.demo", adminHash, "FusionHub Admin", ""]
  );

  const reviewsPlanned = products.reduce((acc, row) => acc + Number(row.seedReviews || 22), 0);
  const reviewPoolTarget = reviewsPlanned + 400;

  const reviewUserHash = await bcrypt.hash("FusionReviewPool#1", 4);
  for (let i = 1; i <= reviewPoolTarget; i++) {
    await conn.query(
      `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type)
       VALUES (?, ?, ?, ?, 'all', 'customer')`,
      [`review.pool.${i}@fusionhub.demo`, reviewUserHash, `Marketplace reviewer ${i}`, ""]
    );
  }

  const [prows] = await conn.query("SELECT id, slug FROM products");
  const slugToProductId = Object.fromEntries(prows.map((r) => [r.slug, r.id]));

  function ratingsFoursAndFives(n, avg) {
    const clampedAvg = Math.max(4.05, Math.min(4.95, avg));
    let hi = Math.round(n * (clampedAvg - 4)); // counts of five-star reviews when base is four
    hi = Math.max(0, Math.min(n, hi));
    return [...Array(hi).fill(5), ...Array(n - hi).fill(4)];
  }

  const [poolRows] = await conn.query(
    "SELECT id FROM users WHERE email LIKE 'review.pool.%@fusionhub.demo' ORDER BY id"
  );
  const reviewerIds = poolRows.map((r) => r.id);
  let rCursor = 0;

  const reviewTargetsBySlug = products.map((p) => [p.slug, p.seedReviews, p.seedAvg]);
  for (const [slug, count, avg] of reviewTargetsBySlug) {
    const productId = slugToProductId[slug];
    if (!productId) continue;
    const ratings = ratingsFoursAndFives(count, avg);
    for (let i = 0; i < count; i++) {
      const uid = reviewerIds[rCursor++];
      await conn.query(
        `INSERT INTO reviews (user_id, product_id, title, body, rating, recommend, verified, status)
         VALUES (?, ?, ?, ?, ?, TRUE, TRUE, 'published')`,
        [
          uid,
          productId,
          `Verified shopper note ${i + 1}`,
          "Seeded FusionHub Marketplace review powering ratings, personalization, and top-five leaderboard analytics.",
          ratings[i],
        ]
      );
    }
  }

  const [everyProduct] = await conn.query(
    `SELECT id, visit_count FROM products`
  );
  for (const row of everyProduct) {
    const [statRows] = await conn.query(
      `SELECT AVG(rating) AS ar, COUNT(*) AS rc FROM reviews WHERE product_id = ? AND status = 'published'`,
      [row.id]
    );
    const agg = statRows[0];
    const rc = agg?.rc != null ? Number(agg.rc) : 0;
    const ar = rc > 0 && agg?.ar != null ? Number(agg.ar) : 0;
    const score = computePopularityScore(Number(row.visit_count) || 0, ar, rc);
    await conn.query("UPDATE products SET popularity_score = ? WHERE id = ?", [score, row.id]);
  }

  await conn.end();
  console.log("FusionHub seed complete. Database: fusionhub");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
