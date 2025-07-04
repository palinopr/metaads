#!/bin/bash
echo "Deploying Python API to metaads-python-api service..."

# Remove any railway.json (let Railway auto-detect Python)
rm -f railway.json

# Use the Python railwayignore
cp .railwayignore .railwayignore.backup 2>/dev/null || true

# Deploy to Python service
railway up --service metaads-python-api

echo "Python API deployment complete!"
