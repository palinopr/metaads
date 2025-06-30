-- Create meta_connections table
CREATE TABLE IF NOT EXISTS meta_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  meta_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  name TEXT,
  email TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meta_connections_user_id ON meta_connections(user_id);

-- Create meta_ad_accounts table
CREATE TABLE IF NOT EXISTS meta_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT,
  timezone_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_user_id ON meta_ad_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_selected ON meta_ad_accounts(user_id, is_selected) WHERE is_selected = true;