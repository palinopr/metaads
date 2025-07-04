#!/bin/bash
# ULTRATHINKING: Fix Both Railway Services

echo "🧠 ULTRATHINKING: FIXING BOTH RAILWAY SERVICES"
echo "=============================================="
echo ""

# Step 1: Create proper .railwayignore for metaads (Next.js)
echo "1️⃣ Creating .railwayignore for Next.js service..."
cat > .railwayignore-nextjs << 'EOF'
# Ignore Python files for Next.js service
*.py
*.pyc
__pycache__/
venv/
.venv/
requirements.txt
railway-requirements.txt
agent-requirements.txt
Procfile
runtime.txt
src/agents/
src/workflows/
test_*.py
demo_*.py
railway-python-deploy/
_*.py.bak
ULTRATHINK_*.py
ultrathink_*.py
deploy_*.py
railway_*.py
*.log
*.sh
docs/
PRPs/
examples/
scripts/
EOF

# Step 2: Create railway.json for Next.js service
echo "2️⃣ Creating railway.json for Next.js..."
cat > railway-nextjs.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF

# Step 3: Create deployment script for metaads (Next.js)
echo "3️⃣ Creating Next.js deployment script..."
cat > deploy-nextjs-to-metaads.sh << 'EOF'
#!/bin/bash
echo "Deploying Next.js to metaads service..."

# Use the Next.js specific ignore file
cp .railwayignore-nextjs .railwayignore

# Use Next.js railway config
cp railway-nextjs.json railway.json

# Deploy to metaads service
railway up --service metaads

# Clean up
rm .railwayignore railway.json

echo "Next.js deployment complete!"
EOF
chmod +x deploy-nextjs-to-metaads.sh

# Step 4: Fix Python deployment
echo "4️⃣ Ensuring Python deployment works..."
cat > deploy-python-api.sh << 'EOF'
#!/bin/bash
echo "Deploying Python API to metaads-python-api service..."

# Remove any railway.json (let Railway auto-detect Python)
rm -f railway.json

# Use the Python railwayignore
cp .railwayignore .railwayignore.backup 2>/dev/null || true

# Deploy to Python service
railway up --service metaads-python-api

echo "Python API deployment complete!"
EOF
chmod +x deploy-python-api.sh

# Step 5: Create combined deployment script
echo "5️⃣ Creating combined deployment script..."
cat > deploy-all-services.sh << 'EOF'
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
EOF
chmod +x deploy-all-services.sh

# Step 6: Quick fix option
echo "6️⃣ Creating quick fix option..."
cat > quick-fix-metaads.sh << 'EOF'
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
EOF
chmod +x quick-fix-metaads.sh

echo ""
echo "✅ FIX SCRIPTS CREATED!"
echo "======================"
echo ""
echo "Option 1: Deploy both services properly"
echo "   ./deploy-all-services.sh"
echo ""
echo "Option 2: Quick fix for metaads crashes"
echo "   ./quick-fix-metaads.sh"
echo ""
echo "Option 3: Deploy individually"
echo "   ./deploy-python-api.sh      # For Python backend"
echo "   ./deploy-nextjs-to-metaads.sh  # For Next.js frontend"
echo ""
echo "Recommended: Use Option 1 for proper separation!"