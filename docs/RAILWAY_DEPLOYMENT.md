# Deploy AI Agents on Railway

Railway is perfect for deploying our Python AI agents because it:
- ✅ Supports all Python packages (including LangGraph)
- ✅ Has WebSocket support for real-time updates
- ✅ Auto-scales based on demand
- ✅ Provides easy environment variable management
- ✅ Offers $5/month starter plan

## Quick Deploy Steps

### 1. Create Railway Account
Go to [railway.app](https://railway.app) and sign up with GitHub

### 2. Deploy from GitHub

```bash
# In Railway Dashboard:
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose "palinopr/metaads"
4. Railway will auto-detect our Python app
```

### 3. Set Environment Variables

In Railway project settings, add:

```env
# Required
OPENAI_API_KEY=sk-...

# Optional but recommended
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=metaads-production

# Meta Ads (when ready)
META_APP_ID=...
META_APP_SECRET=...
META_ACCESS_TOKEN=...
```

### 4. Deploy

Railway will automatically:
- Install dependencies from `railway-requirements.txt`
- Run the Flask app with Gunicorn
- Provide a URL like `metaads-production.up.railway.app`

### 5. Update Frontend

Update your Vercel environment variables:

```env
# In Vercel Dashboard
NEXT_PUBLIC_API_URL=https://metaads-production.up.railway.app
```

Then update the API route:

```typescript
// src/app/api/campaign/create/route.ts
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/campaign/create`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId })
  }
);
```

## What You Get

### Endpoints

- `GET /` - Health check
- `POST /api/campaign/create` - Create campaign with AI
- `GET /api/health` - Detailed health status

### Features

- **Real AI Processing**: Full LangGraph workflow
- **Auto-scaling**: Handles traffic spikes
- **Monitoring**: Built-in logs and metrics
- **WebSockets**: For real-time updates (future)
- **Custom Domain**: Add your own domain

## Testing

```bash
# Test health endpoint
curl https://your-app.railway.app/

# Test campaign creation
curl -X POST https://your-app.railway.app/api/campaign/create \
  -H "Content-Type: application/json" \
  -d '{"message": "Create campaign for my app", "userId": "test"}'
```

## Monitoring

Railway provides:
- Real-time logs
- CPU/Memory metrics
- Request tracking
- Error alerts

## Costs

- **Starter**: $5/month (includes $5 of usage)
- **Usage**: ~$0.000463/GB-hr for memory
- **Estimated**: $5-20/month for typical usage

## Advanced Configuration

### Custom Domain

1. Add domain in Railway settings
2. Update DNS records
3. SSL automatically provisioned

### Scaling

```json
// railway.json
{
  "deploy": {
    "numReplicas": 2,  // Scale to 2 instances
    "minInstances": 1,
    "maxInstances": 5
  }
}
```

### Database (Future)

Railway makes it easy to add:
- PostgreSQL for user data
- Redis for caching
- MongoDB for analytics

## Troubleshooting

### "Module not found" errors
- Check `railway-requirements.txt` has all dependencies
- Ensure `PYTHONPATH` includes `/app/src`

### Timeout errors
- Increase timeout in Procfile
- Use async endpoints for long operations

### Memory issues
- Upgrade to higher plan
- Optimize agent memory usage

## Local Testing

```bash
# Test Railway setup locally
pip install -r railway-requirements.txt
export PORT=5000
python app.py
```

## CI/CD

Railway auto-deploys on push to main. For staging:

```bash
# Create staging environment
railway environment create staging

# Deploy to staging
git push origin staging
```

## Why Railway vs Others?

| Feature | Railway | Vercel | Heroku | AWS |
|---------|---------|---------|---------|------|
| Python Support | ✅ Full | ⚠️ Limited | ✅ Full | ✅ Full |
| LangGraph | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Setup Time | 5 min | 30 min | 15 min | 2 hours |
| WebSockets | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Cost | $5+ | $20+ | $7+ | Complex |

Railway is the sweet spot for our AI agents!