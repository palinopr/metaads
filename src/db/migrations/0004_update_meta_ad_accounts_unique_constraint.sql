-- Update the unique constraint for meta_ad_accounts
-- First drop the existing unique constraint on (user_id, account_id)
ALTER TABLE meta_ad_accounts DROP CONSTRAINT IF EXISTS meta_ad_accounts_user_id_account_id_key;

-- Make account_id unique globally (since Meta account IDs are globally unique)
ALTER TABLE meta_ad_accounts ADD CONSTRAINT meta_ad_accounts_account_id_unique UNIQUE(account_id);

-- Ensure account_id is NOT NULL
ALTER TABLE meta_ad_accounts ALTER COLUMN account_id SET NOT NULL;

-- Add index on account_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_account_id ON meta_ad_accounts(account_id);