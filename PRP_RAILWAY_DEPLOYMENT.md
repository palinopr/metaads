# PRP: Railway Deployment for AI Marketing Agents

## 1. Context Setting
You are deploying a Python-based AI marketing automation platform to Railway. The platform uses LangGraph for multi-agent orchestration and OpenAI for natural language processing. The frontend is already deployed on Vercel and needs to connect to this Railway backend.

## 2. Architecture Overview
```
Vercel (Frontend)          Railway (Python Backend)
┌─────────────────┐       ┌──────────────────────┐
│   Next.js App   │──────▶│     Flask App        │
│  /api/campaign  │       │  /api/campaign/create│
└─────────────────┘       │                      │
                          │  ┌─────────────────┐ │
                          │  │ LangGraph Agents│ │
                          │  ├─────────────────┤ │
                          │  │ • Supervisor    │ │
                          │  │ • Parser        │ │
                          │  │ • Creative      │ │
                          │  │ • Builder       │ │
                          │  └─────────────────┘ │
                          └──────────────────────┘
```

## 3. Step-by-Step Deployment Process

### Phase 1: Pre-deployment Verification
```bash
# Verify all files are in place
✓ app.py                    # Flask application
✓ railway.json              # Railway configuration
✓ railway-requirements.txt  # Python dependencies
✓ Procfile                  # Process definition
✓ runtime.txt              # Python version
✓ src/agents/              # AI agents directory
```

### Phase 2: Railway CLI Setup
```bash
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project in the metaads-new directory
cd /Users/jaimeortiz/Test\ Main/metaads-new
railway init
```

### Phase 3: Environment Configuration
```bash
# Core variables (Required)
railway variables set OPENAI_API_KEY="sk-..."
railway variables set PYTHONPATH="/app/src"

# Monitoring (Recommended)
railway variables set LANGCHAIN_TRACING_V2="true"
railway variables set LANGCHAIN_API_KEY="ls__..."
railway variables set LANGCHAIN_PROJECT="metaads-production"

# Future: Meta Ads Integration
railway variables set META_APP_ID="..."
railway variables set META_APP_SECRET="..."
railway variables set META_ACCESS_TOKEN="..."
```

### Phase 4: Deployment Execution
```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs -f

# Check status
railway status
```

### Phase 5: Post-deployment Configuration
```bash
# 1. Get deployment URL
RAILWAY_URL=$(railway status --json | jq -r '.url')

# 2. Update Vercel environment
# Go to Vercel Dashboard > Settings > Environment Variables
# Add: EXTERNAL_API_URL = https://your-app.up.railway.app

# 3. Test the deployment
curl https://$RAILWAY_URL/
curl -X POST https://$RAILWAY_URL/api/campaign/create \
  -H "Content-Type: application/json" \
  -d '{"message":"Test campaign","userId":"test"}'
```

## 4. Testing Strategy

### Health Check
```bash
# Should return JSON with service info
curl https://your-app.up.railway.app/
```

### API Testing
```python
import requests

# Test campaign creation
response = requests.post(
    "https://your-app.up.railway.app/api/campaign/create",
    json={
        "message": "Create Instagram ads for coffee shop, $50/day budget",
        "userId": "test_user"
    }
)
print(response.json())
```

### Expected Responses
```json
// Without OpenAI key (Demo mode)
{
  "success": true,
  "campaign": {
    "id": "campaign-demo-railway",
    "name": "AI Marketing Campaign",
    "status": "ready",
    "budget": "$100/day"
  },
  "message": "Campaign created successfully! 🚀 (Demo mode)"
}

// With OpenAI key (AI mode)
{
  "success": true,
  "campaign": {
    "id": "campaign-abc123",
    "name": "Coffee Shop Instagram Campaign",
    "status": "ready",
    "budget": "$50/day",
    "audience": "18-35 coffee lovers"
  },
  "content": [{
    "headline": "Wake Up to Perfect Coffee",
    "text": "Artisan roasted, locally loved. Visit us today!",
    "cta": "Get Directions"
  }],
  "executionTime": 3.2,
  "message": "Campaign created with AI optimization! 🚀"
}
```

## 5. Monitoring and Maintenance

### Real-time Logs
```bash
railway logs -f
```

### Performance Metrics
```bash
railway status
```

### Debugging Issues
```bash
# Check environment variables
railway variables

# Restart service
railway restart

# Scale up if needed
railway scale --replicas 2
```

## 6. Cost Optimization

### Estimated Costs
- Basic usage: ~$5-10/month
- With monitoring: ~$10-15/month
- High traffic: ~$20-30/month

### Optimization Tips
1. Use caching for repeated requests
2. Implement request throttling
3. Monitor memory usage
4. Use async operations

## 7. Security Considerations

### API Key Management
- Never commit API keys to Git
- Use Railway's encrypted variables
- Rotate keys regularly

### Access Control
- Implement rate limiting
- Add authentication (future)
- Monitor for suspicious activity

## 8. Rollback Strategy

### If deployment fails:
```bash
# View deployment history
railway deployments

# Rollback to previous version
railway rollback [deployment-id]
```

## 9. Success Metrics

✅ Deployment accessible via HTTPS
✅ Health endpoint returns 200 OK
✅ Campaign creation works (demo or AI)
✅ Response time < 5 seconds
✅ Error rate < 1%
✅ Logs accessible via CLI

## 10. Future Enhancements

1. **WebSocket Support**: Real-time campaign updates
2. **Database Integration**: PostgreSQL for persistence
3. **Redis Cache**: Faster response times
4. **Custom Domain**: brand.com/api
5. **Auto-scaling**: Handle traffic spikes
6. **CI/CD Pipeline**: GitHub Actions integration