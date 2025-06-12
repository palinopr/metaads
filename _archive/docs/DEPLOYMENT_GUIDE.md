# Deployment Guide - Meta Ads Dashboard

This guide explains how to deploy your Meta Ads Dashboard safely with pre-deployment validation.

## Pre-Deployment Checklist

Before deploying, ensure:
1. Your Meta access token is valid and not expired
2. All environment variables are properly set
3. The server is running stable locally

## Deployment Commands

### 1. Manual Pre-Deploy Check (Recommended)
```bash
# First, install required dependencies if not already installed
npm install --save-dev ts-node puppeteer chalk

# Run the pre-deployment validation
npm run test:pre-deploy
```

This checks:
- TypeScript compilation
- ESLint errors
- Console.log statements
- Environment variables
- Build success
- Security issues
- Memory leak patterns

### 2. Crash Testing
```bash
# Start your dev server in another terminal
npm run dev

# Run crash tests
npm run test:crash
```

This tests:
- Rapid token updates (your specific issue)
- Invalid API responses
- Memory stress
- Concurrent API calls
- Browser navigation stress

### 3. Health Monitoring
```bash
# With server running
npm run test:health
```

This verifies:
- Homepage loads
- API endpoints respond
- Static assets load

### 4. Full Deployment (All Tests + Deploy)
```bash
# This runs all tests and deploys if they pass
npm run deploy
```

## Manual Testing Before Deployment

1. **Test Token Update Without Crash**:
   - Start the server: `npm run dev`
   - Go to Settings
   - Update your Meta token
   - Verify the server doesn't crash
   - Check that data loads correctly

2. **Test Error Handling**:
   - Use an invalid token
   - Verify error messages appear
   - Ensure the app remains responsive

3. **Test Memory Usage**:
   - Load multiple campaigns
   - Navigate between pages
   - Monitor server logs for errors

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_META_ACCESS_TOKEN=your_token_here
NEXT_PUBLIC_META_AD_ACCOUNT_ID=act_your_account_id
```

## Deployment Steps

1. **Run all validations**:
   ```bash
   npm run pre-deploy
   ```

2. **If all tests pass, build**:
   ```bash
   npm run build
   ```

3. **Start production server**:
   ```bash
   npm run start:pm2
   ```

## Troubleshooting

### If server crashes on token update:
1. Check the server logs: `npm run logs`
2. Ensure error boundaries are in place
3. Verify token format is correct

### If validation fails:
1. Fix TypeScript errors first
2. Address ESLint warnings
3. Remove unnecessary console.logs
4. Ensure all API routes have try-catch blocks

### If crash tests fail:
1. The app may not be handling errors properly
2. Check for unhandled promise rejections
3. Ensure proper cleanup in useEffect hooks

## Production Best Practices

1. Always run `npm run pre-deploy` before deploying
2. Monitor logs after deployment: `npm run logs`
3. Keep a backup of working tokens
4. Use PM2 for process management
5. Set up proper error monitoring

## Emergency Rollback

If issues occur after deployment:
```bash
# Stop the current deployment
npm run stop

# Revert to previous version
git checkout [previous-commit-hash]
npm install
npm run build
npm run start:pm2
```

Remember: The goal is to have a system that "always works" - these validation steps ensure that before any deployment, everything is thoroughly tested.