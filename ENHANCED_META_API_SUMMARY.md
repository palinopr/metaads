# Enhanced Meta API Route - Summary of Changes

## Overview
The Meta API route (`/Users/jaimeortiz/metaads/app/api/meta/route.ts`) has been significantly enhanced to support comprehensive metrics requests while maintaining full backward compatibility with existing functionality.

## New Features Added

### 1. Enhanced Request Types
Added support for 5 new request types:

- **`demographics`**: Returns age, gender, region, and device platform breakdowns
- **`hourly_analysis`**: Returns hour-by-hour performance with day-of-week context  
- **`device_breakdown`**: Returns device platform performance breakdown
- **`placement_analysis`**: Returns publisher platform and position breakdown
- **`comprehensive_metrics`**: Returns all breakdowns in a single optimized request

### 2. Enhanced Parameters
Extended the validation schema to support:

- **`breakdown`**: Specify custom breakdown field(s) (e.g., "age", "gender", "age,gender")
- **`fields`**: Specify custom fields to fetch from Meta API
- **`timeIncrement`**: Specify time increment for insights (e.g., "1", "hourly")
- **`campaignId`**: Required for new breakdown endpoints

### 3. New Helper Functions

#### `extractMetricsFromInsight(insight: any)`
- Extracts standardized metrics from Meta API insight objects
- Handles spend, conversions, revenue, impressions, clicks, CTR, CPC, reach, frequency
- Processes actions and action_values for purchase events

#### `processBreakdownData(apiData: any[], breakdownType: string)`
- Aggregates breakdown data by specified breakdown type
- Calculates derived metrics (ROAS, CTR, CPC, CPA)
- Sorts results by spend (highest first)

#### `fetchBreakdownInsights(campaignId, accessToken, breakdown, datePreset, fields?)`
- Unified function to fetch breakdown insights from Meta API
- Handles error cases and timeouts
- Supports custom fields and date presets

## API Endpoints Usage

### Demographics Breakdown
```javascript
POST /api/meta
{
  "type": "demographics",
  "campaignId": "123456789",
  "accessToken": "your_token",
  "datePreset": "last_30d"
}

// Returns:
{
  "success": true,
  "demographics": {
    "age": [...],      // Age group performance
    "gender": [...],   // Gender performance  
    "region": [...],   // Geographic performance
    "device_platform": [...] // Device performance
  }
}
```

### Hourly Analysis
```javascript
POST /api/meta
{
  "type": "hourly_analysis", 
  "campaignId": "123456789",
  "accessToken": "your_token",
  "datePreset": "last_7d"
}

// Returns:
{
  "success": true,
  "hourlyData": [
    {
      "date": "2024-06-10",
      "dayOfWeek": 1,
      "hour": 14,
      "spend": 125.50,
      "revenue": 250.75,
      "roas": 2.0,
      // ... other metrics
    }
  ]
}
```

### Device Breakdown
```javascript
POST /api/meta
{
  "type": "device_breakdown",
  "campaignId": "123456789", 
  "accessToken": "your_token",
  "datePreset": "last_30d"
}

// Returns:
{
  "success": true,
  "devices": [
    {
      "device_platform": "mobile",
      "spend": 1500.00,
      "revenue": 3000.00,
      "roas": 2.0,
      // ... other metrics
    }
  ]
}
```

### Placement Analysis
```javascript
POST /api/meta
{
  "type": "placement_analysis",
  "campaignId": "123456789",
  "accessToken": "your_token",
  "datePreset": "last_30d"
}

// Returns:
{
  "success": true,
  "placements": [
    {
      "publisher_platform": "facebook",
      "platform_position": "feed",
      "placement": "facebook - feed",
      "spend": 800.00,
      "revenue": 1600.00,
      "roas": 2.0,
      // ... other metrics
    }
  ]
}
```

### Comprehensive Metrics
```javascript
POST /api/meta
{
  "type": "comprehensive_metrics",
  "campaignId": "123456789",
  "accessToken": "your_token", 
  "datePreset": "last_30d",
  "fields": "spend,impressions,clicks,actions,action_values"
}

// Returns:
{
  "success": true,
  "comprehensive": {
    "demographics": { age: [...], gender: [...], region: [...] },
    "hourlyData": [...],
    "devices": [...], 
    "placements": [...],
    "datePreset": "last_30d",
    "generatedAt": "2024-06-12T10:30:00.000Z"
  }
}
```

## Backward Compatibility

### Existing Endpoints Preserved
All existing request types continue to work unchanged:
- `test_connection`
- `campaign_details`
- `insights` 
- `adsets`
- `ads`
- `overview`

### Enhanced Legacy Support
The original endpoint-based requests now support enhanced parameters:
- `breakdown`: Added to URL params for custom breakdowns
- `fields`: Override default fields
- `timeIncrement`: Add time increment parameter

### Custom Breakdown Support
Enhanced the `insights` type to support custom breakdowns:

```javascript
POST /api/meta
{
  "type": "insights",
  "campaignId": "123456789",
  "accessToken": "your_token",
  "breakdown": "age,gender",
  "fields": "spend,impressions,clicks",
  "datePreset": "last_30d"
}
```

## Error Handling

### Enhanced Error Responses
- Detailed error messages for each breakdown type
- Graceful handling of API rate limits
- Timeout protection (15 seconds per request)
- Validation of required parameters

### Partial Failure Support
- Individual breakdown failures don't crash entire requests
- Empty arrays returned for failed breakdowns with warning logs
- Comprehensive metrics continues with available data

## Performance Optimizations

### Parallel Processing
- Multiple breakdown requests processed simultaneously
- Comprehensive metrics fetches all data in parallel
- Reduced total request time

### Request Optimization
- Increased limits (1000-5000 per request)
- Efficient field selection
- Proper timeout handling

## Testing

A comprehensive test suite is provided in `test-enhanced-meta-api.js` with examples for all new endpoint types.

## Security Considerations

### Input Validation
- Extended Zod schema validation for new parameters
- Proper token cleaning (Bearer prefix removal)
- Campaign ID format validation

### Rate Limiting
- Existing rate limiting preserved
- Debug logging enhanced for new parameters
- Proper error handling for API limits

## Migration Guide

### For Existing Code
No changes required - all existing code continues to work unchanged.

### For New Features
Use the new request types and parameters as documented above.

### Enhanced Fields
Existing requests can now use enhanced parameters:
```javascript
// Before
{ "type": "insights", "endpoint": "campaign/insights", "params": {...} }

// After (enhanced, but backward compatible)
{ "type": "insights", "campaignId": "123", "breakdown": "age", "fields": "spend,clicks" }
```

## File Structure
```
app/api/meta/
├── route.ts                    # Main enhanced route (updated)
├── demographics/route.ts       # Existing specialized route
├── day-hour-insights/route.ts  # Existing specialized route  
└── day-week-analysis/route.ts  # Existing specialized route
```

The main `route.ts` now provides comprehensive functionality that can replace specialized routes while maintaining them for backward compatibility.