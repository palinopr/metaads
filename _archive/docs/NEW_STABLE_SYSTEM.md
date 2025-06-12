# 🚀 New Stable System - No More Crashes!

## Quick Start (Use This!)

```bash
# Method 1: Automatic (Recommended)
./start.sh

# Method 2: Manual with PM2
npm install -g pm2
npm run build
npm run start:pm2

# Method 3: Stable development
npm run dev:stable
```

## What's Different Now?

### 1. **PM2 Process Manager**
- Auto-restarts if crash
- Memory limit protection
- Logs everything
- Never loses your work

### 2. **Error Boundaries Everywhere**
- No more white screens
- Graceful error messages
- Auto-recovery

### 3. **Smart Token Management**
- Tokens stored securely
- Auto-detection of expiry
- Clear UI for updates

### 4. **Professional Architecture**
```
Before: Everything crashes together 💥
After:  Components fail independently ✅
```

## Commands You Need

### Start/Stop
```bash
# Start dashboard
./start.sh

# Stop dashboard
npm run stop

# View logs
npm run logs

# Restart
pm2 restart meta-ads-dashboard
```

### Development
```bash
# Stable dev mode (recommended)
npm run dev:stable

# Traditional dev (might crash)
npm run dev

# Production build
npm run build
npm start
```

## If Something Goes Wrong

### 1. Token Expired?
- Look for the floating card in bottom-right
- Click "Update Token"
- Paste new token
- Done!

### 2. Server Won't Start?
```bash
# Kill everything and restart
lsof -ti:3000 | xargs kill -9
./start.sh
```

### 3. Seeing Errors?
- Check logs: `npm run logs`
- Clear cache: `rm -rf .next`
- Restart: `./start.sh`

## New Features

### 1. **Health Check**
Visit: http://localhost:3000/api/health

### 2. **Performance Monitor**
- Tracks every API call
- Shows slow queries
- Memory usage alerts

### 3. **Auto-Sync**
- Refreshes data every 5 minutes
- Works in background
- No manual refresh needed

## The Tech Stack

### Current (Stable)
- Next.js + Custom Server
- PM2 Process Manager
- Error Boundaries
- Local Storage Cache

### Coming Soon
- PostgreSQL Database
- Redis Cache
- Background Jobs
- Real-time Updates

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Add your credentials:
```env
NEXT_PUBLIC_META_ACCESS_TOKEN=your_token_here
NEXT_PUBLIC_META_AD_ACCOUNT_ID=act_123456789
```

## Monitoring

### Check Status
```bash
pm2 status
```

### View Metrics
```bash
pm2 monit
```

### Check Logs
```bash
# All logs
pm2 logs

# Just errors
pm2 logs --err

# Clear logs
pm2 flush
```

## Best Practices

1. **Always use `./start.sh` for production**
2. **Check logs regularly**
3. **Update tokens before they expire**
4. **Don't use Ctrl+C to stop (use `npm run stop`)**

## What's Next?

### This Week
- ✅ Stable server (DONE!)
- 🔄 Add database
- 🔄 Background sync
- 🔄 Email alerts

### Next Week
- AI predictions
- Automated optimization
- Multi-account support
- Mobile app

## The Promise

**No more crashes. Period.**

If it crashes, it auto-restarts. If there's an error, you see a nice message. If the token expires, you get a simple form.

This is how professional software works.

---

Ready? Run `./start.sh` and enjoy your stable dashboard! 🎉