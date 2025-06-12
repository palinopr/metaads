# API Documentation

## Meta API Integration

### Endpoints

#### `/api/meta`
Main endpoint for all Meta Ads API operations.

**Request Body**:
```json
{
  "type": "overview|campaign_details",
  "accessToken": "YOUR_META_ACCESS_TOKEN",
  "adAccountId": "act_XXXXXXXXXX",
  "datePreset": "today|yesterday|last_7d|last_30d|last_90d",
  "campaignId": "CAMPAIGN_ID" // Only for campaign_details
}
```

**Response**:
```json
{
  "campaigns": [...],
  "success": true
}
```

#### `/api/credentials`
Store and retrieve user credentials.

**GET**: Retrieve saved credentials
**POST**: Save new credentials
**DELETE**: Clear saved credentials

## Authentication

### Meta Access Token
1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to System Users
3. Generate token with permissions:
   - ads_read
   - ads_management
   - business_management

### Token Extension
Tokens expire after ~60 days. Use the Token Manager (`/settings/token`) to extend.

## Rate Limits
- 60 requests per minute per endpoint
- 10 validation requests per minute
- Automatic retry with exponential backoff

## Error Codes
- `401`: Invalid or expired token
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Server error