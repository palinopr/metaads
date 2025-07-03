#!/bin/bash
# Redeploy to existing Railway project

echo "🚀 Redeploying AI Agents to Existing Railway Project"
echo "==================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check we're in the right directory
if [ ! -f "app.py" ]; then
    echo -e "${RED}❌ Error: Not in the metaads-new directory${NC}"
    exit 1
fi

# Step 2: Login to Railway (if needed)
echo -e "${YELLOW}🔐 Checking Railway authentication...${NC}"
railway whoami || railway login

# Step 3: Link to existing project (if not already linked)
if [ ! -f ".railway/config.json" ]; then
    echo -e "${YELLOW}🔗 Linking to existing Railway project...${NC}"
    railway link
else
    echo -e "${GREEN}✅ Already linked to Railway project${NC}"
fi

# Step 4: Update environment variables (optional)
echo -e "\n${YELLOW}📋 Current environment variables:${NC}"
railway variables

read -p "Do you need to update any environment variables? (y/n): " update_vars
if [ "$update_vars" = "y" ]; then
    echo "Options:"
    echo "1) Set OPENAI_API_KEY"
    echo "2) Set LANGCHAIN_API_KEY"
    echo "3) Skip"
    read -p "Choose option (1-3): " var_choice
    
    case $var_choice in
        1)
            read -p "Enter OpenAI API key: " openai_key
            railway variables set OPENAI_API_KEY="$openai_key"
            echo -e "${GREEN}✅ OpenAI key updated${NC}"
            ;;
        2)
            read -p "Enter LangChain API key: " langchain_key
            railway variables set LANGCHAIN_API_KEY="$langchain_key"
            railway variables set LANGCHAIN_TRACING_V2="true"
            echo -e "${GREEN}✅ LangChain monitoring updated${NC}"
            ;;
        *)
            echo "Skipping variable updates"
            ;;
    esac
fi

# Step 5: Deploy the new code
echo -e "\n${YELLOW}🚀 Deploying new code to Railway...${NC}"
echo "This will replace the existing deployment"
echo ""

# Show what's being deployed
echo "Deploying with:"
echo "- Flask app (app.py)"
echo "- LangGraph agents (src/agents/)"
echo "- Dependencies (railway-requirements.txt)"
echo ""

# Deploy
railway up

# Step 6: Monitor deployment
echo -e "\n${YELLOW}📊 Monitoring deployment...${NC}"
echo "Fetching logs (press Ctrl+C to stop)..."
echo ""

# Show recent logs
timeout 20s railway logs -f || true

# Step 7: Get deployment info
echo -e "\n${YELLOW}📍 Deployment Status:${NC}"
railway status

# Try to get URL
RAILWAY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*' | grep -o '[^"]*$' | head -1)

if [ ! -z "$RAILWAY_URL" ]; then
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
    echo -e "URL: ${GREEN}https://$RAILWAY_URL${NC}"
    
    # Quick health check
    echo -e "\n${YELLOW}🧪 Testing deployment...${NC}"
    curl -s "https://$RAILWAY_URL/" | python3 -m json.tool || echo "Service is starting up..."
else
    echo -e "\n${YELLOW}Check your Railway dashboard for the deployment URL${NC}"
fi

# Step 8: Next steps
echo -e "\n${GREEN}✨ Redeployment Complete!${NC}"
echo ""
echo "Useful commands:"
echo "- View logs:    railway logs -f"
echo "- Check status: railway status"
echo "- Restart:      railway restart"
echo ""
echo "Update Vercel with your Railway URL:"
echo "EXTERNAL_API_URL=https://$RAILWAY_URL"
echo ""
echo "==================================================="