# Troubleshooting Guide

## Common Issues

### Token Expired
**Problem**: "Invalid OAuth access token" error

**Solution**: 
1. Click "Token Manager" button in dashboard header
2. Follow instructions to extend token
3. Or visit `/settings/token` directly

### Dashboard Not Loading
**Problem**: Stuck at "Validating credentials..."

**Solution**:
1. Clear browser cache and cookies
2. Visit `/dashboard` directly
3. Re-enter credentials if needed

### No Data Showing
**Problem**: Campaigns show $0 or no metrics

**Solution**:
1. Check date range selector (top right)
2. Ensure token has proper permissions (ads_read, ads_management)
3. Verify ad account ID is correct

### Build Errors
**Problem**: Application won't build

**Solution**:
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### API Rate Limits
**Problem**: "Too many requests" errors

**Solution**:
- Wait 1 minute before retrying
- Enable auto-refresh with longer intervals
- Check if token is being validated too frequently

## Getting Help

1. Check error messages for specific guidance
2. Look for action buttons in error alerts
3. Visit `/help/extend-token` for token issues
4. Check browser console for detailed errors