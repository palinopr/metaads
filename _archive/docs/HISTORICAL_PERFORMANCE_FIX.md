# Historical Performance Fix

## Issue
The Historical Performance Trends section was showing "Failed to load performance data: Failed to fetch day/week data" due to two issues:

1. **Token Format Issue**: The Meta API was receiving tokens with "Bearer " prefix, which it doesn't accept
2. **API Parameter Issue**: The `time_increment` parameter was using "hourly" instead of the numeric value "1"

## Solutions Implemented

### 1. Token Cleaning
Added token cleaning logic to remove "Bearer " prefix:

```typescript
// Clean the access token to remove Bearer prefix
const cleanToken = accessToken.replace(/^Bearer\s+/i, '')
```

### 2. Fixed time_increment Parameter
Changed from string value to numeric value as required by Meta API:

```typescript
// Before:
`&time_increment=hourly`

// After:
`&time_increment=1` // Use numeric value for hourly data
```

## Meta API Time Increment Values
- `1` = Hourly data
- `all_days` = Daily data (aggregate)
- `monthly` = Monthly data

## Files Updated
- `/app/api/meta/day-week-analysis/route.ts` - Fixed both token cleaning and time_increment parameter

## Expected Result
The Historical Performance Trends section should now:
1. Successfully authenticate with Meta API
2. Fetch hourly performance data
3. Display the day/week heatmap correctly
4. Show performance trends over time

## Testing
1. Navigate to a campaign's comprehensive insights view
2. Click on the "Historical" tab
3. The heatmap should load without errors
4. Performance data should display correctly

## Additional Notes
The Meta API is particular about parameter formats. When using `time_range` with `time_increment`, numeric values must be used instead of string descriptors.