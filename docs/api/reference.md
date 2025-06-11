# API Reference

Complete reference documentation for the Meta Ads Dashboard API endpoints, request/response schemas, and examples.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.metaads.com` |
| Staging | `https://staging-api.metaads.com` |
| Development | `http://localhost:3000/api` |

## Authentication

### Meta API Token
Include your Meta API access token in request bodies or as an Authorization header:

```json
{
  "accessToken": "YOUR_META_ACCESS_TOKEN"
}
```

Or as a header:
```
Authorization: Bearer YOUR_META_ACCESS_TOKEN
```

### Claude API Key
For AI-powered endpoints, include your Claude API key as a header:
```
X-Claude-API-Key: YOUR_CLAUDE_API_KEY
```

## Rate Limits

| Endpoint Type | Limit | Window | Scope |
|---------------|-------|--------|-------|
| Validation | 10 requests | 1 minute | Per IP |
| API calls | 60 requests | 1 minute | Per IP |
| Login attempts | 5 requests | 15 minutes | Per IP |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when window resets

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2023-12-10T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2023-12-10T10:30:00Z"
}
```

## Endpoints

### System Endpoints

#### GET /api/health
Check API health status and system metrics.

**Response:**
```json
{
  "status": "healthy",
  "memory": {
    "heapUsed": 125,
    "heapTotal": 200,
    "external": 15,
    "rss": 180
  },
  "uptime": 3600,
  "timestamp": "2023-12-10T10:30:00Z"
}
```

**Status Codes:**
- `200` - System is healthy
- `500` - System error

#### GET /api/health/detailed
Get comprehensive system health information.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "redis": "healthy",
    "meta_api": "healthy",
    "claude_api": "healthy"
  },
  "metrics": {
    "requests_per_minute": 145,
    "error_rate": 0.2,
    "avg_response_time": 245
  },
  "timestamp": "2023-12-10T10:30:00Z"
}
```

### Meta API Endpoints

#### POST /api/meta
Primary endpoint for Meta API operations. Supports multiple request types.

**Request Body:**
The request body varies based on the `type` parameter:

##### Test Connection
```json
{
  "type": "test_connection",
  "adAccountId": "act_123456789",
  "accessToken": "YOUR_META_ACCESS_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "accountInfo": {
    "id": "act_123456789",
    "name": "My Ad Account",
    "status": "ACTIVE",
    "currency": "USD",
    "timezone": "America/New_York"
  }
}
```

##### Campaign Overview
```json
{
  "type": "overview",
  "adAccountId": "act_123456789",
  "accessToken": "YOUR_META_ACCESS_TOKEN",
  "datePreset": "last_30d"
}
```

**Response:**
```json
{
  "success": true,
  "campaigns": [
    {
      "id": "123456789",
      "name": "Summer Sale Campaign",
      "status": "ACTIVE",
      "objective": "CONVERSIONS",
      "daily_budget": 100,
      "start_time": "2023-12-01T00:00:00Z",
      "created_time": "2023-11-30T12:00:00Z",
      "updated_time": "2023-12-10T10:30:00Z",
      "account_id": "act_123456789",
      "spend": 1500.50,
      "impressions": 50000,
      "clicks": 2500,
      "ctr": 5.0,
      "cpc": 0.60,
      "conversions": 75,
      "revenue": 6300.00,
      "roas": 4.2,
      "adsets": [
        {
          "id": "987654321",
          "name": "Age 25-34",
          "status": "ACTIVE",
          "daily_budget": 50,
          "spend": 750.25,
          "impressions": 25000,
          "clicks": 1250
        }
      ]
    }
  ]
}
```

##### Campaign Details
```json
{
  "type": "campaign_details",
  "campaignId": "123456789",
  "adAccountId": "act_123456789",
  "accessToken": "YOUR_META_ACCESS_TOKEN",
  "datePreset": "last_7d"
}
```

**Response:**
```json
{
  "success": true,
  "historicalDailyData": [
    {
      "date": "2023-12-09",
      "spend": 150.00,
      "revenue": 630.00,
      "conversions": 12,
      "impressions": 5000,
      "clicks": 250,
      "ctr": 5.0,
      "cpc": 0.60,
      "roas": 4.2
    }
  ],
  "todayHourlyData": [
    {
      "hour": "10:00",
      "spend": 12.50,
      "impressions": 500,
      "clicks": 25
    }
  ],
  "adSets": [ /* AdSet objects */ ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request parameters
- `401` - Invalid access token
- `408` - Request timeout
- `429` - Rate limit exceeded
- `500` - Internal server error

#### POST /api/meta/demographics
Get demographic breakdown data for a campaign.

**Request Body:**
```json
{
  "campaignId": "123456789",
  "accessToken": "YOUR_META_ACCESS_TOKEN",
  "datePreset": "last_30d"
}
```

**Response:**
```json
{
  "age": [
    {
      "range": "25-34",
      "conversions": 50,
      "revenue": 2100.00,
      "impressions": 15000,
      "spend": 500.00,
      "percentage": 35
    }
  ],
  "gender": [
    {
      "type": "Female",
      "conversions": 80,
      "revenue": 3360.00,
      "spend": 800.00,
      "percentage": 55
    }
  ],
  "region": [
    {
      "city": "New York",
      "state": "NY",
      "conversions": 30,
      "revenue": 1260.00,
      "spend": 300.00,
      "roas": 4.2
    }
  ],
  "device": [
    {
      "platform": "Mobile",
      "conversions": 100,
      "revenue": 4200.00,
      "spend": 1000.00,
      "percentage": 70
    }
  ]
}
```

#### GET /api/meta/day-hour-insights
Get performance data broken down by day of week and hour of day.

**Query Parameters:**
- `campaignId` (required): Meta campaign ID
- `accessToken` (required): Meta API access token
- `datePreset` (optional): Date preset (default: last_30d)

**Response:**
```json
{
  "dayOfWeek": [
    {
      "day": "Monday",
      "impressions": 12000,
      "clicks": 600,
      "spend": 180.00,
      "conversions": 18
    }
  ],
  "hourOfDay": [
    {
      "hour": 10,
      "impressions": 2000,
      "clicks": 100,
      "spend": 30.00,
      "conversions": 3
    }
  ]
}
```

### AI & Analytics Endpoints

#### POST /api/ai-insights
Generate AI-powered insights and predictions.

**Request Body:**
```json
{
  "campaigns": [ /* Campaign objects */ ],
  "action": "recommendations",
  "params": {
    /* Action-specific parameters */
  },
  "claudeApiKey": "YOUR_CLAUDE_API_KEY"
}
```

**Actions:**

##### Predictions
```json
{
  "action": "predictions",
  "params": {
    "campaign": { /* Campaign object */ },
    "timeframe": "30d",
    "scenario": "moderate",
    "includeSeasonality": false,
    "includeCompetitorAnalysis": false
  }
}
```

##### Recommendations
```json
{
  "action": "recommendations",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec_001",
        "type": "budget",
        "priority": "high",
        "impact": {
          "metric": "roas",
          "expectedChange": 15.5,
          "confidence": 0.85
        },
        "action": "Increase daily budget by 20% for high-performing ad sets",
        "reasoning": "Ad sets targeting 25-34 demographics show strong ROAS of 4.2x with room for scale"
      }
    ]
  },
  "action": "recommendations",
  "timestamp": "2023-12-10T10:30:00Z"
}
```

##### Anomaly Detection
```json
{
  "action": "anomalies",
  "params": {
    "lookbackDays": 30
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "isAnomaly": true,
        "severity": "high",
        "metric": "cpc",
        "value": 1.25,
        "expectedRange": [0.45, 0.75],
        "timestamp": "2023-12-09T14:00:00Z",
        "explanation": "Cost per click increased 67% above normal range",
        "recommendations": [
          "Review keyword bids and competition",
          "Check for audience overlap"
        ]
      }
    ]
  },
  "action": "anomalies",
  "timestamp": "2023-12-10T10:30:00Z"
}
```

#### GET /api/ai-insights?action=health
Check AI service health and available features.

**Response:**
```json
{
  "status": "healthy",
  "service": "AI Insights API",
  "version": "1.0.0",
  "features": [
    "predictive-analytics",
    "anomaly-detection",
    "optimization-recommendations",
    "trend-analysis",
    "competitor-intelligence",
    "sentiment-analysis",
    "ab-testing",
    "performance-prediction",
    "insights-generation"
  ],
  "timestamp": "2023-12-10T10:30:00Z"
}
```

### Real-time Endpoints

#### POST /api/realtime
Manage real-time data streams and events.

**Request Body:**
```json
{
  "action": "ingest_metrics",
  "data": {
    "metrics": [
      {
        "campaignId": "123456789",
        "name": "impressions",
        "value": 1000,
        "timestamp": "2023-12-10T10:30:00Z",
        "change": 5.2
      }
    ]
  }
}
```

**Actions:**
- `ingest_metrics`: Inject real-time metrics data
- `campaign_update`: Handle campaign-specific updates
- `budget_alert`: Handle budget-related alerts
- `ab_test_update`: Handle A/B test significance updates
- `collaboration_event`: Handle team collaboration events
- `competitor_update`: Handle competitor intelligence updates
- `system_status`: Broadcast system status updates
- `get_stats`: Return real-time system statistics
- `test_connection`: Test real-time connectivity

#### GET /api/realtime
Get real-time system status.

**Query Parameters:**
- `demo` (optional): Set to "true" to generate demo data

**Response:**
```json
{
  "status": "operational",
  "uptime": 3600,
  "timestamp": "2023-12-10T10:30:00Z",
  "stats": {
    "websocket": {
      "connections": 25,
      "channels": ["campaigns", "alerts", "performance"]
    },
    "streaming": {
      "queries": 150,
      "events": 12500
    }
  }
}
```

### WebSocket Endpoints

#### GET /api/ws
Get WebSocket connection information.

**Response:**
```json
{
  "message": "WebSocket endpoint",
  "wsUrl": "wss://api.metaads.com/ws",
  "status": "ready"
}
```

#### POST /api/ws
Send messages through WebSocket connections.

**Request Body:**
```json
{
  "type": "campaign-update",
  "channel": "campaign_123456789",
  "data": {
    "spend": 150.00,
    "impressions": 5000,
    "timestamp": "2023-12-10T10:30:00Z"
  }
}
```

**Message Types:**
- `campaign-update`: Campaign performance updates
- `metric-update`: Individual metric updates
- `alert`: System or performance alerts
- `broadcast`: General broadcast messages
- `stats`: WebSocket statistics

### Monitoring Endpoints

#### POST /api/error-metrics
Submit error metrics for tracking.

**Request Body:**
```json
{
  "metrics": {
    "totalErrors": 5,
    "errorRate": 2.1,
    "errorsByCategory": {
      "network": 2,
      "validation": 2,
      "timeout": 1
    },
    "errorsBySeverity": {
      "low": 3,
      "medium": 2,
      "high": 0
    }
  },
  "timestamp": "2023-12-10T10:30:00Z",
  "sessionId": "session_abc123"
}
```

#### GET /api/error-metrics
Retrieve aggregated error metrics.

**Query Parameters:**
- `period` (optional): Time period (1h, 6h, 24h, 7d, 30d)
- `category` (optional): Error category filter

**Response:**
```json
{
  "totalErrors": 125,
  "errorRate": 1.8,
  "errorsByCategory": {
    "network": 45,
    "validation": 35,
    "timeout": 25,
    "auth": 20
  },
  "errorsBySeverity": {
    "low": 75,
    "medium": 35,
    "high": 15
  },
  "sessions": 350,
  "timeRange": {
    "start": "2023-12-09T10:30:00Z",
    "end": "2023-12-10T10:30:00Z"
  }
}
```

#### GET /api/logs/stream
Server-Sent Events endpoint for real-time log streaming.

**Query Parameters:**
- `source` (optional): Filter by log source
- `level` (optional): Filter by log level (debug, info, warning, error)
- `category` (optional): Filter by category (meta-api, http, database, general)

**Response:** Server-Sent Events stream
```
data: {"id":"log_001","timestamp":"2023-12-10T10:30:00Z","level":"info","message":"Campaign data fetched","category":"meta-api"}

data: {"id":"log_002","timestamp":"2023-12-10T10:30:01Z","level":"warning","message":"High response time detected","category":"http"}
```

#### POST /api/logs/stream
Submit a log entry.

**Request Body:**
```json
{
  "level": "info",
  "message": "Custom log message",
  "details": {
    "userId": "user_123",
    "action": "fetch_campaigns"
  },
  "source": "my_app"
}
```

## Data Types

### Campaign Object
```typescript
interface Campaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  budget_remaining?: number
  daily_budget?: number
  lifetime_budget?: number
  start_time: string
  stop_time?: string
  created_time: string
  updated_time: string
  insights?: CampaignInsights
  adsets?: AdSet[]
  account_id: string
}
```

### Campaign Insights Object
```typescript
interface CampaignInsights {
  impressions: number
  clicks: number
  spend: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  cpp: number
  conversions?: number
  conversion_rate?: number
  revenue?: number
  roas?: number
  actions?: Action[]
  date_start?: string
  date_stop?: string
}
```

### AdSet Object
```typescript
interface AdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  daily_budget?: number
  lifetime_budget?: number
  start_time: string
  end_time?: string
  targeting?: Targeting
  insights?: AdSetInsights
  ads?: Ad[]
}
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_TOKEN` | Invalid or expired access token | Refresh your Meta API token |
| `RATE_LIMITED` | Too many requests | Wait for rate limit reset |
| `INVALID_ACCOUNT` | Invalid ad account ID | Verify account ID format (act_XXXXXX) |
| `TIMEOUT` | Request timeout | Retry with exponential backoff |
| `INVALID_CAMPAIGN` | Campaign not found | Verify campaign ID |
| `MISSING_PERMISSION` | Insufficient permissions | Check token permissions |
| `NETWORK_ERROR` | Network connectivity issue | Check network connection |
| `VALIDATION_ERROR` | Invalid request parameters | Check request format |

## Webhooks

Configure webhooks to receive real-time notifications:

### Webhook Events
- `campaign.performance.threshold`: Performance threshold alerts
- `budget.consumption.warning`: Budget consumption warnings
- `ab_test.significance`: A/B test statistical significance
- `anomaly.detected`: Performance anomaly detection
- `system.maintenance`: System maintenance notifications

### Webhook Payload
```json
{
  "event": "campaign.performance.threshold",
  "timestamp": "2023-12-10T10:30:00Z",
  "data": {
    "campaignId": "123456789",
    "metric": "roas",
    "value": 2.1,
    "threshold": 3.0,
    "severity": "warning"
  },
  "signature": "sha256=abc123..."
}
```

## SDKs

### JavaScript/TypeScript
```bash
npm install @metaads/api-client
```

### Python
```bash
pip install metaads-api-client
```

### Examples
See the [SDK documentation](/docs/sdks) for detailed usage examples.

## Support

- 📧 Email: [api-support@metaads.com](mailto:api-support@metaads.com)
- 📚 Documentation: [docs.metaads.com](https://docs.metaads.com)
- 🐛 Issues: [GitHub Issues](https://github.com/metaads/dashboard/issues)