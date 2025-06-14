# Deployment Guide for Meta Ads Dashboard

## GitHub Deployment ✅
The project has been successfully pushed to GitHub:
- Repository: https://github.com/palinopr/metaads
- Latest commit includes all advanced budget optimization features

## Railway Deployment Instructions

### Prerequisites
1. Railway account: https://railway.app
2. GitHub repository connected to Railway

### Deployment Steps

1. **Connect to Railway**
   - Go to https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `palinopr/metaads` repository

2. **Configure Environment Variables**
   Add these in Railway's Variables section:
   ```
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   NODE_ENV=production
   ```

3. **Deploy Settings**
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Port: Railway will auto-detect (usually 3000)

4. **Domain Setup**
   - Railway provides a default domain
   - Or add custom domain in Settings

### Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Check application logs for errors
- [ ] Test Meta API connection
- [ ] Verify Anthropic API integration
- [ ] Test all new features:
  - [ ] Budget Command Center
  - [ ] Anomaly Detector
  - [ ] Historical Pattern Analyzer

### Monitoring

1. **Application Health**
   - Check `/api/health` endpoint
   - Monitor Railway metrics dashboard

2. **Logs**
   - View logs in Railway dashboard
   - Check for API errors or warnings

3. **Performance**
   - Monitor response times
   - Check memory usage
   - Review API call patterns

### Troubleshooting

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are listed in package.json
- Review build logs for specific errors

**Runtime Errors:**
- Ensure all environment variables are set
- Check API credentials are valid
- Verify Meta API permissions

**Performance Issues:**
- Enable caching where appropriate
- Optimize API calls
- Consider scaling if needed

### Updates and Maintenance

1. **Automatic Deployments**
   - Railway auto-deploys on push to main branch
   - Can be configured in Railway settings

2. **Manual Deployments**
   - Push changes to GitHub
   - Railway will detect and deploy

3. **Rollbacks**
   - Use Railway's deployment history
   - Or revert Git commits and push

## Alternative Deployment Options

### Vercel
```bash
npm i -g vercel
vercel
```

### Self-Hosted
```bash
npm run build
npm run start
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Considerations

1. **API Keys**
   - Never commit API keys to Git
   - Use environment variables
   - Rotate keys regularly

2. **CORS**
   - Configure allowed origins
   - Implement rate limiting

3. **Authentication**
   - Secure Meta OAuth flow
   - Implement session management
   - Add user access controls

## Support

For deployment issues:
- Check Railway documentation: https://docs.railway.app
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
- Contact support for platform-specific issues