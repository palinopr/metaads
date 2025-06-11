# Quick Deploy Guide

## Before Every Deployment

Run this command to check if your app is safe to deploy:

```bash
npm run pre-deploy
```

This checks:
- ✅ Dependencies installed
- ✅ Environment setup
- ✅ TypeScript compiles
- ✅ Critical files exist
- ✅ Build succeeds

## If All Checks Pass

Deploy with:

```bash
npm run deploy
```

This will:
1. Run pre-deploy checks again
2. Start the production server with PM2

## If Checks Fail

1. **TypeScript errors**: Fix any type errors in your code
2. **Missing env file**: Create `.env.local` with your Meta credentials
3. **Build failures**: Check error messages and fix code issues

## To Test Token Updates Without Crashes

1. Start dev server: `npm run dev`
2. Go to settings and update token
3. Verify server stays online
4. If it crashes, check logs

## Emergency Commands

- View logs: `npm run logs`
- Stop server: `npm run stop`
- Stable dev mode: `npm run dev:stable`

---
Remember: The pre-deploy check ensures your app "always works" before going live!