# Getting Started with Meta Ads Dashboard API

Welcome to the Meta Ads Dashboard API! This guide will help you get up and running with our comprehensive advertising analytics platform.

## Overview

The Meta Ads Dashboard API provides powerful tools for:
- 📊 Campaign performance monitoring and analytics
- 🤖 AI-powered insights and predictions
- 📱 Real-time data streaming and alerts
- 👥 Multi-account management
- 🎯 Demographic and behavioral analysis
- 📈 Automated reporting and optimization

## Quick Start

### 1. Authentication Setup

Before you can use the API, you'll need to set up authentication:

#### Meta API Access Token
Get your Meta API access token from the [Meta for Developers](https://developers.facebook.com/) portal:

1. Create a Meta App
2. Add the Marketing API product
3. Generate an access token with the required permissions:
   - `ads_read`
   - `ads_management`
   - `business_management`

#### Claude API Key (Optional)
For AI-powered features, you'll need a Claude API key from [Anthropic](https://console.anthropic.com/):

1. Sign up for an Anthropic account
2. Generate an API key
3. Add it to your requests for AI endpoints

### 2. Your First API Call

Let's start with a simple health check:

```bash
curl -X GET https://api.metaads.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "memory": {
    "heapUsed": 125,
    "heapTotal": 200
  },
  "uptime": 3600,
  "timestamp": "2023-12-10T10:30:00Z"
}
```

### 3. Test Your Meta API Connection

Before fetching campaign data, test your Meta API credentials:

```bash
curl -X POST https://api.metaads.com/api/meta \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test_connection",
    "adAccountId": "act_YOUR_AD_ACCOUNT_ID",
    "accessToken": "YOUR_META_ACCESS_TOKEN"
  }'
```

### 4. Fetch Campaign Overview

Once your connection is verified, get your campaign overview:

```bash
curl -X POST https://api.metaads.com/api/meta \
  -H "Content-Type: application/json" \
  -d '{
    "type": "overview",
    "adAccountId": "act_YOUR_AD_ACCOUNT_ID",
    "accessToken": "YOUR_META_ACCESS_TOKEN",
    "datePreset": "last_30d"
  }'
```

## API Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.metaads.com` |
| Staging | `https://staging-api.metaads.com` |
| Development | `http://localhost:3000/api` |

## Authentication

### Meta API Token

Include your Meta API access token in requests:

```javascript
// In request body
{
  "accessToken": "YOUR_META_ACCESS_TOKEN",
  // ... other parameters
}

// Or as Authorization header
headers: {
  "Authorization": "Bearer YOUR_META_ACCESS_TOKEN"
}
```

### Claude API Key

For AI-powered endpoints, include your Claude API key:

```javascript
headers: {
  "X-Claude-API-Key": "YOUR_CLAUDE_API_KEY"
}
```

## Rate Limits

The API implements rate limiting to ensure fair usage:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Validation | 10 requests | 1 minute |
| API calls | 60 requests | 1 minute |
| Login attempts | 5 requests | 15 minutes |

When you exceed rate limits, you'll receive a `429 Too Many Requests` response with a `retryAfter` field indicating when you can retry.

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid credentials)
- `408` - Request Timeout
- `429` - Rate Limited
- `500` - Internal Server Error

Error responses include detailed messages:

```json
{
  "error": "Invalid OAuth access token",
  "success": false,
  "details": "Cannot parse access token. Please check your token and try again."
}
```

## Common Use Cases

### 1. Campaign Performance Monitoring

```javascript
// Get campaign overview
const response = await fetch('/api/meta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'overview',
    adAccountId: 'act_123456789',
    accessToken: 'YOUR_TOKEN',
    datePreset: 'last_7d'
  })
});

const { campaigns } = await response.json();
console.log(`Found ${campaigns.length} campaigns`);
```

### 2. Demographic Analysis

```javascript
// Get demographic breakdown for a campaign
const demographics = await fetch('/api/meta/demographics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignId: '123456789',
    accessToken: 'YOUR_TOKEN',
    datePreset: 'last_30d'
  })
});

const data = await demographics.json();
console.log('Age breakdown:', data.age);
console.log('Gender breakdown:', data.gender);
```

### 3. AI-Powered Insights

```javascript
// Get optimization recommendations
const insights = await fetch('/api/ai-insights', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-Claude-API-Key': 'YOUR_CLAUDE_KEY'
  },
  body: JSON.stringify({
    campaigns: [/* your campaign data */],
    action: 'recommendations',
    params: {}
  })
});

const { data } = await insights.json();
console.log('Recommendations:', data.recommendations);
```

### 4. Real-time Monitoring

```javascript
// Set up Server-Sent Events for real-time logs
const eventSource = new EventSource('/api/logs/stream');

eventSource.onmessage = (event) => {
  const logEntry = JSON.parse(event.data);
  console.log(`[${logEntry.level}] ${logEntry.message}`);
};

// Clean up
eventSource.close();
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @metaads/api-client
```

```javascript
import { MetaAdsClient } from '@metaads/api-client';

const client = new MetaAdsClient({
  baseUrl: 'https://api.metaads.com',
  metaToken: 'YOUR_META_TOKEN',
  claudeKey: 'YOUR_CLAUDE_KEY'
});

// Get campaigns
const campaigns = await client.getCampaigns('act_123456789');

// Get AI insights
const insights = await client.getInsights(campaigns, 'recommendations');
```

### Python

```bash
pip install metaads-api-client
```

```python
from metaads import MetaAdsClient

client = MetaAdsClient(
    base_url='https://api.metaads.com',
    meta_token='YOUR_META_TOKEN',
    claude_key='YOUR_CLAUDE_KEY'
)

# Get campaigns
campaigns = client.get_campaigns('act_123456789')

# Get demographics
demographics = client.get_demographics('123456789', date_preset='last_30d')
```

## WebSocket Real-time Updates

For real-time data streaming, connect to our WebSocket endpoint:

```javascript
const ws = new WebSocket('wss://api.metaads.com/ws');

ws.onopen = () => {
  console.log('Connected to real-time stream');
  
  // Subscribe to campaign updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'campaigns',
    campaignId: '123456789'
  }));
};

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Real-time update:', update);
};
```

## Best Practices

### 1. API Key Security
- Never expose API keys in client-side code
- Use environment variables for API keys
- Rotate keys regularly
- Use different keys for different environments

### 2. Rate Limiting
- Implement exponential backoff for retries
- Cache responses when appropriate
- Use batch requests when possible

### 3. Error Handling
- Always check response status codes
- Implement proper error handling and logging
- Provide meaningful error messages to users

### 4. Performance
- Use appropriate date ranges to limit data
- Implement pagination for large datasets
- Use real-time updates instead of polling

## Next Steps

- 📖 [API Reference](/docs/api/reference) - Complete API documentation
- 🎮 [API Playground](/playground) - Interactive API testing
- 📊 [Dashboard Tutorial](/docs/tutorials/dashboard) - Building dashboards
- 🤖 [AI Features Guide](/docs/tutorials/ai-insights) - Using AI-powered features
- 🔄 [Real-time Integration](/docs/tutorials/realtime) - Setting up real-time features

## Support

Need help? We're here to assist:

- 📧 Email: [support@metaads.com](mailto:support@metaads.com)
- 💬 Discord: [Meta Ads Community](https://discord.gg/metaads)
- 📚 Documentation: [docs.metaads.com](https://docs.metaads.com)
- 🐛 Issues: [GitHub Issues](https://github.com/metaads/dashboard/issues)

## Changelog

Stay updated with the latest changes:
- [v1.0.0](/docs/changelog#v100) - Initial release
- [Latest Updates](/docs/changelog) - Recent changes and improvements