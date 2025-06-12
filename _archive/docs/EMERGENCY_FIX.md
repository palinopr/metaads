# Emergency Fix for Offline Server

## Quick Solution

The server keeps going offline. Here's the immediate fix:

### 1. Kill ALL Node processes:
```bash
killall node
```

### 2. Clear Next.js cache:
```bash
rm -rf .next
rm -rf node_modules/.cache
```

### 3. Use PM2 for production-grade stability:
```bash
# Install PM2 globally if not installed
npm install -g pm2

# Start with PM2
pm2 start npm --name "metaads" -- run dev

# Monitor
pm2 monit

# View logs
pm2 logs

# If it crashes, PM2 will auto-restart it
```

### 4. Alternative: Use a simple HTTP server for testing:
```bash
# Install http-server
npm install -g http-server

# Build the app
npm run build

# Serve the built files
cd .next
http-server -p 3000
```

## Root Cause

The server is likely crashing due to:
1. Memory issues
2. Port conflicts
3. Compilation errors
4. Module resolution issues

## Immediate Action

Run this command to start a stable server:

```bash
# Clean everything
rm -rf .next node_modules package-lock.json

# Reinstall
npm install

# Start with PM2
pm2 start ecosystem.config.js

# Or use the emergency server
node emergency-server.js
```

## If Nothing Works

Create a minimal `server.js`:

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Next.js might be having issues.</p>');
});

app.listen(3000, () => {
  console.log('Emergency server on http://localhost:3000');
});
```

Then run:
```bash
node server.js
```

This will at least confirm your system can run a Node.js server.