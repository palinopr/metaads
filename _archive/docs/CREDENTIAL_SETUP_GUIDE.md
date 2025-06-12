# Meta Ads Dashboard - Credential Setup Guide

## Prerequisites

Before setting up credentials, ensure you have:
- [ ] Active Meta Business Account
- [ ] Admin access to Meta Business Manager
- [ ] Access to at least one Ad Account
- [ ] Understanding of Meta's API permissions

---

## Step 1: Access Meta Business Settings

1. **Navigate to Meta Business Manager**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Log in with your business account credentials

2. **Access Business Settings**
   - Click on **Business Settings** (gear icon in top right)
   - Or navigate directly to: `https://business.facebook.com/settings/`

3. **Verify Business Account Status**
   - Ensure your business account is verified
   - Check that you have Admin permissions

---

## Step 2: Create System User (Recommended Method)

### 2.1 Navigate to System Users
1. In Business Settings, click **System Users** under **Users** section
2. Click **Add** button to create new system user

### 2.2 Configure System User
1. **System User Name**: `Meta Ads Dashboard`
2. **System User Role**: `Admin` (required for full access)
3. Click **Create System User**

### 2.3 Generate Access Token
1. Select the newly created system user
2. Click **Generate New Token**
3. **App**: Select your Meta App (or create one)
4. **Token Expiration**: Select **Never** (recommended for production)
5. **Permissions Required**:
   ```
   ✓ ads_management
   ✓ ads_read  
   ✓ business_management
   ✓ pages_read_engagement
   ✓ pages_show_list
   ```

### 2.4 Copy and Save Token
1. **Copy the access token immediately** (it won't be shown again)
2. Token format should look like: `EAAxxxxxxxxxxxxxxxxx...` (180+ characters)
3. Save in secure location (password manager recommended)

---

## Step 3: Get Ad Account ID

### 3.1 Navigate to Ad Accounts
1. In Business Settings, click **Ad Accounts** under **Accounts** section
2. Locate your target ad account

### 3.2 Copy Account ID
1. **Account ID Format**: `act_1234567890`
2. **Full ID**: Click on the account to see full details
3. **Alternative**: Use the account number with `act_` prefix

### 3.3 Verify Account Access
1. Ensure the system user has access to this ad account
2. If not, click **Add People** and assign the system user

---

## Step 4: Alternative Method - App Token

### 4.1 Create Meta App (if needed)
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. **App Type**: Business
4. **App Details**:
   - App Name: `Meta Ads Dashboard`
   - App Contact Email: `your-email@domain.com`

### 4.2 Configure App Permissions
1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   ```
   ✓ ads_management
   ✓ ads_read
   ✓ business_management
   ```

### 4.3 Generate App Access Token
1. Go to **Tools** → **Graph API Explorer**
2. Select your app
3. Select required permissions
4. Click **Generate Access Token**
5. **Extend Token**: Use Token Debugger to extend to long-lived token

---

## Step 5: Configure Dashboard

### 5.1 Environment Variables Method
Create `.env.local` file in project root:
```bash
# Meta API Credentials
NEXT_PUBLIC_META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxx...
NEXT_PUBLIC_META_AD_ACCOUNT_ID=act_1234567890

# Optional: API Configuration
NEXT_PUBLIC_API_RATE_LIMIT=30
NEXT_PUBLIC_CACHE_TTL=600000
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### 5.2 Dashboard Settings Method
1. Start the dashboard: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click **Settings** icon (gear icon)
4. Enter credentials:
   - **Access Token**: Paste your token
   - **Ad Account ID**: Enter `act_XXXXXXXXXX` format
5. Click **Save Settings**

---

## Step 6: Validation and Testing

### 6.1 Test Token Validity
```bash
# Test basic token
curl -G -d "access_token=YOUR_TOKEN" \
  "https://graph.facebook.com/v18.0/me"

# Test ad account access
curl -G -d "access_token=YOUR_TOKEN" \
  "https://graph.facebook.com/v18.0/act_YOUR_ACCOUNT_ID"
```

### 6.2 Test Dashboard Connection
1. Open dashboard at `http://localhost:3000`
2. Check for campaign data loading
3. Verify no authentication errors in console
4. Test different date ranges

### 6.3 Run Integration Test
```bash
# Use provided test script
node test-meta-api.js

# Or test API endpoint directly
curl -X POST http://localhost:3000/api/meta \
  -H "Content-Type: application/json" \
  -d '{"type": "overview", "datePreset": "last_7d"}'
```

---

## Common Setup Issues and Solutions

### Issue 1: "Invalid OAuth Access Token"
**Symptoms**: Dashboard shows authentication error
**Causes**:
- Token expired or malformed
- Incorrect token format
- Token lacks required permissions

**Solutions**:
1. **Regenerate Token**: Create new token with proper permissions
2. **Check Format**: Ensure token starts with 'EAA' and is 180+ characters
3. **Verify Permissions**: Ensure all required permissions are granted
4. **Clear Cache**: Remove stored credentials and re-enter

### Issue 2: "Ad Account Not Accessible"
**Symptoms**: "No campaigns found" despite having active campaigns
**Causes**:
- System user doesn't have access to ad account
- Incorrect account ID format
- Account ID doesn't match token permissions

**Solutions**:
1. **Check Account Access**: In Business Settings, verify system user has access
2. **Verify Format**: Ensure account ID is `act_XXXXXXXXXX`
3. **Test Direct API**: Use curl to test account access

### Issue 3: "Insufficient Permissions"
**Symptoms**: Some data missing or API errors
**Causes**:
- Token missing required permissions
- App not approved for certain permissions
- Business verification required

**Solutions**:
1. **Review Permissions**: Check system user token permissions
2. **App Review**: Submit app for additional permissions if needed
3. **Business Verification**: Complete business verification process

### Issue 4: "Token Expires Too Quickly"
**Symptoms**: Need to re-authenticate frequently
**Causes**:
- Using short-lived token instead of long-lived
- App token instead of system user token

**Solutions**:
1. **Use System User**: Create system user with "Never" expiration
2. **Extend Token**: Use Graph API Explorer to extend token lifetime
3. **Auto-Refresh**: Implement token refresh mechanism (advanced)

---

## Security Best Practices

### 1. Token Storage
- **Never commit tokens to version control**
- **Use environment variables** for production
- **Store in secure password manager**
- **Rotate tokens regularly** (every 60 days recommended)

### 2. Access Control
- **Principle of least privilege**: Only grant necessary permissions
- **Separate tokens per environment** (dev, staging, production)
- **Monitor token usage** in Meta Business Settings

### 3. Network Security
- **Use HTTPS only** in production
- **Implement rate limiting**
- **Log authentication attempts**
- **Set up monitoring alerts**

---

## Advanced Configuration

### Custom App Setup
If you need custom app configuration:

1. **Webhook Configuration**:
   ```javascript
   // For real-time updates
   const webhookConfig = {
     object: 'adaccount',
     callback_url: 'https://yourdomain.com/webhook',
     fields: ['campaign_id', 'adset_id', 'status']
   }
   ```

2. **Rate Limiting Configuration**:
   ```javascript
   // Adjust based on your usage
   const rateLimits = {
     maxRequestsPerHour: 200,
     burstLimit: 50,
     windowMs: 3600000
   }
   ```

3. **Caching Strategy**:
   ```javascript
   // Configure cache TTL based on data freshness needs
   const cacheTTL = {
     campaigns: 300000,    // 5 minutes
     insights: 600000,     // 10 minutes  
     demographics: 1800000 // 30 minutes
   }
   ```

---

## Troubleshooting Checklist

When credential setup fails:

- [ ] Token format is correct (starts with 'EAA')
- [ ] Token has all required permissions
- [ ] Ad Account ID includes 'act_' prefix
- [ ] System user has access to ad account
- [ ] Business account is verified
- [ ] App is approved for required permissions
- [ ] Token is not expired
- [ ] Network connectivity to graph.facebook.com
- [ ] No firewall blocking API requests
- [ ] Dashboard can write to localStorage

---

## Support and Resources

### Official Documentation
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-api/)
- [Business Manager Help](https://www.facebook.com/business/help/)
- [System Users Guide](https://developers.facebook.com/docs/marketing-api/system-users/)

### Testing Tools  
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Business Settings](https://business.facebook.com/settings/)

### Internal Tools
```bash
# Test credentials
node test-meta-api.js

# Debug API connection  
npm run api-debug

# Check system health
npm run test:health
```

Remember: **Always test credentials in a development environment first** before using in production!