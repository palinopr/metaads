#!/bin/bash
# ULTRATHINKING: Create Python Service with Railway CLI

echo "🧠 RAILWAY CLI - CREATE PYTHON SERVICE"
echo "====================================="
echo ""

# Step 1: Check if railway CLI exists
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  Mac: brew install railway"
    echo "  Linux: curl -fsSL https://railway.app/install.sh | sh"
    echo "  Windows: scoop install railway"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Step 2: Login if needed
echo "📋 Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "Need to login first:"
    railway login
fi

# Step 3: Link to project
echo ""
echo "🔗 Linking to your project..."
echo "Project ID: 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e"
railway link 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e

# Step 4: Create new Python service
echo ""
echo "🚀 Creating new Python service..."
SERVICE_NAME="metaads-python-api"
echo "Service name: $SERVICE_NAME"

# Create the service
railway add --service "$SERVICE_NAME"

# Step 5: Deploy to the new service
echo ""
echo "📦 Deploying Python backend to $SERVICE_NAME..."
railway up --service="$SERVICE_NAME"

# Step 6: Get service URL
echo ""
echo "🌐 Getting service URL..."
railway domain --service="$SERVICE_NAME"

echo ""
echo "====================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Monitor logs: railway logs --service=$SERVICE_NAME"
echo "2. View status: railway status --service=$SERVICE_NAME"
echo "3. Set variables: railway variables set KEY=value --service=$SERVICE_NAME"
echo "====================================="