#!/bin/bash

echo "🔍 Meta Ads Dashboard Health Check"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Node and npm versions
echo -e "\n1. System Requirements:"
node_version=$(node --version)
npm_version=$(npm --version)
echo "   Node: $node_version (Required: 18+)"
echo "   NPM: $npm_version"

# Check 2: Is server running?
echo -e "\n2. Server Status:"
if ps aux | grep -q "[n]ext dev"; then
    echo -e "   ${GREEN}✓ Next.js server is running${NC}"
    
    # Find which port
    port=$(lsof -i -P -n | grep LISTEN | grep node | awk '{print $9}' | cut -d: -f2 | head -1)
    if [ ! -z "$port" ]; then
        echo "   Port: $port"
    fi
else
    echo -e "   ${RED}✗ Next.js server is NOT running${NC}"
    echo "   Run: npm run dev"
fi

# Check 3: Can we reach the server?
echo -e "\n3. Server Response:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "   ${GREEN}✓ Server responding (HTTP 200)${NC}"
else
    echo -e "   ${RED}✗ Server not responding${NC}"
fi

# Check 4: Check for TypeScript errors
echo -e "\n4. TypeScript Status:"
ts_errors=$(npx tsc --noEmit 2>&1 | grep -E "error TS" | wc -l | tr -d ' ')
if [ "$ts_errors" -eq "0" ]; then
    echo -e "   ${GREEN}✓ No TypeScript errors${NC}"
else
    echo -e "   ${YELLOW}⚠ $ts_errors TypeScript errors found${NC}"
    echo "   Run: npx tsc --noEmit"
fi

# Check 5: Required files exist
echo -e "\n5. Required Files:"
files=(
    "app/page.tsx"
    "components/campaign-predictive-mini.tsx"
    "components/date-filter.tsx"
    "components/campaign-row-expanded.tsx"
    "lib/meta-api-client.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✓ $file${NC}"
    else
        echo -e "   ${RED}✗ $file MISSING${NC}"
    fi
done

# Check 6: Environment status
echo -e "\n6. Environment:"
if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✓ .env.local exists${NC}"
else
    echo -e "   ${YELLOW}⚠ No .env.local file${NC}"
fi

# Check 7: Dependencies
echo -e "\n7. Dependencies:"
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✓ node_modules exists${NC}"
else
    echo -e "   ${RED}✗ node_modules missing - run: npm install${NC}"
fi

# Check 8: Build status
echo -e "\n8. Build Cache:"
if [ -d ".next" ]; then
    echo -e "   ${GREEN}✓ .next build cache exists${NC}"
else
    echo -e "   ${YELLOW}⚠ No .next cache (will be created on first run)${NC}"
fi

# Check 9: Port availability
echo -e "\n9. Common Ports:"
for port in 3000 3001 3002 8080; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠ Port $port is in use${NC}"
    else
        echo -e "   ${GREEN}✓ Port $port is available${NC}"
    fi
done

# Final diagnosis
echo -e "\n=================================="
echo "📋 Diagnosis Summary:"

# Check page content for common issues
page_content=$(curl -s http://localhost:3000 2>/dev/null)
if echo "$page_content" | grep -q "No campaigns found"; then
    echo -e "${YELLOW}⚠ Page loads but shows 'No campaigns found'${NC}"
    echo "  → You need to add Meta API credentials in Settings"
elif echo "$page_content" | grep -q "Meta Ads Dashboard Pro"; then
    echo -e "${GREEN}✓ Dashboard is loading correctly${NC}"
else
    echo -e "${RED}✗ Page is not loading properly${NC}"
fi

echo -e "\n💡 Quick Fixes:"
echo "1. If server not running: npm run dev"
echo "2. If TypeScript errors: npx tsc --noEmit (to see errors)"
echo "3. If port in use: pkill -f 'next dev' then npm run dev"
echo "4. If no campaigns: Add Meta API credentials in Settings"
echo "5. If nothing works: rm -rf .next && npm run dev"