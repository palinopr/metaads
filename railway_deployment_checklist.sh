#!/bin/bash

# Railway Deployment Checklist Script
# ===================================
# Comprehensive pre-deployment verification

echo "🚂 Railway Deployment Checklist"
echo "==============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check items
check_item() {
    local description=$1
    local command=$2
    local required=$3
    
    echo -n "Checking $description... "
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED++))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗${NC}"
            ((FAILED++))
        else
            echo -e "${YELLOW}⚠${NC}"
            ((WARNINGS++))
        fi
        return 1
    fi
}

echo "📋 Pre-Deployment Checks"
echo "------------------------"

# 1. Check required files
echo ""
echo "1️⃣ Required Files:"
check_item "app.py exists" "[ -f app.py ]" "required"
check_item "requirements.txt exists" "[ -f requirements.txt ]" "required"
check_item "Procfile exists" "[ -f Procfile ]" "required"
check_item "runtime.txt exists" "[ -f runtime.txt ]" "optional"

# 2. Check file contents
echo ""
echo "2️⃣ File Contents:"
check_item "requirements.txt not empty" "[ -s requirements.txt ]" "required"
check_item "Procfile has web process" "grep -q '^web:' Procfile" "required"
check_item "app.py has Flask/FastAPI import" "grep -qE 'from (flask|fastapi) import' app.py" "required"

# 3. Check Python syntax
echo ""
echo "3️⃣ Python Syntax:"
check_item "app.py syntax valid" "python3 -m py_compile app.py" "required"

# 4. Check environment
echo ""
echo "4️⃣ Environment:"
check_item "Python 3 installed" "which python3" "required"
check_item "Railway CLI installed" "which railway" "optional"

# 5. Check for issues
echo ""
echo "5️⃣ Common Issues:"
check_item "No __pycache__ directories" "! find . -name __pycache__ -type d | grep -q ." "optional"
check_item "No .pyc files" "! find . -name '*.pyc' | grep -q ." "optional"
check_item "No node_modules in Python project" "! [ -d node_modules ]" "optional"

# 6. Check Git status
echo ""
echo "6️⃣ Git Status:"
if [ -d .git ]; then
    check_item "Git repository clean" "[ -z \"\$(git status --porcelain)\" ]" "optional"
    
    # Show uncommitted files if any
    if [ -n "$(git status --porcelain)" ]; then
        echo ""
        echo "  Uncommitted changes:"
        git status --porcelain | sed 's/^/    /'
    fi
fi

# 7. Check port configuration
echo ""
echo "7️⃣ Port Configuration:"
check_item "PORT env var used in app.py" "grep -q 'PORT' app.py" "required"
check_item "No hardcoded ports" "! grep -E 'port\s*=\s*[0-9]{4,5}' app.py" "required"

# 8. Check dependencies
echo ""
echo "8️⃣ Dependencies Check:"
if [ -f requirements.txt ]; then
    echo "  Top 5 dependencies:"
    head -5 requirements.txt | sed 's/^/    /'
fi

# Summary
echo ""
echo "==============================="
echo "📊 Summary"
echo "==============================="
echo -e "✅ Passed:   ${GREEN}$PASSED${NC}"
echo -e "❌ Failed:   ${RED}$FAILED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"

# Final verdict
echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: railway login"
    echo "2. Run: railway link (if not linked)"
    echo "3. Run: railway up"
    echo ""
    echo "Or use our monitoring script:"
    echo "  python3 railway_deployment_monitor.py monitor"
else
    echo -e "${RED}❌ Fix critical issues before deploying!${NC}"
    echo ""
    echo "Issues to fix:"
    [ ! -f app.py ] && echo "  - Create app.py"
    [ ! -f requirements.txt ] && echo "  - Create requirements.txt"
    [ ! -f Procfile ] && echo "  - Create Procfile"
    
    # Check specific issues
    if [ -f Procfile ] && ! grep -q '^web:' Procfile; then
        echo "  - Add web process to Procfile"
        echo "    Example: web: gunicorn app:app --bind 0.0.0.0:\$PORT"
    fi
    
    if [ -f app.py ] && ! grep -q 'PORT' app.py; then
        echo "  - Use PORT environment variable in app.py"
        echo "    Example: port = int(os.environ.get('PORT', 8080))"
    fi
fi

# Make scripts executable
chmod +x railway_diagnostic.py 2>/dev/null
chmod +x railway_deployment_monitor.py 2>/dev/null
chmod +x verify_deployment.py 2>/dev/null

echo ""
echo "🔧 Additional tools available:"
echo "  - python3 railway_diagnostic.py      # Full diagnostic"
echo "  - python3 railway_deployment_monitor.py validate  # Pre-deployment validation"
echo "  - python3 verify_deployment.py <url> # Post-deployment verification"