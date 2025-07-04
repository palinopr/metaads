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
