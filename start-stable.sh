#!/bin/bash

echo "🚀 Starting Meta Ads Dashboard (Stable Mode)"
echo "==========================================="

# Kill any existing processes on ports 3000-3001
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Clear Next.js cache
echo "🗑️  Clearing cache..."
rm -rf .next

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start the server with auto-restart on crash
echo "🔄 Starting server with auto-restart..."
while true; do
    echo "✅ Server starting on http://localhost:3000"
    npm run dev
    
    # If server crashes, wait 2 seconds and restart
    echo "❌ Server crashed! Restarting in 2 seconds..."
    sleep 2
done