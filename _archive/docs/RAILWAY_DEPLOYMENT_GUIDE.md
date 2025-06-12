# Railway Deployment Guide - Meta Ads Dashboard

## 🚀 Credential Management System

The Meta Ads Dashboard now supports multiple ways to manage credentials, making it suitable for both personal use and multi-user deployments.

### Option 1: Web Interface Credentials (NEW!)

Users can now input their credentials directly through the website interface:

1. **Visit your deployed app** at `https://your-app.up.railway.app`
2. **Click "Settings" or "Connect Meta Account"**
3. **Enter your credentials:**
   - Meta Access Token
   - Ad Account ID (with or without `act_` prefix)
4. **Click "Save & Connect"**

The credentials will be:
- Stored securely on the server (encrypted)
- Associated with your session/IP
- Persist across deployments
- Available immediately without restart

### Option 2: Environment Variables (Admin/Shared Access)

For admin-controlled or shared deployments:

1. **Go to Railway Dashboard → Variables tab**
2. **Add these environment variables:**
   ```
   NEXT_PUBLIC_META_ACCESS_TOKEN=your_meta_token_here
   NEXT_PUBLIC_META_AD_ACCOUNT_ID=act_your_account_id_here
   ENCRYPTION_KEY=your-32-character-encryption-key
   ```
3. **Railway will automatically restart your app**

### How It Works

#### Server-Side Storage
- Credentials entered through the web interface are stored server-side
- Access tokens are encrypted using AES-256 encryption
- Each user gets a unique ID based on their session
- Credentials persist across container restarts

#### Load Priority
1. First checks server storage for user-specific credentials
2. Falls back to environment variables if no user credentials found
3. Falls back to localStorage for local development

#### Security Features
- Encrypted storage for access tokens
- Session-based user isolation
- No credentials in browser localStorage on production
- Automatic cleanup of expired sessions

### Multi-User Support

The app now supports multiple users:
- Each user can save their own credentials
- Credentials are isolated by user session
- No cross-user data access
- Admin can still set default credentials via env vars

### Database Integration (Future)

For production deployments with many users:

1. **Add Railway PostgreSQL:**
   ```bash
   railway add postgresql
   ```

2. **Update environment variables:**
   ```
   DATABASE_URL=${{RAILWAY_DATABASE_URL}}
   ```

3. **The app will automatically:**
   - Use PostgreSQL for credential storage
   - Provide better scalability
   - Support user authentication

### Getting Meta Credentials

1. **Go to Meta Business Manager**: https://business.facebook.com
2. **Navigate to**: Business Settings → Users → System Users
3. **Create a System User** (if needed)
4. **Generate Access Token** with permissions:
   - `ads_read`
   - `ads_management`
   - `business_management`
   - `read_insights`
5. **Get your Ad Account ID:**
   - Go to Business Settings → Accounts → Ad Accounts
   - Copy the Account ID (e.g., 1234567890)
   - The app will add `act_` prefix automatically

### Troubleshooting

**"Invalid credentials" error:**
- Ensure token hasn't expired (regenerate if needed)
- Verify account ID is correct
- Check token has required permissions

**Credentials not persisting:**
- Check if cookies are enabled
- Try clearing browser cache
- Verify ENCRYPTION_KEY is set in Railway

**Can't save credentials:**
- Check browser console for errors
- Ensure the `/api/credentials` endpoint is accessible
- Verify Railway deployment is successful

### Security Best Practices

1. **Set a strong ENCRYPTION_KEY** in Railway environment variables
2. **Use HTTPS only** (Railway provides this automatically)
3. **Rotate access tokens** regularly
4. **Monitor API usage** in Meta Business Manager
5. **Enable 2FA** on your Meta Business account

### API Endpoints

The credential management system exposes these endpoints:

- `POST /api/credentials` - Save credentials
- `GET /api/credentials` - Load credentials
- `DELETE /api/credentials` - Clear credentials

All endpoints use session-based authentication and encryption.