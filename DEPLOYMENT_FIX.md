# MetaAds Deployment Fix Guide

## Issues Fixed

### 1. ✅ TypeScript Build Errors
- **Problem**: TypeScript errors in examples directory and component files
- **Solution**: 
  - Excluded `examples` directory from TypeScript compilation in `tsconfig.json`
  - Fixed type issues in `simple-chat-prototype.tsx` by adding proper interface

### 2. 🔧 Database Configuration Issue
- **Problem**: The application expects PostgreSQL in production but environment variables might not be set correctly
- **Solution**: You need to set proper PostgreSQL database credentials in your deployment platform

## Required Environment Variables for Deployment

For successful deployment, you MUST set these environment variables in your deployment platform (Vercel, etc.):

### Critical Variables
```bash
# PostgreSQL Database (required for production)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth (required)
NEXTAUTH_URL="https://your-deployed-url.vercel.app"
NEXTAUTH_SECRET="generate-a-secure-random-string"

# Facebook OAuth (required for auth to work)
FACEBOOK_APP_ID="your-real-facebook-app-id"
FACEBOOK_APP_SECRET="your-real-facebook-app-secret"
NEXT_PUBLIC_FACEBOOK_APP_ID="your-real-facebook-app-id"
```

### Optional but Recommended
```bash
# Supabase (if using Supabase features)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI Configuration (for AI features)
AI_PROVIDER="openai"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Encryption
ENCRYPTION_KEY="generate-a-secure-key"

# Admin emails
ADMIN_EMAILS="admin@yourdomain.com"
NEXT_PUBLIC_ADMIN_EMAILS="admin@yourdomain.com"
```

## Steps to Fix Deployment

### 1. Set Up PostgreSQL Database
You need a PostgreSQL database. Options:
- **Supabase**: Free tier available at https://supabase.com
- **Vercel Postgres**: Available in Vercel dashboard
- **Neon**: Free tier at https://neon.tech
- **Railway**: https://railway.app

### 2. Configure Environment Variables in Vercel
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all the required variables listed above
4. Make sure to use the production database URL

### 3. Set Up Facebook App
1. Go to https://developers.facebook.com
2. Create a new app or use existing
3. Add Facebook Login product
4. Set redirect URLs:
   - `https://your-app.vercel.app/api/auth/callback/facebook`
   - `https://your-app.vercel.app/api/auth/meta/callback`
5. Copy App ID and App Secret to environment variables

### 4. Generate Secure Secrets
For `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`, generate secure random strings:
```bash
openssl rand -base64 32
```

### 5. Run Database Migrations
After deployment with proper database URL:
1. Install Vercel CLI: `npm i -g vercel`
2. Link to project: `vercel link`
3. Run migrations: `vercel env pull .env.local && npm run db:push`

## Common Deployment Errors and Solutions

### Error: "Module not found"
- Ensure all dependencies are in `package.json` (not devDependencies if needed in production)

### Error: "Database connection failed"
- Check DATABASE_URL format and credentials
- Ensure database is accessible from Vercel's servers
- Add `?sslmode=require` to PostgreSQL URLs

### Error: "NEXTAUTH_URL mismatch"
- Set NEXTAUTH_URL to your exact deployment URL (https://your-app.vercel.app)

### Error: "Facebook OAuth error"
- Verify Facebook App ID and Secret
- Check redirect URLs in Facebook app settings
- Ensure app is in "Live" mode (not development)

## Quick Deployment Checklist

- [ ] All TypeScript errors fixed (run `npm run build` locally)
- [ ] PostgreSQL database created and accessible
- [ ] All required environment variables set in Vercel
- [ ] Facebook app configured with correct redirect URLs
- [ ] Database migrations run after deployment
- [ ] NEXTAUTH_URL matches deployment URL

## Test After Deployment

1. Visit your deployed URL
2. Try to sign in with Facebook
3. Check browser console for errors
4. Check Vercel function logs for server errors

If you still see errors, check the Vercel function logs for specific error messages.