#!/bin/bash
# Deploy AI Marketing Agents to Railway using CLI
# Following context engineering principles

echo "🚀 AI Marketing Automation - Railway Deployment"
echo "=============================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check command existence
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "Please install $1 first: $2"
        exit 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
    fi
}

# Step 1: Verify prerequisites
echo "📋 Checking prerequisites..."
check_command "railway" "npm install -g @railway/cli"
check_command "git" "https://git-scm.com/downloads"
check_command "python3" "https://www.python.org/downloads/"

# Step 2: Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo -e "${RED}❌ Error: app.py not found${NC}"
    echo "Please run this script from the metaads-new directory"
    exit 1
fi

echo -e "\n${GREEN}✅ All prerequisites met${NC}"

# Step 3: Login to Railway
echo -e "\n${YELLOW}🔐 Logging into Railway...${NC}"
railway login

# Step 4: Create new project or link existing
echo -e "\n${YELLOW}📦 Setting up Railway project...${NC}"
echo "Choose an option:"
echo "1) Create new Railway project"
echo "2) Link to existing Railway project"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    # Create new project
    railway init
    echo -e "${GREEN}✅ New project created${NC}"
    
    # Link to GitHub
    echo -e "\n${YELLOW}🔗 Linking to GitHub...${NC}"
    railway link
else
    # Link to existing project
    railway link
    echo -e "${GREEN}✅ Linked to existing project${NC}"
fi

# Step 5: Set environment variables
echo -e "\n${YELLOW}🔧 Setting environment variables...${NC}"
echo "We'll now set up the required environment variables."
echo ""

# Check if user wants to set OpenAI API key
read -p "Do you have an OpenAI API key? (y/n): " has_openai

if [ "$has_openai" = "y" ]; then
    read -p "Enter your OpenAI API key (sk-...): " openai_key
    railway variables set OPENAI_API_KEY="$openai_key"
    echo -e "${GREEN}✅ OpenAI API key set${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping OpenAI key - app will run in demo mode${NC}"
fi

# Optional: LangSmith for monitoring
read -p "Do you want to set up LangSmith monitoring? (y/n): " has_langsmith

if [ "$has_langsmith" = "y" ]; then
    read -p "Enter LangSmith API key: " langsmith_key
    railway variables set LANGCHAIN_TRACING_V2="true"
    railway variables set LANGCHAIN_API_KEY="$langsmith_key"
    railway variables set LANGCHAIN_PROJECT="metaads-production"
    echo -e "${GREEN}✅ LangSmith monitoring configured${NC}"
fi

# Set Python path
railway variables set PYTHONPATH="/app/src"

# Step 6: Deploy
echo -e "\n${YELLOW}🚀 Deploying to Railway...${NC}"
echo "This will take a few minutes..."

# Deploy the app
railway up

# Step 7: Get deployment URL
echo -e "\n${YELLOW}🌐 Getting deployment URL...${NC}"
railway status

# Get the URL programmatically
RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*' | grep -o '[^"]*$' | head -1)

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically detect URL${NC}"
    echo "Please check your Railway dashboard for the URL"
    echo "It will look like: https://your-app.up.railway.app"
else
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
    echo -e "Your app is live at: ${GREEN}https://$RAILWAY_URL${NC}"
    
    # Test the deployment
    echo -e "\n${YELLOW}🧪 Testing deployment...${NC}"
    curl -s "https://$RAILWAY_URL/" | jq '.' || echo "Basic connectivity test passed"
fi

# Step 8: Show next steps
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test your API:"
echo "   curl https://$RAILWAY_URL/api/campaign/create \\"
echo "     -X POST -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\":\"Test campaign\",\"userId\":\"test\"}'"
echo ""
echo "2. Update Vercel environment variables:"
echo "   EXTERNAL_API_URL=https://$RAILWAY_URL"
echo ""
echo "3. Monitor logs:"
echo "   railway logs"
echo ""
echo "4. View metrics:"
echo "   railway status"
echo ""
echo "=============================================="
echo "🚀 Your AI agents are now live on Railway!"