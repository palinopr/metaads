# 🚀 Deploy to Your Existing Railway Project NOW

Since you already have a Railway project, here's the fastest way to deploy:

## Quick Deploy (2 minutes)

```bash
# 1. Make sure you're in the right directory
cd /Users/jaimeortiz/Test\ Main/metaads-new

# 2. Run the redeploy script
./redeploy_railway.sh
```

## Or Manually (if script doesn't work):

```bash
# 1. Link to your existing project
railway link

# 2. Deploy the new code
railway up

# 3. Check logs
railway logs -f
```

## What This Deploys:

✅ **Flask API** at `/api/campaign/create`
✅ **LangGraph AI Agents**:
  - Supervisor (orchestrator)
  - Parser (NLP extraction)  
  - Creative (ad generation)
  - Builder (campaign structure)
✅ **Demo Mode** (works without OpenAI key)
✅ **Production Mode** (with OpenAI key)

## After Deployment:

1. **Get your Railway URL**:
   ```bash
   railway status
   ```

2. **Update Vercel** (in dashboard):
   ```
   EXTERNAL_API_URL=https://your-app.railway.app
   ```

3. **Test it**:
   ```bash
   curl https://your-app.railway.app/
   ```

## If You Need OpenAI (for real AI):

```bash
railway variables set OPENAI_API_KEY="sk-..."
railway restart
```

That's it! Your AI agents will be live in ~3 minutes 🎉