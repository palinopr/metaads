#!/bin/bash

# Complete Railway Deployment Script
# ==================================
# Handles all aspects of Railway deployment with error checking

set -e  # Exit on error

echo "🚂 Complete Railway Deployment Process"
echo "====================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ✅ $1"
}

print_error() {
    echo -e "${RED}[$(date +%H:%M:%S)]${NC} ❌ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} ⚠️  $1"
}

# Step 1: Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI not installed!"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Run our checklist
if [ -f railway_deployment_checklist.sh ]; then
    print_status "Running deployment checklist..."
    ./railway_deployment_checklist.sh > checklist_output.txt 2>&1
    
    if grep -q "Ready for deployment!" checklist_output.txt; then
        print_success "Pre-deployment checks passed!"
    else
        print_error "Pre-deployment checks failed!"
        cat checklist_output.txt
        exit 1
    fi
fi

# Step 2: Clean up project
print_status "Cleaning up project..."

# Remove Python cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Remove logs
rm -f *.log 2>/dev/null || true

print_success "Project cleaned!"

# Step 3: Check Railway authentication
print_status "Checking Railway authentication..."

if railway whoami > /dev/null 2>&1; then
    USER=$(railway whoami)
    print_success "Authenticated as: $USER"
else
    print_warning "Not authenticated. Please login..."
    railway login
    
    if ! railway whoami > /dev/null 2>&1; then
        print_error "Authentication failed!"
        exit 1
    fi
fi

# Step 4: Check project linking
print_status "Checking project linking..."

if railway status > /dev/null 2>&1; then
    print_success "Project is linked!"
    railway status
else
    print_warning "No project linked. Please select or create a project..."
    railway link
    
    if ! railway status > /dev/null 2>&1; then
        print_error "Project linking failed!"
        exit 1
    fi
fi

# Step 5: Environment variables
print_status "Checking environment variables..."

echo ""
echo "Current Railway environment variables:"
railway variables || true
echo ""

read -p "Do you need to set any environment variables? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Set environment variables using:"
    echo "  railway variables set KEY=value"
    echo "  Example: railway variables set OPENAI_API_KEY=sk-..."
    echo ""
    read -p "Press Enter when ready to continue..."
fi

# Step 6: Final confirmation
echo ""
print_status "Deployment Summary:"
echo "==================="
echo "📁 Files to deploy:"
echo "  - app.py (Flask application)"
echo "  - requirements.txt (Dependencies)"
echo "  - Procfile (Process configuration)"
echo "  - runtime.txt (Python version)"
echo ""
echo "🔧 Configuration:"
grep "^web:" Procfile || echo "  No Procfile found!"
echo ""
echo "📦 Main dependencies:"
head -5 requirements.txt | sed 's/^/  /'
echo ""

read -p "Ready to deploy? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
fi

# Step 7: Deploy
print_status "Starting deployment..."
echo ""

# Create deployment log
DEPLOY_LOG="railway_deploy_$(date +%Y%m%d_%H%M%S).log"

# Deploy with detailed output
railway up --detach 2>&1 | tee $DEPLOY_LOG &
DEPLOY_PID=$!

# Monitor deployment
echo ""
print_status "Monitoring deployment progress..."
echo "Log file: $DEPLOY_LOG"
echo ""

# Wait for deployment to start
sleep 5

# Check if deployment is still running
if ps -p $DEPLOY_PID > /dev/null; then
    print_status "Deployment in progress..."
    
    # Monitor logs
    timeout 120 railway logs --tail 50 || true
else
    # Check if deployment succeeded
    if grep -q "error" $DEPLOY_LOG; then
        print_error "Deployment failed! Check $DEPLOY_LOG for details"
        tail -20 $DEPLOY_LOG
        exit 1
    fi
fi

# Step 8: Verify deployment
print_status "Verifying deployment..."
echo ""

# Give app time to start
sleep 10

# Get app URL
APP_URL=$(railway open --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$APP_URL" ]; then
    print_warning "Could not determine app URL automatically"
    echo "Please check Railway dashboard for your app URL"
else
    print_success "App URL: $APP_URL"
    echo ""
    
    # Test the app
    print_status "Testing application..."
    
    if curl -s "$APP_URL" > /dev/null 2>&1; then
        print_success "Application is responding!"
        
        # Run verification script if available
        if [ -f verify_deployment.py ]; then
            print_status "Running detailed verification..."
            python3 verify_deployment.py "$APP_URL" || true
        fi
    else
        print_warning "Application not responding yet. It may still be starting..."
        echo "Check logs with: railway logs"
    fi
fi

# Step 9: Final summary
echo ""
echo "====================================="
print_success "Deployment process completed!"
echo "====================================="
echo ""
echo "📋 Next steps:"
echo "  1. Check logs: railway logs"
echo "  2. View in dashboard: railway open"
echo "  3. Monitor status: railway status"
echo "  4. Set environment variables: railway variables set KEY=value"
echo ""
echo "🔧 Troubleshooting:"
echo "  - If app crashes: Check logs for errors"
echo "  - If not accessible: Wait a few minutes for DNS propagation"
echo "  - For detailed diagnostics: python3 railway_diagnostic.py"
echo ""

# Save deployment info
cat > last_deployment.json <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "app_url": "$APP_URL",
  "deploy_log": "$DEPLOY_LOG",
  "user": "$USER"
}
EOF

print_success "Deployment info saved to: last_deployment.json"

# Cleanup
rm -f checklist_output.txt 2>/dev/null || true

exit 0