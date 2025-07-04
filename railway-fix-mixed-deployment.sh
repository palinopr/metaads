#!/bin/bash

# Railway Fix for Mixed Deployment (Next.js + Python)
# This script configures Railway to handle both services properly

echo "🔧 Railway Mixed Deployment Fix"
echo "==============================="
echo ""
echo "This script will configure Railway to properly handle"
echo "your mixed Next.js + Python codebase without moving files."
echo ""

# Option 1: Configure metaads service for Next.js only
configure_nextjs_only() {
    echo "📦 Option 1: Configuring 'metaads' for Next.js only"
    echo "------------------------------------------------"
    
    # Create enhanced .railwayignore
    cat > .railwayignore << 'EOF'
# Ignore ALL Python files and directories
*.py
*.pyc
__pycache__/
.pytest_cache/
venv/
.venv/
requirements.txt
railway-requirements.txt
agent-requirements.txt
runtime.txt
Procfile
app.py
demo_ai_agents.py
test_*.py
check_*.py
deploy_*.py
ultrathink_*.py
verify_*.py
wait_*.py

# Python source directories
src/agents/
src/workflows/
src/api/
examples/
tests/
scripts/

# Python deployment artifacts
railway-python-deploy/
railway_deploy_*/
*.zip

# Documentation and scripts
*.md
*.sh
deployment_guide/
docs/
PRPs/

# Keep only Next.js essentials
!src/app/
!src/components/
!src/lib/
!src/types/
EOF
    
    # Create explicit Next.js railway.json
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build",
    "watchPatterns": [
      "src/**/*.{ts,tsx,js,jsx}",
      "package.json",
      "next.config.mjs"
    ]
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/",
    "healthcheckTimeout": 30
  },
  "providers": ["node"]
}
EOF
    
    # Create nixpacks.toml for explicit Node.js configuration
    cat > nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
EOF
    
    echo "✅ Created Next.js-only configuration"
}

# Option 2: Create separate Python service
create_python_service() {
    echo "🐍 Option 2: Creating separate Python service"
    echo "-----------------------------------------"
    
    # Create Python-specific directory
    mkdir -p railway-python-api
    
    # Copy only Python files
    cp app.py railway-python-api/ 2>/dev/null || echo "⚠️  app.py not found"
    cp requirements.txt railway-python-api/ 2>/dev/null || echo "⚠️  requirements.txt not found"
    cp runtime.txt railway-python-api/ 2>/dev/null || echo "⚠️  runtime.txt not found"
    cp Procfile railway-python-api/ 2>/dev/null || echo "⚠️  Procfile not found"
    
    # Fix runtime.txt format
    echo "python-3.11.0" > railway-python-api/runtime.txt
    
    # Create Python-specific railway.json
    cat > railway-python-api/railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/",
    "healthcheckTimeout": 30
  },
  "providers": ["python"]
}
EOF
    
    # Create Python nixpacks.toml
    cat > railway-python-api/nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ["python311", "gcc"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120"
EOF
    
    echo "✅ Created railway-python-api directory"
}

# Option 3: Quick fix with build override
quick_fix_build() {
    echo "⚡ Option 3: Quick fix with build override"
    echo "---------------------------------------"
    
    # Create a build script that handles both
    cat > railway-build.sh << 'EOF'
#!/bin/bash

# Detect which service is being built
if [ -f "package.json" ] && [ "$RAILWAY_SERVICE_NAME" = "metaads" ]; then
    echo "🚀 Building Next.js service..."
    npm ci && npm run build
elif [ -f "requirements.txt" ] && [ "$RAILWAY_SERVICE_NAME" = "metaads-python-api" ]; then
    echo "🐍 Building Python service..."
    pip install -r requirements.txt
else
    echo "❌ Unknown service type"
    exit 1
fi
EOF
    
    chmod +x railway-build.sh
    
    # Create unified railway.json
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "./railway-build.sh"
  },
  "deploy": {
    "startCommand": "if [ -f 'package.json' ]; then npm start; else gunicorn app:app --bind 0.0.0.0:$PORT; fi",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF
    
    echo "✅ Created build override configuration"
}

# Interactive menu
echo "Please choose a solution:"
echo "1) Configure 'metaads' for Next.js only (ignore Python files)"
echo "2) Create separate Python service directory"
echo "3) Quick fix with build override"
echo "4) Apply all fixes (recommended)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        configure_nextjs_only
        ;;
    2)
        create_python_service
        ;;
    3)
        quick_fix_build
        ;;
    4)
        echo "📦 Applying all fixes..."
        configure_nextjs_only
        create_python_service
        quick_fix_build
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create deployment verification script
cat > verify-railway-fix.sh << 'EOF'
#!/bin/bash

echo "🔍 Verifying Railway Fix"
echo "======================="
echo ""

# Check .railwayignore
if [ -f ".railwayignore" ]; then
    echo "✅ .railwayignore exists"
    echo "   Python files ignored: $(grep -c "\.py" .railwayignore) rules"
else
    echo "❌ .railwayignore missing"
fi

# Check railway.json
if [ -f "railway.json" ]; then
    echo "✅ railway.json exists"
    if grep -q "npm" railway.json; then
        echo "   Configured for: Next.js"
    elif grep -q "gunicorn" railway.json; then
        echo "   Configured for: Python"
    fi
else
    echo "❌ railway.json missing"
fi

# Check Python service directory
if [ -d "railway-python-api" ]; then
    echo "✅ Python service directory exists"
    echo "   Files: $(ls railway-python-api | wc -l)"
else
    echo "⚠️  No separate Python directory"
fi

# Check for conflicting files
echo ""
echo "📋 Checking for conflicts..."
python_files=$(find . -maxdepth 1 -name "*.py" | wc -l)
if [ $python_files -gt 0 ] && [ -f "package.json" ]; then
    echo "⚠️  Mixed files detected: $python_files Python files in Next.js root"
    echo "   This may cause deployment issues"
else
    echo "✅ No file conflicts detected"
fi
EOF

chmod +x verify-railway-fix.sh

echo ""
echo "✅ Fix applied!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./verify-railway-fix.sh"
echo "2. Commit changes: git add . && git commit -m 'Fix Railway deployment'"
echo "3. Push to trigger deployment: git push"
echo ""
echo "🚀 For manual deployment:"
echo "   Next.js: railway up --service metaads"
echo "   Python: cd railway-python-api && railway up --service metaads-python-api"