-- Add Facebook Login support to existing PostgreSQL / Supabase databases.
-- Run once, either:
--   cd server && npm run migrate:facebook
--   psql "$DATABASE_URL" -f server/scripts/migrate-add-facebook.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(64) NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_facebook_id ON users (facebook_id) WHERE facebook_id IS NOT NULL;

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
