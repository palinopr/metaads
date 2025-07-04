#!/bin/bash
# ULTRATHINK MASTER DEPLOYMENT SCRIPT
# ===================================
# Foolproof deployment with multiple fallback methods
# Uses context engineering and ultrathinking methodology

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1" | tee -a deployment.log
}

log_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ✅ $1" | tee -a deployment.log
}

log_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} ⚠️  $1" | tee -a deployment.log
}

log_error() {
    echo -e "${RED}[$(date +%H:%M:%S)]${NC} ❌ $1" | tee -a deployment.log
}

log_section() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a deployment.log
    echo -e "${PURPLE}$1${NC}" | tee -a deployment.log
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a deployment.log
}

# Initialize deployment log
echo "ULTRATHINK DEPLOYMENT LOG - $(date)" > deployment.log
echo "========================================" >> deployment.log

# Banner
clear
echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║           ULTRATHINK MASTER DEPLOYMENT SYSTEM                 ║
║                                                               ║
║   "Deployment will happen, no matter what!"                  ║
║                                                               ║
║   Features:                                                   ║
║   • Multiple deployment methods                               ║
║   • Automatic error recovery                                  ║
║   • Comprehensive monitoring                                  ║
║   • Web-based fallback guides                                 ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Phase 1: Pre-deployment Checks
log_section "PHASE 1: PRE-DEPLOYMENT CHECKS"

log_info "Running deployment checklist..."
if command -v python3 &> /dev/null; then
    python3 ultrathink_deployment_checklist.py > checklist_output.txt 2>&1 || true
    
    if grep -q "Ready for deployment!" checklist_output.txt; then
        log_success "Pre-deployment checks passed!"
    else
        log_warning "Some checks failed, but we'll handle them"
        cat checklist_output.txt | grep -E "❌|⚠️" | head -10
    fi
else
    log_warning "Python not available for checklist, proceeding anyway"
fi

# Phase 2: Environment Setup
log_section "PHASE 2: ENVIRONMENT SETUP"

# Check/Install Railway CLI
if ! command -v railway &> /dev/null; then
    log_warning "Railway CLI not found, attempting to install..."
    
    # Method 1: NPM global install
    if command -v npm &> /dev/null; then
        log_info "Installing Railway CLI via NPM..."
        npm install -g @railway/cli || {
            log_warning "Global install failed, trying local install..."
            npm install @railway/cli
            export PATH="$PATH:$(pwd)/node_modules/.bin"
        }
    fi
    
    # Method 2: Direct download
    if ! command -v railway &> /dev/null; then
        log_warning "NPM install failed, trying direct download..."
        curl -fsSL https://railway.app/install.sh | sh || {
            log_error "Direct download failed"
        }
    fi
fi

# Verify Railway CLI
if command -v railway &> /dev/null; then
    log_success "Railway CLI available: $(railway --version 2>/dev/null || echo 'version unknown')"
    RAILWAY_AVAILABLE=true
else
    log_warning "Railway CLI not available, will use alternative methods"
    RAILWAY_AVAILABLE=false
fi

# Phase 3: Configuration Fixes
log_section "PHASE 3: CONFIGURATION FIXES"

# Ensure critical files exist
if [ ! -f "Procfile" ]; then
    log_warning "Procfile missing, creating default..."
    echo "web: gunicorn app:app --bind 0.0.0.0:\$PORT" > Procfile
    log_success "Created Procfile"
fi

if [ ! -f "runtime.txt" ]; then
    log_warning "runtime.txt missing, creating default..."
    echo "python-3.11.0" > runtime.txt
    log_success "Created runtime.txt"
fi

if [ ! -f "requirements.txt" ] && [ -f "railway-requirements.txt" ]; then
    log_info "Using railway-requirements.txt as requirements.txt"
    cp railway-requirements.txt requirements.txt
fi

# Phase 4: Deployment Execution
log_section "PHASE 4: DEPLOYMENT EXECUTION"

DEPLOYMENT_SUCCESS=false

# Method 1: Railway CLI Deployment
if [ "$RAILWAY_AVAILABLE" = true ]; then
    log_info "Attempting Railway CLI deployment..."
    
    # Check authentication
    if railway whoami &> /dev/null; then
        log_success "Railway authenticated"
    else
        log_warning "Not authenticated, checking for token..."
        if [ ! -z "$RAILWAY_TOKEN" ]; then
            log_info "Using RAILWAY_TOKEN from environment"
        else
            log_warning "No authentication available, skipping CLI method"
            RAILWAY_AVAILABLE=false
        fi
    fi
    
    if [ "$RAILWAY_AVAILABLE" = true ]; then
        # Check project linking
        if railway status &> /dev/null; then
            log_success "Project linked"
        else
            log_info "Creating new Railway project..."
            railway init --name "metaads-deployment-$(date +%s)" || {
                log_warning "Project creation failed"
                RAILWAY_AVAILABLE=false
            }
        fi
    fi
    
    if [ "$RAILWAY_AVAILABLE" = true ]; then
        log_info "Deploying to Railway..."
        if railway up --detach 2>&1 | tee railway_deploy.log; then
            log_success "Deployment initiated!"
            DEPLOYMENT_SUCCESS=true
            
            # Get deployment URL
            sleep 5
            DEPLOYMENT_URL=$(railway open --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4 || echo "")
            if [ ! -z "$DEPLOYMENT_URL" ]; then
                log_success "Deployment URL: $DEPLOYMENT_URL"
                echo "$DEPLOYMENT_URL" > deployment_url.txt
            fi
        else
            log_error "Railway deployment failed"
        fi
    fi
fi

# Method 2: Python-based deployment system
if [ "$DEPLOYMENT_SUCCESS" = false ] && command -v python3 &> /dev/null; then
    log_info "Attempting Python-based deployment system..."
    python3 ultrathink_deployment_system.py 2>&1 | tee python_deploy.log || true
    
    if [ -f "deployment_report.json" ]; then
        if grep -q '"success": true' deployment_report.json; then
            log_success "Python deployment system succeeded!"
            DEPLOYMENT_SUCCESS=true
        fi
    fi
fi

# Method 3: Manual package generation
if [ "$DEPLOYMENT_SUCCESS" = false ]; then
    log_info "Generating manual deployment package..."
    
    PACKAGE_DIR="railway_deploy_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$PACKAGE_DIR"
    
    # Copy essential files
    for file in app.py requirements.txt railway-requirements.txt Procfile runtime.txt package.json package-lock.json; do
        [ -f "$file" ] && cp "$file" "$PACKAGE_DIR/"
    done
    
    # Copy directories
    for dir in src public; do
        [ -d "$dir" ] && cp -r "$dir" "$PACKAGE_DIR/"
    done
    
    # Create deployment instructions
    cat > "$PACKAGE_DIR/DEPLOY_INSTRUCTIONS.md" << EOF
# Manual Railway Deployment

1. Go to https://railway.app/new
2. Create empty project
3. Upload this folder
4. Set environment variables:
   - OPENAI_API_KEY
   - NODE_ENV=production
5. Deploy!

Or use Railway CLI:
\`\`\`bash
cd $PACKAGE_DIR
railway init
railway up
\`\`\`
EOF
    
    # Create zip
    zip -r "${PACKAGE_DIR}.zip" "$PACKAGE_DIR" > /dev/null 2>&1
    
    log_success "Manual deployment package created: ${PACKAGE_DIR}.zip"
fi

# Phase 5: Generate Deployment Guides
log_section "PHASE 5: DEPLOYMENT GUIDES"

log_info "Generating web-based deployment guide..."
if [ -f "deployment_guide/index.html" ]; then
    log_success "Web guide already exists at deployment_guide/index.html"
else
    # Create simple guide if Python method didn't work
    mkdir -p deployment_guide
    cat > deployment_guide/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Railway Deployment Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #7C3AED; }
        .method { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        pre { background: #333; color: #fff; padding: 10px; overflow-x: auto; }
        .success { color: #10B981; }
        .warning { color: #F59E0B; }
        .error { color: #EF4444; }
    </style>
</head>
<body>
    <h1>Railway Deployment Guide</h1>
    
    <div class="method">
        <h2>Method 1: Railway CLI</h2>
        <pre>npm install -g @railway/cli
railway login
railway init
railway up</pre>
    </div>
    
    <div class="method">
        <h2>Method 2: GitHub Integration</h2>
        <ol>
            <li>Push code to GitHub</li>
            <li>Go to railway.app/new</li>
            <li>Connect GitHub repo</li>
            <li>Deploy!</li>
        </ol>
    </div>
    
    <div class="method">
        <h2>Method 3: Manual Upload</h2>
        <ol>
            <li>Go to railway.app/new</li>
            <li>Create empty project</li>
            <li>Upload project files</li>
            <li>Set environment variables</li>
        </ol>
    </div>
</body>
</html>
EOF
    log_success "Basic web guide created"
fi

# Phase 6: Start Monitoring
log_section "PHASE 6: DEPLOYMENT MONITORING"

if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    log_info "Starting deployment monitor..."
    
    # Start monitor in background
    if command -v python3 &> /dev/null && [ -f "ultrathink_monitor.py" ]; then
        python3 ultrathink_monitor.py --quiet > monitor.log 2>&1 &
        MONITOR_PID=$!
        log_success "Monitor started (PID: $MONITOR_PID)"
        
        # Save monitor PID
        echo $MONITOR_PID > monitor.pid
    fi
fi

# Phase 7: Final Summary
log_section "DEPLOYMENT SUMMARY"

echo -e "${PURPLE}┌────────────────────────────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│                    DEPLOYMENT RESULTS                      │${NC}"
echo -e "${PURPLE}├────────────────────────────────────────────────────────────┤${NC}"

if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo -e "${PURPLE}│${NC} Status: ${GREEN}SUCCESS${NC}                                            ${PURPLE}│${NC}"
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo -e "${PURPLE}│${NC} URL: ${BLUE}$DEPLOYMENT_URL${NC}                     ${PURPLE}│${NC}"
    fi
else
    echo -e "${PURPLE}│${NC} Status: ${YELLOW}MANUAL INTERVENTION REQUIRED${NC}                     ${PURPLE}│${NC}"
fi

echo -e "${PURPLE}├────────────────────────────────────────────────────────────┤${NC}"
echo -e "${PURPLE}│${NC} Next Steps:                                                ${PURPLE}│${NC}"

if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo -e "${PURPLE}│${NC} 1. Check deployment: ${BLUE}railway logs${NC}                         ${PURPLE}│${NC}"
    echo -e "${PURPLE}│${NC} 2. Monitor status: ${BLUE}railway status${NC}                         ${PURPLE}│${NC}"
    echo -e "${PURPLE}│${NC} 3. View dashboard: ${BLUE}railway open${NC}                           ${PURPLE}│${NC}"
else
    echo -e "${PURPLE}│${NC} 1. Open ${BLUE}deployment_guide/index.html${NC} in browser           ${PURPLE}│${NC}"
    echo -e "${PURPLE}│${NC} 2. Follow manual deployment steps                          ${PURPLE}│${NC}"
    echo -e "${PURPLE}│${NC} 3. Use ${BLUE}${PACKAGE_DIR}.zip${NC} for upload        ${PURPLE}│${NC}"
fi

echo -e "${PURPLE}├────────────────────────────────────────────────────────────┤${NC}"
echo -e "${PURPLE}│${NC} Resources:                                                 ${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC} • Deployment log: ${BLUE}deployment.log${NC}                          ${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC} • Checklist results: ${BLUE}deployment_checklist_results.json${NC}   ${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC} • Web guide: ${BLUE}deployment_guide/index.html${NC}                 ${PURPLE}│${NC}"

if [ "$DEPLOYMENT_SUCCESS" = true ] && [ ! -z "$MONITOR_PID" ]; then
    echo -e "${PURPLE}│${NC} • Monitor PID: ${BLUE}$MONITOR_PID${NC} (running in background)         ${PURPLE}│${NC}"
fi

echo -e "${PURPLE}└────────────────────────────────────────────────────────────┘${NC}"

# Save deployment state
cat > deployment_state.json << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "success": $( [ "$DEPLOYMENT_SUCCESS" = true ] && echo "true" || echo "false" ),
    "deployment_url": "${DEPLOYMENT_URL:-null}",
    "monitor_pid": ${MONITOR_PID:-null},
    "package_created": "$( [ -f "${PACKAGE_DIR}.zip" ] && echo "true" || echo "false" )",
    "guide_created": true
}
EOF

# Create quick access script
cat > quick_deploy_status.sh << 'EOF'
#!/bin/bash
# Quick deployment status check

echo "🚀 DEPLOYMENT STATUS"
echo "==================="

if [ -f deployment_state.json ]; then
    cat deployment_state.json | python3 -m json.tool 2>/dev/null || cat deployment_state.json
fi

if [ -f monitor.pid ] && ps -p $(cat monitor.pid) > /dev/null 2>&1; then
    echo ""
    echo "✅ Monitor is running (PID: $(cat monitor.pid))"
else
    echo ""
    echo "❌ Monitor is not running"
fi

if [ -f deployment_url.txt ]; then
    echo ""
    echo "🌐 Deployment URL: $(cat deployment_url.txt)"
fi
EOF
chmod +x quick_deploy_status.sh

log_success "Deployment process complete!"
log_info "Run ./quick_deploy_status.sh to check status anytime"

# Exit with appropriate code
[ "$DEPLOYMENT_SUCCESS" = true ] && exit 0 || exit 1