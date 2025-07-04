#!/bin/bash
# DEPLOY NOW - ULTRATHINK EDITION
# ===============================
# The ultimate deployment script that WILL deploy your app
# NO MATTER WHAT!

set -e

# Make all scripts executable
echo "🔧 Preparing deployment scripts..."
chmod +x *.sh 2>/dev/null || true
chmod +x *.py 2>/dev/null || true

# Check if master script exists
if [ -f "ultrathink_deploy_master.sh" ]; then
    echo "🚀 Starting ULTRATHINK deployment system..."
    echo ""
    ./ultrathink_deploy_master.sh
else
    echo "❌ Master deployment script not found!"
    echo "Creating emergency deployment..."
    
    # Emergency deployment
    cat > emergency_deploy.sh << 'EOF'
#!/bin/bash
echo "🚨 EMERGENCY DEPLOYMENT MODE"
echo "=========================="

# Method 1: Try Railway CLI
if command -v railway &> /dev/null; then
    echo "Attempting Railway CLI deployment..."
    railway login
    railway init
    railway up
elif command -v npm &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    railway login
    railway init  
    railway up
else
    echo "❌ Cannot install Railway CLI"
    echo ""
    echo "MANUAL DEPLOYMENT REQUIRED:"
    echo "1. Go to https://railway.app/new"
    echo "2. Create new project"
    echo "3. Upload these files:"
    ls -la *.py *.txt *.json 2>/dev/null || echo "   - All project files"
    echo "4. Set OPENAI_API_KEY in environment variables"
    echo "5. Deploy!"
fi
EOF
    chmod +x emergency_deploy.sh
    ./emergency_deploy.sh
fi