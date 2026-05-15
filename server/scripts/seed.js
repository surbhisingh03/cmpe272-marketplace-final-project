/**
 * FusionHub Marketplace seed (PostgreSQL / Supabase).
 *
 * Reads DATABASE_URL (Supabase connection string), drops + recreates the
 * marketplace tables, then loads companies, products, and an admin user.
 * Reviews are not pre-seeded; they come from real signups.
 *
 * Run: npm run seed   (from project root)  — or:  node scripts/seed.js
 */

import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import bcrypt from "bcryptjs";
import pg from "pg";
import { computePopularityScore } from "../src/utils/score.js";
import { getMarketplaceProductSeeds } from "./catalogSeeds.js";

dotenv.config();

pg.types.setTypeParser(20, (v) => (v == null ? null : parseInt(v, 10)));
pg.types.setTypeParser(1700, (v) => (v == null ? null : parseFloat(v)));

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add the Supabase Postgres connection string to server/.env"
    );
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(`
    DROP TABLE IF EXISTS favorites CASCADE;
    DROP TABLE IF EXISTS reviews   CASCADE;
    DROP TABLE IF EXISTS visits    CASCADE;
    DROP TABLE IF EXISTS products  CASCADE;
    DROP TABLE IF EXISTS companies CASCADE;
    DROP TABLE IF EXISTS users     CASCADE;
  `);

  const schemaPath = path.join(__dirname, "schema.postgres.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  await client.query(schemaSql);

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
      avg_rating: 0,
      review_count: 0,
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
      avg_rating: 0,
      review_count: 0,
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
      avg_rating: 0,
      review_count: 0,
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
      avg_rating: 0,
      review_count: 0,
    },
  ];

  for (const c of companies) {
    await client.query(
      `INSERT INTO companies (slug, name, tagline, description, banner_url, external_url, avg_rating, review_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

  const { rows: companyRows } = await client.query("SELECT id, slug FROM companies");
  const idBySlug = Object.fromEntries(companyRows.map((r) => [r.slug, r.id]));

  const products = getMarketplaceProductSeeds(idBySlug);

  for (const p of products) {
    const score = computePopularityScore(p.visits, 0, 0);
    await client.query(
      `INSERT INTO products (company_id, slug, name, excerpt, description, hero_image, category, visit_count, popularity_score, listing_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
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

  const adminHash = await bcrypt.hash("fusionhub123", 11);
  await client.query(
    `INSERT INTO users (email, password_hash, display_name, phone, preferred_interest, account_type)
     VALUES ($1, $2, $3, $4, 'all', 'admin')`,
    ["admin@fusionhub.demo", adminHash, "FusionHub Admin", ""]
  );

  const { rows: everyProduct } = await client.query(
    `SELECT id, visit_count FROM products`
  );
  for (const row of everyProduct) {
    const { rows: statRows } = await client.query(
      `SELECT COALESCE(AVG(rating),0) AS ar, COUNT(*) AS rc
       FROM reviews WHERE product_id = $1 AND status = 'published'`,
      [row.id]
    );
    const agg = statRows[0];
    const rc = agg?.rc != null ? Number(agg.rc) : 0;
    const ar = rc > 0 && agg?.ar != null ? Number(agg.ar) : 0;
    const score = computePopularityScore(Number(row.visit_count) || 0, ar, rc);
    await client.query("UPDATE products SET popularity_score = $1 WHERE id = $2", [
      score,
      row.id,
    ]);
  }

  await client.end();
  console.log("FusionHub seed complete (PostgreSQL / Supabase).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
