# 🚂 RAILWAY CLI - CREATE NEW PYTHON SERVICE

## YES! Railway CLI can create new services!

### Quick Commands (Copy & Paste):

```bash
# 1. Install Railway CLI (if needed)
brew install railway  # Mac
# or: curl -fsSL https://railway.app/install.sh | sh  # Linux

# 2. Login
railway login

# 3. Link to your project
railway link 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e

# 4. Create NEW Python service
railway add --service metaads-python-backend

# 5. Deploy to the NEW service
railway up --service=metaads-python-backend

# 6. Get the URL
railway domain --service=metaads-python-backend
```

## 🎯 Complete One-Liner Solution:

```bash
railway login && \
railway link 88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e && \
railway add --service metaads-python-api && \
railway up --service=metaads-python-api && \
railway domain --service=metaads-python-api
```

## 📋 Step-by-Step Explanation:

### 1. **Create Service**
```bash
railway add --service <service-name>
```
Creates a NEW service in your existing project

### 2. **Deploy to Specific Service**
```bash
railway up --service=<service-name>
```
Deploys current directory to that specific service

### 3. **Switch Between Services**
```bash
railway service
```
Interactive service selector

### 4. **View Logs**
```bash
railway logs --service=<service-name>
```

### 5. **Set Environment Variables**
```bash
railway variables set OPENAI_API_KEY=xxx --service=<service-name>
```

## 🔥 Pro Tips:

1. **Avoid name conflicts**: Don't use "metaads" (that's your Next.js service)
2. **Use descriptive names**: Like `metaads-python-api` or `marketing-ai-backend`
3. **Check deployment**: `railway status --service=<name>`
4. **Monitor in real-time**: `railway logs --service=<name> -f`

## 🚀 RUN THIS NOW:

```bash
./RAILWAY_CLI_CREATE_SERVICE.sh
```

This script will:
1. Check Railway CLI is installed
2. Login if needed
3. Link to your project
4. Create new Python service
5. Deploy your code
6. Get the URL

---
**ULTRATHINKING**: Railway CLI gives you FULL control to create and manage multiple services! 🧠