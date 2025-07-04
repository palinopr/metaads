#!/bin/bash

# Railway Service Separator - Complete Solution
# This script creates proper separation between Next.js and Python services

set -e  # Exit on error

echo "🔧 Railway Service Separator - Complete Solution"
echo "==============================================="
echo ""

# Function to check if file exists
check_file() {
    if [ ! -f "$1" ]; then
        echo "❌ Missing file: $1"
        return 1
    fi
    echo "✅ Found: $1"
    return 0
}

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="railway_backup_$timestamp"
    mkdir -p "$backup_dir"
    
    echo "📦 Creating backup in $backup_dir..."
    cp -r *.py requirements.txt runtime.txt Procfile "$backup_dir/" 2>/dev/null || true
    cp -r src/agents src/workflows "$backup_dir/" 2>/dev/null || true
    echo "✅ Backup created"
}

# Step 1: Verify Python files
echo "📋 Step 1: Verifying Python service files..."
echo "-------------------------------------------"
check_file "app.py"
check_file "requirements.txt"
check_file "runtime.txt"
check_file "Procfile"

# Step 2: Create proper directory structure
echo ""
echo "📁 Step 2: Creating proper directory structure..."
echo "------------------------------------------------"

# Create Python service directory
mkdir -p railway-python-service
echo "✅ Created railway-python-service directory"

# Copy Python files to separate directory
echo "📦 Copying Python files..."
cp app.py railway-python-service/
cp requirements.txt railway-python-service/
cp runtime.txt railway-python-service/
cp Procfile railway-python-service/

# Copy Python source code if needed
if [ -d "src/agents" ]; then
    mkdir -p railway-python-service/src
    cp -r src/agents railway-python-service/src/
    echo "✅ Copied agents module"
fi

if [ -d "src/workflows" ]; then
    mkdir -p railway-python-service/src
    cp -r src/workflows railway-python-service/src/
    echo "✅ Copied workflows module"
fi

# Step 3: Create Railway-specific ignore files
echo ""
echo "📝 Step 3: Creating Railway ignore files..."
echo "------------------------------------------"

# Create .railwayignore for main (Next.js) service
cat > .railwayignore << 'EOF'
# Ignore Python files for Next.js service
*.py
requirements.txt
runtime.txt
Procfile
__pycache__/
*.pyc
.pytest_cache/
venv/
railway-python-service/
src/agents/
src/workflows/
agent-requirements.txt
railway-requirements.txt

# Keep Next.js files
!src/app/**/*.ts
!src/app/**/*.tsx
!src/components/**/*.ts
!src/components/**/*.tsx
!src/lib/**/*.ts
!src/types/**/*.ts
EOF

echo "✅ Created .railwayignore for Next.js service"

# Create .railwayignore for Python service
cat > railway-python-service/.railwayignore << 'EOF'
# Ignore Next.js files for Python service
node_modules/
.next/
src/app/
src/components/
src/lib/
src/types/
public/
*.tsx
*.ts
*.jsx
*.js
package.json
package-lock.json
next.config.mjs
next-env.d.ts
tailwind.config.ts
postcss.config.js
tsconfig.json
.eslintrc.json
EOF

echo "✅ Created .railwayignore for Python service"

# Step 4: Create deployment configuration
echo ""
echo "📄 Step 4: Creating deployment configurations..."
echo "-----------------------------------------------"

# Create railway.json for Next.js service
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF

echo "✅ Created railway.json for Next.js service"

# Create railway.json for Python service
cat > railway-python-service/railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF

echo "✅ Created railway.json for Python service"

# Step 5: Fix runtime.txt format
echo ""
echo "🔧 Step 5: Fixing runtime.txt format..."
echo "--------------------------------------"

# Ensure correct Python version format
echo "python-3.11.0" > railway-python-service/runtime.txt
echo "✅ Fixed runtime.txt format"

# Step 6: Create deployment scripts
echo ""
echo "🚀 Step 6: Creating deployment scripts..."
echo "----------------------------------------"

# Create deploy script for Python service
cat > deploy-python-service.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Python Service to Railway"
echo "====================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Deploy Python service
cd railway-python-service

echo "🔑 Logging into Railway..."
railway login

echo "🔗 Linking to project..."
railway link

echo "📌 Creating/using Python service..."
railway service create metaads-python-api 2>/dev/null || railway service metaads-python-api

echo "🚀 Deploying Python service..."
railway up --service metaads-python-api

echo "✅ Python service deployment initiated!"
echo ""
echo "📊 Check deployment status:"
echo "railway logs --service metaads-python-api"
EOF

chmod +x deploy-python-service.sh
echo "✅ Created deploy-python-service.sh"

# Create deploy script for Next.js service
cat > deploy-nextjs-service.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Next.js Service to Railway"
echo "======================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔑 Logging into Railway..."
railway login

echo "🔗 Linking to project..."
railway link

echo "📌 Using metaads service for Next.js..."
railway service metaads

echo "🚀 Deploying Next.js service..."
railway up --service metaads

echo "✅ Next.js service deployment initiated!"
echo ""
echo "📊 Check deployment status:"
echo "railway logs --service metaads"
EOF

chmod +x deploy-nextjs-service.sh
echo "✅ Created deploy-nextjs-service.sh"

# Step 7: Create comprehensive deployment guide
echo ""
echo "📚 Step 7: Creating deployment guide..."
echo "-------------------------------------"

cat > RAILWAY_DEPLOYMENT_GUIDE.md << 'EOF'
# Railway Deployment Guide - Separated Services

## Overview
This project is now properly separated into two Railway services:
1. **metaads** - Next.js frontend (existing service)
2. **metaads-python-api** - Python/Flask backend (new service)

## Directory Structure
```
metaads-new/
├── Next.js files (deployed to "metaads" service)
│   ├── src/app/
│   ├── src/components/
│   ├── package.json
│   └── next.config.mjs
└── railway-python-service/ (deployed to "metaads-python-api" service)
    ├── app.py
    ├── requirements.txt
    ├── runtime.txt
    └── Procfile
```

## Deployment Instructions

### Option 1: Using Scripts (Recommended)
```bash
# Deploy Python service
./deploy-python-service.sh

# Deploy Next.js service
./deploy-nextjs-service.sh
```

### Option 2: Manual Deployment

#### Deploy Python Service:
```bash
cd railway-python-service
railway login
railway link
railway service create metaads-python-api
railway up --service metaads-python-api
```

#### Deploy Next.js Service:
```bash
# From root directory
railway login
railway link
railway service metaads
railway up --service metaads
```

### Option 3: GitHub Auto-Deploy
1. Push changes to GitHub
2. Railway will auto-deploy based on service configurations
3. Monitor deployments in Railway dashboard

## Environment Variables

### For Python Service (metaads-python-api):
- PORT (auto-set by Railway)
- OPENAI_API_KEY (optional, for AI features)

### For Next.js Service (metaads):
- NEXT_PUBLIC_API_URL=https://metaads-python-api.railway.app
- Any Supabase/Auth variables

## Verification

### Check Python Service:
```bash
curl https://metaads-python-api.railway.app
# Expected: {"status": "healthy", "service": "AI Marketing Automation API"}
```

### Check Next.js Service:
Visit: https://metaads.railway.app

## Troubleshooting

### Python Service Issues:
- Check logs: `railway logs --service metaads-python-api`
- Verify runtime.txt has: `python-3.11.0`
- Ensure Procfile exists

### Next.js Service Issues:
- Check logs: `railway logs --service metaads`
- Verify package.json exists
- Check build command in railway.json

### Connection Issues:
- Ensure CORS is configured in app.py
- Verify API URL in Next.js environment variables
- Check Railway service domains are generated

## Rollback
If issues occur, restore from backup:
```bash
# List backups
ls -la railway_backup_*

# Restore specific backup
cp -r railway_backup_TIMESTAMP/* .
```
EOF

echo "✅ Created RAILWAY_DEPLOYMENT_GUIDE.md"

# Final summary
echo ""
echo "✅ ========================================="
echo "✅ Railway Service Separation Complete!"
echo "✅ ========================================="
echo ""
echo "📋 Summary of changes:"
echo "  • Created railway-python-service/ directory"
echo "  • Separated Python and Next.js files"
echo "  • Created proper .railwayignore files"
echo "  • Fixed runtime.txt format"
echo "  • Created deployment scripts"
echo ""
echo "🚀 Next Steps:"
echo "  1. Deploy Python service: ./deploy-python-service.sh"
echo "  2. Deploy Next.js service: ./deploy-nextjs-service.sh"
echo "  3. Update Vercel environment variables with Python API URL"
echo ""
echo "📚 See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions"