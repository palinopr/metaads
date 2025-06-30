# Admin Login Debug Guide

## Issues Found

1. **Missing Password Field in Database**: The initial migration (`0000_initial_auth_tables.sql`) doesn't include a password field in the user table, but the application schema expects it.

2. **Database Connection Mismatch**: 
   - The app was using `DATABASE_URL` (pooled connection) which might have different behavior
   - Fixed to use `DIRECT_URL` (direct connection) when available

3. **Local vs Production Database**: The production deployment needs the same database migrations applied.

## Steps to Fix

### 1. Apply the Missing Migration to Production Database

Run the new migration file (`0001_add_password_field.sql`) on your production database:

```bash
# Connect to your Supabase database and run:
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" TEXT;
```

### 2. Verify Vercel Environment Variables

In your Vercel dashboard for the project:

1. Go to Settings → Environment Variables
2. Ensure these are set:
   - `DATABASE_URL`: The pooled connection string from Supabase
   - `DIRECT_URL`: The direct connection string from Supabase
   - `NEXTAUTH_SECRET`: Must match your local one
   - `NEXTAUTH_URL`: Should be `https://metaads-hoxz7d7jh-palinos-projects.vercel.app`

### 3. Create Admin User in Production

Option A: Use the script locally but connect to production:
```bash
# Temporarily update .env.local with production database URLs
npx tsx scripts/create-admin.ts admin@example.com yourpassword "Admin User"
```

Option B: Create directly in Supabase SQL Editor:
```sql
-- Replace these values with your actual admin credentials
INSERT INTO "user" (email, password, name, "emailVerified")
VALUES (
  'admin@example.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash the password
  'Admin User',
  NOW()
);
```

To generate a bcrypt hash, you can use:
```bash
# In Node.js console:
const bcrypt = require('bcryptjs')
bcrypt.hash('yourpassword', 10).then(hash => console.log(hash))
```

### 4. Test the Fix

1. Redeploy to Vercel after fixing environment variables
2. Try logging in with your admin credentials

## Database URLs Explained

- **DATABASE_URL**: Uses PgBouncer (connection pooling), good for serverless but might have issues with migrations
- **DIRECT_URL**: Direct connection to database, better for migrations and admin operations

The code now prioritizes `DIRECT_URL` when available to avoid pooling issues.

## Troubleshooting

If login still fails:

1. Check Vercel Function logs for specific errors
2. Verify the password field exists in the production database
3. Ensure the user exists with a hashed password
4. Check that `NEXTAUTH_SECRET` matches between environments