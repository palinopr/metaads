# Meta Access Token Refresh Guide

## ⚠️ Your Token Has Expired

Your Meta access token expired on **Friday, 06-Jun-25 22:00:00 PDT**.

## 🔄 How to Get a New Token

### Option 1: Quick Token (24 hours)
Best for testing - expires in 24 hours

1. Go to [Meta Graph Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Select these permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
5. Click "Generate"
6. Copy the token

### Option 2: Long-Lived Token (60 days)
Better for production - lasts 60 days

1. Get a short-lived token (Option 1)
2. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
3. Paste your token and click "Debug"
4. Click "Extend Access Token"
5. Copy the new long-lived token

### Option 3: System User Token (Never expires)
Best for production - never expires

1. Go to [Meta Business Settings](https://business.facebook.com/settings)
2. Navigate to: Users → System Users
3. Click "Add" → Create a System User
4. Assign Admin role
5. Click "Generate New Token"
6. Select your app and permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
7. Generate and save token

## 📝 Update Your Token

### Method 1: Environment Variable
Update `.env.local`:
```env
NEXT_PUBLIC_META_ACCESS_TOKEN=your_new_token_here
```

### Method 2: Dashboard UI
1. Click the settings icon in the dashboard
2. Paste your new token
3. Click "Update"

## 🔍 Verify Your Token

Test your new token:
```bash
curl -G \
  -d "access_token=YOUR_TOKEN" \
  "https://graph.facebook.com/v18.0/me"
```

Should return your user info if valid.

## 🛡️ Security Tips

1. **Never commit tokens** to git
2. **Use environment variables** for tokens
3. **Rotate tokens** regularly
4. **Use System User tokens** for production
5. **Limit permissions** to what's needed

## 🚨 Common Issues

### "Invalid OAuth access token"
- Token is malformed or expired
- Solution: Generate a new token

### "Insufficient permissions"
- Token lacks required permissions
- Solution: Regenerate with correct permissions

### "Application does not have permission"
- App needs review/approval
- Solution: Submit app for review or use development mode

## 📱 Quick Links

- [Graph Explorer](https://developers.facebook.com/tools/explorer/)
- [Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Business Settings](https://business.facebook.com/settings)
- [App Dashboard](https://developers.facebook.com/apps/)

## 💡 Pro Tip

Set a calendar reminder to refresh your token before it expires:
- Short-lived: Daily
- Long-lived: Every 50 days
- System User: No reminder needed