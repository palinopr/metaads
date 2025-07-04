#!/bin/bash
echo "Deploying Next.js to metaads service..."

# Use the Next.js specific ignore file
cp .railwayignore-nextjs .railwayignore

# Use Next.js railway config
cp railway-nextjs.json railway.json

# Deploy to metaads service
railway up --service metaads

# Clean up
rm .railwayignore railway.json

echo "Next.js deployment complete!"
