# Authentication Debug Report

## Issues Found

### 1. **CRITICAL: NEXTAUTH_URL has a newline character in production**
- **Current value**: `"https://metaads-web.vercel.app\n"`
- **Should be**: `"https://metaads-web.vercel.app"`
- **Impact**: This causes NextAuth to fail URL validation, preventing authentication

### 2. **Environment Variable Configuration**
- The production environment has the correct NEXTAUTH_URL but with an extra newline
- All other required environment variables are present and correct

### 3. **Database Connection**
- Database credentials are correctly set
- The connection string uses Supabase with pgbouncer

## Debug Endpoints Created

### `/api/debug-auth`
A comprehensive debug endpoint that checks:
- Environment variables
- Database connection
- Admin user existence
- Password hashing and validation
- NextAuth configuration
- Direct authorization function testing

**Usage**:
```bash
# GET request to check auth status
curl https://metaads-web.vercel.app/api/debug-auth

# POST request to create/update user
curl -X POST https://metaads-web.vercel.app/api/debug-auth \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@metaads.com", "password": "Admin123!", "testOnly": false}'
```

## Immediate Action Required

### Fix the NEXTAUTH_URL in Vercel:

```bash
# Remove and re-add NEXTAUTH_URL without the newline
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# When prompted, enter: https://metaads-web.vercel.app
```

## Testing Steps

1. **First, fix the NEXTAUTH_URL environment variable** (most important)

2. **Test the debug endpoint**:
   ```bash
   curl https://metaads-web.vercel.app/api/debug-auth
   ```

3. **If admin user doesn't exist or password is invalid, create/update it**:
   ```bash
   curl -X POST https://metaads-web.vercel.app/api/debug-auth \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@metaads.com", "password": "Admin123!", "testOnly": false}'
   ```

4. **Try logging in again** at https://metaads-web.vercel.app/sign-in

## Additional Debugging Commands

```bash
# Check current environment variables
vercel env ls production

# Pull and inspect production env
vercel env pull .env.production --environment production
cat .env.production | grep NEXTAUTH_URL

# Check latest deployment
vercel ls | head -5
```

## Root Cause Analysis

The authentication is failing because:
1. The NEXTAUTH_URL has a trailing newline character which causes URL validation to fail
2. NextAuth compares the callback URL with NEXTAUTH_URL and they don't match due to the newline
3. This results in the generic "Invalid email or password" error even though the credentials are correct

## Prevention

When setting environment variables in Vercel:
- Always double-check for trailing whitespace or newlines
- Use the Vercel CLI carefully when adding environment variables
- Test authentication immediately after deployment