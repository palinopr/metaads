# 🚀 DEPLOYMENT QUICK GUIDE

## Services Overview
- **metaads**: ❌ Next.js service (DO NOT USE for Python)
- **metaads-python-api**: ✅ Python backend service (USE THIS)

## After Each Code Change

### 1. Quick Deploy (If already linked)
```bash
cd /Users/jaimeortiz/Test\ Main/metaads-new
git add -A && git commit -m "Update" && git push
railway up --service metaads-python-api
```

### 2. Full Deploy Process
```bash
# Navigate to project
cd /Users/jaimeortiz/Test\ Main/metaads-new

# Commit changes
git add -A
git commit -m "Description of changes"
git push origin main

# Link to Railway (if not linked)
railway link -p 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e

# Deploy to Python service
railway up --service metaads-python-api

# Monitor deployment
railway logs

# Test deployment
curl https://metaads-python-api-production.up.railway.app
```

## Service URLs
- **Python API**: https://metaads-python-api-production.up.railway.app
- **Frontend**: https://metaads.vercel.app
- **Railway Dashboard**: https://railway.com/project/88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e

## Common Commands
```bash
# Check status
railway status

# View logs
railway logs

# Get domain
railway domain

# Set environment variables
railway variables set KEY=value

# Open in browser
railway open
```

## Troubleshooting
- **"No deployments found"**: Wait 30 seconds, deployment is starting
- **"Application not found"**: Deployment still building, wait 2-3 minutes
- **Service crashes**: Make sure you're using `metaads-python-api`, not `metaads`

## Success Test
```bash
# Should return JSON with "status": "healthy"
curl https://metaads-python-api-production.up.railway.app
```