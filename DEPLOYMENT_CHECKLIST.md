# MetaAds Production Deployment Checklist

This checklist should be followed before deploying to production on Vercel.

## Pre-Deployment Checks

### 1. Code Quality
- [ ] Run `npm run lint` - No errors
- [ ] Run `npm run typecheck` - No TypeScript errors
- [ ] Run `npm run build` - Build succeeds locally
- [ ] Run `npm test` - All tests pass (if applicable)

### 2. Environment Variables
Ensure all production environment variables are set in Vercel:

#### Required Variables
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct database connection (no pooling)
- [ ] `NEXTAUTH_URL` - Production URL (e.g., https://metaads.vercel.app)
- [ ] `NEXTAUTH_SECRET` - Strong production secret

#### Facebook OAuth
- [ ] `FACEBOOK_APP_ID` - Production Facebook App ID
- [ ] `FACEBOOK_APP_SECRET` - Production Facebook App Secret
- [ ] `NEXT_PUBLIC_FACEBOOK_APP_ID` - Same as FACEBOOK_APP_ID

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key

#### AI Configuration
- [ ] `AI_PROVIDER` - Set to "openai" or "anthropic"
- [ ] `OPENAI_API_KEY` - Production OpenAI key
- [ ] `ANTHROPIC_API_KEY` - Production Anthropic key

#### Security
- [ ] `ENCRYPTION_KEY` - Strong encryption key for sensitive data

### 3. Database Migrations
- [ ] Generate migration: `npm run db:generate`
- [ ] Test migration locally: `npm run db:migrate`
- [ ] Backup production database
- [ ] Run migration on production

### 4. Facebook App Configuration
- [ ] Facebook App is in Live mode (not Development)
- [ ] Valid OAuth Redirect URIs include production URL
- [ ] App has required permissions approved
- [ ] Business verification completed (if needed)

### 5. Security Checks
- [ ] No `.env` file in git repository
- [ ] No hardcoded secrets in code
- [ ] API rate limiting configured
- [ ] CORS settings appropriate for production

## Deployment Steps

### 1. Push to GitHub
```bash
# Add all files
git add .

# Create commit
git commit -m "feat: Add context engineering setup for AI-assisted development"

# Push to main branch
git push origin main
```

### 2. Vercel Deployment
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Check deployment logs for any errors
3. Verify all environment variables are set
4. Test deployment preview before promoting to production

### 3. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test authentication flow
- [ ] Verify Facebook OAuth works
- [ ] Check database connectivity
- [ ] Test core features
- [ ] Monitor error logs

## Rollback Plan
If issues occur:
1. Revert to previous deployment in Vercel
2. Identify and fix issues
3. Test thoroughly before redeploying

## Monitoring
- Set up error tracking (e.g., Sentry)
- Configure uptime monitoring
- Set up alerts for critical errors
- Monitor Meta API rate limits

## Regular Maintenance
- Review and rotate API keys quarterly
- Update dependencies monthly
- Review and optimize database queries
- Monitor and optimize costs

---

**Remember**: Always test in a staging environment before deploying to production!