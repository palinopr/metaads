#!/bin/bash
# Complete Railway CLI Installation and Deployment

echo "🧠 ULTRATHINKING: INSTALL & DEPLOY"
echo "=================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    *)          OS_TYPE="UNKNOWN";;
esac

echo "Detected OS: $OS_TYPE"
echo ""

# Install Railway CLI
echo "📦 Installing Railway CLI..."
if [ "$OS_TYPE" = "Mac" ]; then
    if command -v brew &> /dev/null; then
        echo "Using Homebrew..."
        brew install railway
    else
        echo "Using install script..."
        curl -fsSL https://railway.app/install.sh | sh
    fi
elif [ "$OS_TYPE" = "Linux" ]; then
    curl -fsSL https://railway.app/install.sh | sh
else
    echo "❌ Unsupported OS. Install manually from: https://docs.railway.app/develop/cli"
    exit 1
fi

# Verify installation
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI installed successfully!"
    railway --version
else
    echo "❌ Installation failed. Try manual install."
    exit 1
fi

echo ""
echo "=================================="
echo "🚀 DEPLOYMENT STEPS"
echo "=================================="
echo ""
echo "Now run these commands:"
echo ""
echo "# 1. Login to Railway"
echo "railway login"
echo ""
echo "# 2. Link to your project"
echo "railway link 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e"
echo ""
echo "# 3. Create NEW Python service"
echo "railway add --service metaads-python-backend"
echo ""
echo "# 4. Deploy to the NEW service"
echo "railway up --service=metaads-python-backend"
echo ""
echo "# 5. Get your URL"
echo "railway domain --service=metaads-python-backend"
echo ""
echo "=================================="
echo ""
echo "Or use the automated script:"
echo "./RAILWAY_CLI_CREATE_SERVICE.sh"
echo ""