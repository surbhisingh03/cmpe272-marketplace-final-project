-- One-time migration for existing `fusionhub` databases created before profile columns existed.
--
-- Prefer (no mysql root password needed — uses server/.env like seed):
--   cd server && npm run migrate:users
--
-- Or manually: mysql -u YOUR_USER -p fusionhub < scripts/migrate-users-profile.sql
-- Use the same MYSQL_USER as in server/.env (often not literal "root").

USE fusionhub;

ALTER TABLE users ADD COLUMN phone VARCHAR(40) NULL AFTER display_name;
ALTER TABLE users ADD COLUMN preferred_interest VARCHAR(32) NOT NULL DEFAULT 'all' AFTER phone;
ALTER TABLE users ADD COLUMN account_type VARCHAR(32) NOT NULL DEFAULT 'customer' AFTER preferred_interest;
