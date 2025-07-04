#!/bin/bash

# Create New Python Service on Railway
# This script creates a separate service specifically for Python/Flask

echo "🚀 Creating New Python Service on Railway"
echo "========================================="

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login and link to project
echo "🔑 Logging into Railway..."
railway login

echo "🔗 Linking to project..."
railway link -p 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e

echo "📌 Creating new Python service..."
railway service create metaads-python-api

echo "🚀 Deploying to new service..."
railway up --service metaads-python-api

echo "✅ Deployment initiated!"
echo ""
echo "📊 Next Steps:"
echo "1. Check Railway dashboard: https://railway.com/project/88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e"
echo "2. Look for 'metaads-python-api' service (NOT 'metaads')"
echo "3. Wait 2-3 minutes for deployment to complete"
echo "4. Get the URL from Settings → Domains"
echo ""
echo "🧪 Test with: curl https://metaads-python-api.railway.app"