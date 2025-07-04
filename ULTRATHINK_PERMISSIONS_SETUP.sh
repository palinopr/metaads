#!/bin/bash
# ULTRATHINKING: Setup Railway CLI with Full Permissions

echo "🧠 ULTRATHINKING PERMISSIONS SETUP"
echo "=================================="
echo ""

echo "📋 Option 1: Install Railway CLI Locally (No Sudo)"
echo "------------------------------------------------"
echo "# Create local bin directory"
echo "mkdir -p ~/railway-cli"
echo "cd ~/railway-cli"
echo ""
echo "# Download Railway CLI"
echo "curl -L https://github.com/railwayapp/cli/releases/latest/download/railway-macos-arm64 -o railway"
echo "chmod +x railway"
echo ""
echo "# Add to PATH for this session"
echo "export PATH=\"\$HOME/railway-cli:\$PATH\""
echo ""
echo "# Login to Railway"
echo "./railway login"
echo ""

echo "📋 Option 2: Use NPX (Recommended)"
echo "---------------------------------"
echo "# No installation needed! Just run:"
echo "cd /Users/jaimeortiz/Test\ Main/metaads-new"
echo "npx @railway/cli@latest login --browserless"
echo ""
echo "# Then get your token from:"
echo "# https://railway.app/account/tokens"
echo ""
echo "# Set the token:"
echo "export RAILWAY_TOKEN=your-token-here"
echo ""

echo "📋 Option 3: Direct API Token (BEST)"
echo "------------------------------------"
echo "1. Go to: https://railway.app/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name it: 'CLI Deployment'"
echo "4. Copy the token"
echo ""
echo "Then use it like this:"
echo "export RAILWAY_TOKEN=your-token-here"
echo "npx @railway/cli@latest link -p 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e"
echo "npx @railway/cli@latest up --service metaads-python-api"
echo ""

echo "🚀 QUICK DEPLOYMENT SCRIPT"
echo "========================="
echo ""
cat > deploy_with_token.sh << 'EOF'
#!/bin/bash
# Railway deployment with token

echo "Enter your Railway token (get from https://railway.app/account/tokens):"
read -s RAILWAY_TOKEN
export RAILWAY_TOKEN

echo "Deploying to Railway..."
cd /Users/jaimeortiz/Test\ Main/metaads-new

# Link to project
npx @railway/cli@latest link -p 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e

# Create new Python service
npx @railway/cli@latest service create metaads-python-api

# Deploy
npx @railway/cli@latest up --service metaads-python-api

echo "Deployment complete!"
EOF

chmod +x deploy_with_token.sh
echo "Created: deploy_with_token.sh"
echo ""
echo "=================================="
echo "🎯 RECOMMENDED STEPS:"
echo "1. Get token: https://railway.app/account/tokens"
echo "2. Run: ./deploy_with_token.sh"
echo "3. Enter your token when prompted"
echo "4. Watch deployment happen!"
echo "=================================="