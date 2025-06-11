# Meta API Integration Troubleshooting

## Overview
The Meta API integration has been updated to fetch campaigns with their ad sets and metrics data. Here's what was changed and how to troubleshoot issues.

## Changes Made

### 1. API Route (`/app/api/meta/route.ts`)
- ✅ Imports MetaAPIClient and AdSetAndAdAPI
- ✅ Creates instances with accessToken and adAccountId
- ✅ Fetches campaigns using `client.getCampaigns(datePreset)`
- ✅ For each campaign, fetches ad sets using `adSetClient.getAdSetsForCampaign(campaign.id, datePreset)`
- ✅ Processes insights data to extract metrics (spend, impressions, clicks, CTR, CPC, conversions, revenue, ROAS, CPA)
- ✅ Adds ad sets to each campaign as `campaign.adsets` and `campaign.adsets_count`
- ✅ Returns response in format: `{ campaigns: [...], success: true }`
- ✅ Added comprehensive logging throughout

### 2. Dashboard Component (`/components/meta-style-dashboard.tsx`)
- ✅ Updated to send `datePreset` instead of `dateFilter` to API
- ✅ Enhanced to preserve `adsets` and `adsets_count` from API response
- ✅ Added fallback to fetch ad sets separately if none found in response
- ✅ Added detailed logging for debugging

### 3. Ad Set API (`/lib/meta-api-adsets.ts`)
- ✅ Updated to accept `datePreset` parameter for consistent date filtering
- ✅ Fixed insights field format to use `.date_preset()` syntax

## Debugging Steps

### 1. Check Browser Console
Look for these log messages:
- "API Response received:" - Shows if campaigns were fetched
- "Processing ad sets from campaigns data..." - Shows ad set processing
- "Campaign X: Y ad sets" - Shows ad sets per campaign

### 2. Check Server Logs
Look for these messages:
- "Creating Meta API clients for overview request..."
- "Found X campaigns, fetching ad sets for each..."
- "Campaign X: found Y ad sets, spend: Z, roas: W"
- "Campaign summary:" - Shows final data being returned

### 3. Common Issues

#### No Ad Sets Showing
1. **Check API Response**: The campaigns might not have any active ad sets
2. **Check Date Range**: Try different date presets (today, yesterday, last_30d)
3. **Check Permissions**: Ensure the access token has permissions to read ad sets

#### No Metrics Data
1. **Check Insights**: The insights data might be empty for the selected date range
2. **Check Campaign Status**: Inactive campaigns might not have recent data
3. **Check Actions**: Conversion tracking might not be set up properly

### 4. Test Script
Use the provided test script to verify the API:
```bash
node test-meta-api.js
```
Remember to update the accessToken and adAccountId in the script.

### 5. Manual API Test
You can test the API directly:
```bash
curl -X POST http://localhost:3000/api/meta \
  -H "Content-Type: application/json" \
  -d '{
    "type": "overview",
    "datePreset": "last_30d",
    "accessToken": "YOUR_TOKEN",
    "adAccountId": "act_YOUR_ID"
  }'
```

## Expected Data Structure
Each campaign should include:
```json
{
  "id": "...",
  "name": "...",
  "status": "...",
  "adsets": [...],
  "adsets_count": 2,
  "spend": 100.50,
  "impressions": 10000,
  "clicks": 150,
  "ctr": 1.5,
  "cpc": 0.67,
  "conversions": 10,
  "revenue": 500,
  "roas": 4.97,
  "cpa": 10.05
}
```

## Next Steps
If campaigns still show "0 ad sets":
1. Verify the campaigns actually have ad sets in Meta Ads Manager
2. Check if the ad sets are within the selected date range
3. Ensure the access token has the required permissions
4. Look for error messages in both browser and server logs