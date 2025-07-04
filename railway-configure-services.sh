#!/bin/bash

# Railway Service Configuration Script
# Configures environment variables and service connections

set -e

echo "⚙️  Railway Service Configuration"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        input=${input:-$default}
    else
        read -p "$prompt: " input
    fi
    
    eval "$var_name='$input'"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}📦 Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Step 1: Configure Python Service
echo -e "${GREEN}🐍 Step 1: Configure Python Service${NC}"
echo "-----------------------------------"

# Check if Python service directory exists
if [ ! -d "railway-python-service" ]; then
    echo -e "${RED}❌ railway-python-service directory not found!${NC}"
    echo "Please run ./railway-service-separator.sh first"
    exit 1
fi

cd railway-python-service

# Create environment file
cat > .env.example << 'EOF'
# Python Service Environment Variables
PORT=8080
OPENAI_API_KEY=your_openai_api_key_here
FLASK_ENV=production
PYTHONUNBUFFERED=1
EOF

echo -e "${GREEN}✅ Created .env.example for Python service${NC}"

# Back to root
cd ..

# Step 2: Configure Next.js Service
echo ""
echo -e "${GREEN}⚛️  Step 2: Configure Next.js Service${NC}"
echo "------------------------------------"

# Create Next.js environment file
cat > .env.local.example << 'EOF'
# Next.js Environment Variables
NEXT_PUBLIC_API_URL=https://metaads-python-api.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

echo -e "${GREEN}✅ Created .env.local.example for Next.js service${NC}"

# Step 3: Create service health check script
echo ""
echo -e "${GREEN}🏥 Step 3: Creating health check script${NC}"
echo "--------------------------------------"

cat > check-services-health.sh << 'EOF'
#!/bin/bash

# Health Check Script for Railway Services

echo "🏥 Railway Services Health Check"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check URL
check_url() {
    local url=$1
    local service=$2
    
    echo -n "Checking $service... "
    
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✅ Healthy${NC}"
        curl -s "$url" | jq '.' 2>/dev/null || curl -s "$url"
    else
        echo -e "${RED}❌ Unreachable${NC}"
    fi
    echo ""
}

# Check Python API
echo "🐍 Python API Service:"
check_url "https://metaads-python-api.railway.app" "Python API"
check_url "https://metaads-python-api.railway.app/api/health" "API Health Endpoint"

# Check Next.js Frontend
echo "⚛️  Next.js Frontend:"
check_url "https://metaads.railway.app" "Next.js App"

# Check Railway service status
echo "📊 Railway Service Status:"
echo "-------------------------"
if command -v railway &> /dev/null; then
    echo "Python Service Logs (last 5 lines):"
    railway logs --service metaads-python-api -n 5 2>/dev/null || echo "Unable to fetch logs"
    echo ""
    echo "Next.js Service Logs (last 5 lines):"
    railway logs --service metaads -n 5 2>/dev/null || echo "Unable to fetch logs"
else
    echo "Railway CLI not installed - cannot fetch logs"
fi
EOF

chmod +x check-services-health.sh
echo -e "${GREEN}✅ Created check-services-health.sh${NC}"

# Step 4: Create environment variable setter
echo ""
echo -e "${GREEN}🔐 Step 4: Creating environment variable setter${NC}"
echo "----------------------------------------------"

cat > set-railway-env-vars.sh << 'EOF'
#!/bin/bash

# Set Railway Environment Variables

echo "🔐 Setting Railway Environment Variables"
echo "======================================="
echo ""

# Function to set env var
set_env_var() {
    local service=$1
    local key=$2
    local value=$3
    
    echo "Setting $key for $service..."
    railway variables set "$key=$value" --service "$service"
}

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔑 Please login to Railway first..."
    railway login
fi

# Link to project
echo "🔗 Linking to project..."
railway link

# Python Service Variables
echo ""
echo "🐍 Setting Python Service Variables..."
echo "------------------------------------"
railway service metaads-python-api

# Optional: Set OPENAI_API_KEY
read -p "Enter OPENAI_API_KEY (or press Enter to skip): " openai_key
if [ -n "$openai_key" ]; then
    set_env_var "metaads-python-api" "OPENAI_API_KEY" "$openai_key"
fi

# Set Python runtime variables
set_env_var "metaads-python-api" "PYTHONUNBUFFERED" "1"
set_env_var "metaads-python-api" "FLASK_ENV" "production"

# Next.js Service Variables
echo ""
echo "⚛️  Setting Next.js Service Variables..."
echo "--------------------------------------"
railway service metaads

# Get Python API URL
read -p "Enter Python API URL [https://metaads-python-api.railway.app]: " api_url
api_url=${api_url:-https://metaads-python-api.railway.app}
set_env_var "metaads" "NEXT_PUBLIC_API_URL" "$api_url"

# Optional: Supabase configuration
read -p "Configure Supabase? (y/n): " configure_supabase
if [ "$configure_supabase" = "y" ]; then
    read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " supabase_url
    read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " supabase_key
    
    if [ -n "$supabase_url" ]; then
        set_env_var "metaads" "NEXT_PUBLIC_SUPABASE_URL" "$supabase_url"
    fi
    if [ -n "$supabase_key" ]; then
        set_env_var "metaads" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$supabase_key"
    fi
fi

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📋 To view current variables:"
echo "  Python Service: railway variables --service metaads-python-api"
echo "  Next.js Service: railway variables --service metaads"
EOF

chmod +x set-railway-env-vars.sh
echo -e "${GREEN}✅ Created set-railway-env-vars.sh${NC}"

# Step 5: Create quick deployment script
echo ""
echo -e "${GREEN}🚀 Step 5: Creating quick deployment script${NC}"
echo "------------------------------------------"

cat > deploy-all-services.sh << 'EOF'
#!/bin/bash

# Deploy All Services to Railway

echo "🚀 Deploying All Services to Railway"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if separator script has been run
if [ ! -d "railway-python-service" ]; then
    echo -e "${YELLOW}⚠️  Running service separator first...${NC}"
    ./railway-service-separator.sh
fi

# Login to Railway
if ! railway whoami &> /dev/null; then
    echo "🔑 Logging into Railway..."
    railway login
fi

# Link project
echo "🔗 Linking to project..."
railway link

# Deploy Python Service
echo ""
echo -e "${GREEN}🐍 Deploying Python Service...${NC}"
echo "------------------------------"
cd railway-python-service
railway service create metaads-python-api 2>/dev/null || railway service metaads-python-api
railway up --service metaads-python-api &
python_pid=$!
cd ..

# Deploy Next.js Service
echo ""
echo -e "${GREEN}⚛️  Deploying Next.js Service...${NC}"
echo "-------------------------------"
railway service metaads
railway up --service metaads &
nextjs_pid=$!

# Wait for deployments
echo ""
echo "⏳ Waiting for deployments to complete..."
wait $python_pid
wait $nextjs_pid

echo ""
echo -e "${GREEN}✅ All services deployed!${NC}"
echo ""
echo "📊 Next steps:"
echo "1. Generate domains in Railway dashboard"
echo "2. Run ./set-railway-env-vars.sh to configure environment"
echo "3. Run ./check-services-health.sh to verify deployment"
EOF

chmod +x deploy-all-services.sh
echo -e "${GREEN}✅ Created deploy-all-services.sh${NC}"

# Step 6: Create troubleshooting script
echo ""
echo -e "${GREEN}🔧 Step 6: Creating troubleshooting script${NC}"
echo "-----------------------------------------"

cat > troubleshoot-railway.sh << 'EOF'
#!/bin/bash

# Railway Troubleshooting Script

echo "🔧 Railway Deployment Troubleshooting"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Railway CLI
echo "1️⃣ Checking Railway CLI..."
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
    railway version
else
    echo -e "${RED}❌ Railway CLI not installed${NC}"
    echo "   Run: npm install -g @railway/cli"
fi

# Check login status
echo ""
echo "2️⃣ Checking Railway login..."
if railway whoami &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Logged in as: $(railway whoami)${NC}"
else
    echo -e "${RED}❌ Not logged in${NC}"
    echo "   Run: railway login"
fi

# Check project link
echo ""
echo "3️⃣ Checking project link..."
if railway status &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Linked to project${NC}"
else
    echo -e "${RED}❌ Not linked to project${NC}"
    echo "   Run: railway link"
fi

# Check file structure
echo ""
echo "4️⃣ Checking file structure..."
files_ok=true

# Check Python files
if [ -f "railway-python-service/app.py" ]; then
    echo -e "${GREEN}✅ Python service files found${NC}"
else
    echo -e "${RED}❌ Python service files missing${NC}"
    files_ok=false
fi

# Check Next.js files
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ Next.js files found${NC}"
else
    echo -e "${RED}❌ Next.js files missing${NC}"
    files_ok=false
fi

# Check ignore files
echo ""
echo "5️⃣ Checking ignore files..."
if [ -f ".railwayignore" ]; then
    echo -e "${GREEN}✅ Main .railwayignore exists${NC}"
else
    echo -e "${YELLOW}⚠️  Main .railwayignore missing${NC}"
fi

if [ -f "railway-python-service/.railwayignore" ]; then
    echo -e "${GREEN}✅ Python service .railwayignore exists${NC}"
else
    echo -e "${YELLOW}⚠️  Python service .railwayignore missing${NC}"
fi

# Check runtime.txt format
echo ""
echo "6️⃣ Checking Python runtime..."
if [ -f "railway-python-service/runtime.txt" ]; then
    runtime_content=$(cat railway-python-service/runtime.txt)
    if [[ "$runtime_content" == "python-3."* ]]; then
        echo -e "${GREEN}✅ runtime.txt format correct: $runtime_content${NC}"
    else
        echo -e "${RED}❌ runtime.txt format incorrect: $runtime_content${NC}"
        echo "   Should be: python-3.11.0"
    fi
else
    echo -e "${RED}❌ runtime.txt missing${NC}"
fi

# Service status
echo ""
echo "7️⃣ Checking service status..."
if railway status &> /dev/null 2>&1; then
    echo "Python Service:"
    railway logs --service metaads-python-api -n 3 2>/dev/null || echo "   Service not found or no logs"
    echo ""
    echo "Next.js Service:"
    railway logs --service metaads -n 3 2>/dev/null || echo "   Service not found or no logs"
fi

# Recommendations
echo ""
echo "📋 Recommendations:"
echo "==================="
if [ "$files_ok" = false ]; then
    echo "• Run ./railway-service-separator.sh to fix file structure"
fi
echo "• Ensure all services have domains generated in Railway dashboard"
echo "• Check Railway dashboard for deployment errors"
echo "• Run ./check-services-health.sh after deployment"
EOF

chmod +x troubleshoot-railway.sh
echo -e "${GREEN}✅ Created troubleshoot-railway.sh${NC}"

# Final summary
echo ""
echo "✅ ============================================"
echo "✅ Railway Configuration Scripts Created!"
echo "✅ ============================================"
echo ""
echo "📋 Available scripts:"
echo "  • ${GREEN}railway-service-separator.sh${NC} - Separates services"
echo "  • ${GREEN}deploy-all-services.sh${NC} - Deploys both services"
echo "  • ${GREEN}set-railway-env-vars.sh${NC} - Configures environment"
echo "  • ${GREEN}check-services-health.sh${NC} - Verifies deployment"
echo "  • ${GREEN}troubleshoot-railway.sh${NC} - Diagnoses issues"
echo ""
echo "🚀 Quick start:"
echo "  1. Run: ${YELLOW}./railway-service-separator.sh${NC}"
echo "  2. Run: ${YELLOW}./deploy-all-services.sh${NC}"
echo "  3. Generate domains in Railway dashboard"
echo "  4. Run: ${YELLOW}./set-railway-env-vars.sh${NC}"
echo "  5. Run: ${YELLOW}./check-services-health.sh${NC}"