#!/bin/bash
# Quick deployment script for AI Marketing Platform

echo "🚀 Deploying to Railway..."
echo "========================"

# Check if in correct directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Not in project directory"
    echo "Run: cd /Users/jaimeortiz/Test\ Main/metaads-new"
    exit 1
fi

# Deploy to Railway
echo "📦 Deploying Python backend..."
railway up --service metaads-python-api

# Wait a moment
echo "⏳ Waiting for deployment to start..."
sleep 5

# Show logs
echo "📊 Deployment logs:"
railway logs

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "🔗 Service URL: https://metaads-python-api-production.up.railway.app"
echo "📊 Dashboard: https://railway.com/project/88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e"
echo ""
echo "Test with: curl https://metaads-python-api-production.up.railway.app"