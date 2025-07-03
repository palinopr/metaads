# 🚀 Deploy to Railway - Step by Step

I've prepared everything for deployment. You just need to run these commands:

## Quick Deploy (Copy & Paste)

```bash
# 1. Set PATH and navigate
export PATH="$PATH:/Users/jaimeortiz/.npm-global/bin"
cd /Users/jaimeortiz/Test\ Main/metaads-new

# 2. Login to Railway (opens browser)
railway login

# 3. Link to your project
railway link

# 4. Deploy!
railway up

# 5. Get your URL
railway status
```

## What Gets Deployed

✅ **Flask API Server** (`app.py`)
- Health check: `GET /`
- Campaign API: `POST /api/campaign/create`

✅ **AI Agents** (`src/agents/`)
- Supervisor (orchestrator)
- Parser (NLP extraction)
- Creative (ad generation)
- Builder (campaign structure)

✅ **Dependencies**
- LangGraph for agent orchestration
- OpenAI for AI processing
- Flask for web server

## After Deployment

### 1. Set Environment Variables (if needed)
```bash
# For AI features (optional - works in demo mode without)
railway variables set OPENAI_API_KEY="sk-..."

# For monitoring (optional)
railway variables set LANGCHAIN_TRACING_V2="true"
railway variables set LANGCHAIN_API_KEY="ls-..."
```

### 2. Test Your Deployment
```bash
# Get your URL
railway status

# Test health endpoint
curl https://your-app.railway.app/

# Test campaign creation
curl -X POST https://your-app.railway.app/api/campaign/create \
  -H "Content-Type: application/json" \
  -d '{"message": "Create Instagram ads for coffee shop", "userId": "test"}'
```

### 3. Update Vercel Frontend
Add to Vercel environment variables:
```
EXTERNAL_API_URL=https://your-app.railway.app
```

## Monitoring

```bash
# View logs
railway logs -f

# Check status
railway status

# Restart if needed
railway restart
```

## Files Being Deployed

- `app.py` - Flask server
- `railway-requirements.txt` - Python dependencies
- `Procfile` - Process configuration
- `railway.json` - Railway configuration
- `railway.toml` - Build configuration
- `src/agents/` - All AI agent code

Everything is ready! Just run the commands above 🎉