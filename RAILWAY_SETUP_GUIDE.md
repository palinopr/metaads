# Railway Setup Guide - Meta Ads Dashboard

## 🚀 Your app is deployed! Now set it up:

### Option 1: Use Environment Variables (Recommended for Railway)

Since the app is running in development mode on Railway, credentials saved in the UI won't persist. Instead:

1. **Go to Railway Dashboard → Your Project → Variables tab**

2. **Add these environment variables:**
   ```
   NEXT_PUBLIC_META_ACCESS_TOKEN=your_meta_token_here
   NEXT_PUBLIC_META_AD_ACCOUNT_ID=act_your_account_id_here
   ```

3. **Railway will automatically restart your app**

4. **Visit your app** at https://metaads-production.up.railway.app

### Option 2: Get Your Meta Credentials

1. **Go to Meta Business Manager**: https://business.facebook.com

2. **Navigate to**: Business Settings → Users → System Users

3. **Create a System User** (if you don't have one)

4. **Generate Access Token** with these permissions:
   - `ads_read`
   - `ads_management`
   - `business_management`
   - `read_insights`

5. **Get your Ad Account ID**:
   - Go to Business Settings → Accounts → Ad Accounts
   - Copy the Account ID (it looks like: 1234567890)
   - Add `act_` prefix: `act_1234567890`

### Settings Now Persist!

The app now supports server-side credential storage:
- Enter credentials through the web interface
- They're stored encrypted on the server
- Persist across deployments and sessions
- No need to use environment variables (unless you want to)

**Note**: The app is now running in production mode for better performance and proper API route handling.

### Testing Your Setup

Once you've added the environment variables:

1. Visit https://metaads-production.up.railway.app
2. You should see your campaigns loading
3. If you see errors, check:
   - Token is valid (not expired)
   - Account ID has `act_` prefix
   - Token has correct permissions

### Common Issues

**"No campaigns found"**
- Make sure you have active campaigns in your Meta account
- Check that the token has the right permissions

**"Invalid token"**
- Token may have expired
- Generate a new token with longer expiration

**"500 errors"**
- Check environment variables are set correctly
- Make sure account ID has `act_` prefix

### Need Help?

1. Check Railway logs for specific errors
2. Verify your Meta token at: https://developers.facebook.com/tools/debug/accesstoken/
3. Make sure your ad account is active and has campaigns