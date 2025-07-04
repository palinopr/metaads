# 🧠 ULTRATHINKING TASK: ENABLE AI

## Current Situation
- Backend runs in "demo" mode (returns fake campaigns)
- No OPENAI_API_KEY configured
- AI agents exist but aren't being used

## To Enable Real AI

### Option 1: Add OpenAI API Key (Recommended)
```bash
# Add to Railway service
railway variables set OPENAI_API_KEY=sk-... --service metaads-python-api

# Restart service
railway restart --service metaads-python-api
```

### Option 2: Use Anthropic Claude API
Update backend to use Claude instead:
```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-... --service metaads-python-api
```

### Option 3: Use Local LLM (Ollama)
For free testing without API keys

## What Happens When AI Is Enabled

### Demo Mode (Current):
- Generic campaign names
- Fixed templates
- No real intelligence

### AI Mode (With API Key):
- Analyzes business type
- Generates unique ad copy
- Smart targeting suggestions
- Budget optimization
- Competitor analysis

## Test After Adding Key
```bash
curl -X POST https://metaads-python-api-production.up.railway.app/api/campaign/create \
  -H "Content-Type: application/json" \
  -d '{"message": "Create ads for my vegan restaurant in Brooklyn targeting health-conscious millennials", "userId": "test"}'
```

With AI enabled, this will return:
- Brooklyn-specific targeting
- Health & vegan keywords
- Millennial-focused messaging
- Local competitor insights

## Cost Considerations
- OpenAI GPT-3.5: ~$0.002 per campaign
- OpenAI GPT-4: ~$0.03 per campaign
- Claude: Similar pricing
- Start with GPT-3.5 for testing