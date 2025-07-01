-- Fix column name mismatches between schema and database
-- Rename timezone_name to timezone
ALTER TABLE meta_ad_accounts RENAME COLUMN timezone_name TO timezone;

-- Drop is_active column as it's been replaced with account_status
ALTER TABLE meta_ad_accounts DROP COLUMN IF EXISTS is_active;

-- Add account_status column to match schema
ALTER TABLE meta_ad_accounts ADD COLUMN IF NOT EXISTS account_status INTEGER;

-- Update the column to match Drizzle schema naming convention
-- Drizzle uses camelCase in TypeScript but converts to snake_case in PostgreSQL