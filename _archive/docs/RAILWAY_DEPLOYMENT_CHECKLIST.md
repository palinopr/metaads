# Railway Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables (Set in Railway Dashboard)
```
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096
PORT=3000

# Required
NEXT_PUBLIC_META_ACCESS_TOKEN=your_meta_token
NEXT_PUBLIC_META_AD_ACCOUNT_ID=act_your_account_id

# Optional
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_claude_key
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXT_PUBLIC_ENABLE_WEBSOCKET=false
NEXT_PUBLIC_ENABLE_AI_INSIGHTS=true
NEXT_PUBLIC_ENABLE_PREDICTIONS=true
```

### 2. Railway Settings
- Memory Limit: 4GB
- CPU: 2 vCPU
- Health Check Path: /health
- Port: 3000

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production deployment configuration"
   git push origin main
   ```

2. **Railway will automatically:**
   - Detect the push
   - Build using Dockerfile.production
   - Run health checks
   - Deploy if successful

## Post-Deployment Verification

1. **Check deployment logs** for any errors
2. **Visit the health endpoint**: https://your-app.railway.app/health
3. **Test the main app**: https://your-app.railway.app
4. **Monitor memory usage** in Railway metrics

## Common Issues & Solutions

### Issue: Out of Memory
- Increase NODE_OPTIONS memory limit
- Check Railway memory metrics
- Reduce concurrent operations

### Issue: Build Failures
- Check build logs for specific errors
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Issue: App Not Accessible
- Ensure domain is generated in Railway
- Check PORT environment variable
- Verify health checks are passing

### Issue: Slow Performance
- Check if running in production mode
- Monitor CPU usage
- Enable caching features

## Rollback Procedure

If deployment fails:
1. In Railway, click on previous successful deployment
2. Click "Rollback to this deployment"
3. Investigate issue in failed deployment logs

## Performance Optimization

1. **Enable Caching**
   - Set NEXT_PUBLIC_CACHE_TTL appropriately
   - Use Railway's Redis if needed

2. **Monitor Resources**
   - Watch memory usage graphs
   - Check response times
   - Monitor error rates

3. **Scale if Needed**
   - Increase replicas for high traffic
   - Upgrade memory/CPU limits
   - Consider Railway Pro features

## Security Checklist

- [ ] All sensitive data in environment variables
- [ ] HTTPS enforced (Railway does this automatically)
- [ ] API rate limiting enabled
- [ ] Error messages don't expose sensitive info
- [ ] CORS properly configured

## Success Indicators

- ✅ Health check returns 200 OK
- ✅ No errors in deployment logs
- ✅ Memory usage below 80%
- ✅ Response times under 1 second
- ✅ All pages load without errors