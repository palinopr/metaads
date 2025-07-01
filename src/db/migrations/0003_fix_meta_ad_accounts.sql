-- Drop the existing meta_ad_accounts table
DROP TABLE IF EXISTS meta_ad_accounts CASCADE;

-- Recreate meta_ad_accounts with correct structure
CREATE TABLE meta_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT,
  timezone_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_meta_ad_accounts_user_id ON meta_ad_accounts(user_id);
CREATE INDEX idx_meta_ad_accounts_selected ON meta_ad_accounts(user_id, is_selected) WHERE is_selected = true;
CREATE INDEX idx_meta_ad_accounts_connection ON meta_ad_accounts(connection_id);