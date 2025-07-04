#!/bin/bash
echo "🔧 QUICK FIX: Stopping Python deployments to metaads"
echo "==================================================="
echo ""

# Option 1: Just remove Python files from metaads deployment
echo "Creating minimal Next.js deployment package..."
mkdir -p nextjs-only-deploy
cp -r src/app nextjs-only-deploy/
cp -r src/components nextjs-only-deploy/ 2>/dev/null || true
cp -r src/lib nextjs-only-deploy/ 2>/dev/null || true
cp -r src/styles nextjs-only-deploy/ 2>/dev/null || true
cp -r public nextjs-only-deploy/ 2>/dev/null || true
cp package*.json nextjs-only-deploy/
cp next.config.* nextjs-only-deploy/ 2>/dev/null || true
cp tsconfig.json nextjs-only-deploy/
cp tailwind.config.* nextjs-only-deploy/
cp postcss.config.* nextjs-only-deploy/

echo "Deploying Next.js only files..."
cd nextjs-only-deploy
railway up --service metaads
cd ..

echo "✅ Quick fix applied!"
