#!/bin/bash
# Prepare and verify deployment readiness

echo "🔍 Checking deployment readiness..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check files
echo -e "\n📁 Required Files:"
files=("app.py" "railway-requirements.txt" "Procfile" "railway.json" "railway.toml")
all_good=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        all_good=false
    fi
done

# Check agents directory
if [ -d "src/agents" ]; then
    echo -e "${GREEN}✅ src/agents/ directory${NC}"
    agent_count=$(find src/agents -name "*.py" | wc -l)
    echo -e "   Found $agent_count Python files"
else
    echo -e "${RED}❌ src/agents/ directory missing${NC}"
    all_good=false
fi

# Check Railway CLI
echo -e "\n🔧 Railway CLI:"
export PATH="$PATH:/Users/jaimeortiz/.npm-global/bin"
if command -v railway &> /dev/null; then
    version=$(railway --version)
    echo -e "${GREEN}✅ Railway CLI installed (version: $version)${NC}"
else
    echo -e "${RED}❌ Railway CLI not found${NC}"
    all_good=false
fi

# Summary
echo -e "\n=================================="
if [ "$all_good" = true ]; then
    echo -e "${GREEN}✅ Everything is ready for deployment!${NC}"
    echo -e "\nNext steps:"
    echo "1. Run: railway login"
    echo "2. Run: railway link"
    echo "3. Run: railway up"
    echo -e "\nOr use this one-liner after login:"
    echo -e "${YELLOW}cd $(pwd) && railway up${NC}"
else
    echo -e "${RED}❌ Some files are missing. Please check above.${NC}"
fi

echo -e "\n💡 Tip: Your app will be live at https://your-project.railway.app"
echo "=================================="