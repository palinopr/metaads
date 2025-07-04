# 🚀 DEPLOY TO RAILWAY NOW

## Option 1: Direct GitHub Deploy (RECOMMENDED)

1. Go to: https://railway.app/new/github
2. Select your repository: `palinopr/metaads`
3. **IMPORTANT**: Name service: `metaads-python-api`
4. Click "Deploy Now"
5. Wait 2-3 minutes
6. Get URL from Settings → Domains

## Option 2: Upload These Files

1. Go to: https://railway.app/new
2. Click "Empty Project"
3. Name it: `metaads-python-api`
4. Drag these 4 files:
   - app.py
   - requirements.txt
   - Procfile
   - runtime.txt
5. Click Deploy

## Option 3: Use Railway CLI

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Deploy
railway login
railway init
railway up
```

## Success Test

```bash
curl https://your-app.railway.app
# Should return: {"status": "healthy"}
```
