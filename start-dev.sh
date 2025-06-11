#!/bin/bash
# Start Next.js dev server with error handling

echo "Starting Meta Ads Dashboard..."

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Clear Next.js cache
rm -rf .next/cache

# Start the dev server
PORT=3000 npm run dev