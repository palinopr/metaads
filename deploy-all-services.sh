#!/bin/bash
echo "🚀 DEPLOYING ALL SERVICES"
echo "========================"
echo ""

# Deploy Python API first
echo "1. Deploying Python API..."
./deploy-python-api.sh

echo ""
echo "2. Deploying Next.js frontend..."
./deploy-nextjs-to-metaads.sh

echo ""
echo "✅ All services deployed!"
echo ""
echo "Service URLs:"
echo "- Python API: https://metaads-python-api-production.up.railway.app"
echo "- Next.js: Check Railway dashboard for metaads service URL"
echo ""
echo "Dashboard: https://railway.com/project/88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e"
