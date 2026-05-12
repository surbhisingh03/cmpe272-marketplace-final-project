-- FusionHub Marketplace — PostgreSQL schema (Supabase-ready)
-- Run this in the Supabase SQL editor, or via: psql "$DATABASE_URL" -f schema.postgres.sql

CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  email              VARCHAR(255) NOT NULL UNIQUE,
  password_hash      VARCHAR(255) NOT NULL,
  display_name       VARCHAR(120) NOT NULL,
  phone              VARCHAR(40)  NULL,
  preferred_interest VARCHAR(32)  NOT NULL DEFAULT 'all',
  account_type       VARCHAR(32)  NOT NULL DEFAULT 'customer',
  avatar_url         VARCHAR(512) NULL,
  created_at         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(80)  NOT NULL UNIQUE,
  name          VARCHAR(160) NOT NULL,
  tagline       VARCHAR(255) NULL,
  description   TEXT         NOT NULL,
  banner_url    VARCHAR(512) NOT NULL,
  external_url  VARCHAR(512) NOT NULL,
  avg_rating    NUMERIC(3,2) DEFAULT 4.70,
  review_count  INTEGER      DEFAULT 128
);

CREATE TABLE IF NOT EXISTS products (
  id               SERIAL PRIMARY KEY,
  company_id       INTEGER     NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  slug             VARCHAR(120) NOT NULL,
  name             VARCHAR(200) NOT NULL,
  excerpt          VARCHAR(380) NOT NULL,
  description      TEXT         NOT NULL,
  hero_image       VARCHAR(512) NOT NULL,
  category         VARCHAR(80)  NULL,
  listing_details  JSONB        NULL,
  visit_count      INTEGER      DEFAULT 0,
  popularity_score NUMERIC(12,4) DEFAULT 0,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT uniq_company_slug UNIQUE (company_id, slug)
);

CREATE TABLE IF NOT EXISTS visits (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visits_user_time ON visits (user_id, visited_at);
CREATE INDEX IF NOT EXISTS idx_visits_product   ON visits (product_id);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title      VARCHAR(180) NOT NULL,
  body       TEXT         NOT NULL,
  rating     SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  recommend  BOOLEAN      DEFAULT TRUE,
  verified   BOOLEAN      DEFAULT TRUE,
  status     VARCHAR(16)  NOT NULL DEFAULT 'published'
              CHECK (status IN ('published','pending','hidden')),
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT uniq_review_user_product UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews (product_id, status);
