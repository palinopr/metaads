#!/bin/bash

echo "🚀 Starting Meta Ads Dashboard (Stable Mode)"
echo "==========================================="

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Kill any existing processes on port 3000
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clear Next.js cache for fresh start
echo "🗑️  Clearing cache..."
rm -rf .next

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Creating from .env.example..."
    cp .env.example .env.local
    echo "Please update .env.local with your credentials"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js --env production

# Show logs
echo ""
echo "✅ Dashboard is running!"
echo "📊 View at: http://localhost:3000"
echo "📝 View logs: npm run logs"
echo "🛑 Stop server: npm run stop"
echo ""

# Follow logs
pm2 logs