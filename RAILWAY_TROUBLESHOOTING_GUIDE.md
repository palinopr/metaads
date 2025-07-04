# Railway Deployment Troubleshooting Guide

## 🔍 Diagnostic Results

Based on the comprehensive diagnostic scan, here are the findings:

### ✅ What's Working
1. **Python Setup**: Version 3.9.6 locally (runtime.txt specifies 3.11)
2. **App Structure**: Flask app properly configured with CORS
3. **Dependencies**: All requirements files present
4. **Procfile**: Correctly configured with gunicorn
5. **Port Configuration**: Properly using environment variable
6. **Host Configuration**: Set to 0.0.0.0 for external access

### ⚠️ Issues Found

#### 1. Runtime.txt Format Issue (CRITICAL)
- **Issue**: The diagnostic reported an invalid format, but the file looks correct
- **Current**: `python-3.11`
- **Solution**: Ensure no extra whitespace or hidden characters

#### 2. No Main Block Warning
- **Issue**: The app.py has `if __name__ == '__main__':` but diagnostic didn't detect it
- **Impact**: None - this is a false positive

#### 3. Mixed Project Type
- **Issue**: Node.js dependencies (node_modules) in Python project
- **Impact**: May increase deployment size unnecessarily

## 🚀 Step-by-Step Deployment Process

### 1. Pre-Deployment Checklist
```bash
# Run validation
python3 railway_deployment_monitor.py validate

# Check all files are committed
git status

# Ensure clean working directory
git add .
git commit -m "Ready for deployment"
```

### 2. Railway CLI Deployment
```bash
# Login to Railway
railway login

# Link to project (if not already linked)
railway link

# Deploy
railway up
```

### 3. Monitor Deployment
```bash
# Watch logs in real-time
railway logs --tail 100

# Or use our monitor
python3 railway_deployment_monitor.py monitor
```

## 🔧 Common Issues & Solutions

### Issue 1: Build Fails
**Symptoms**: Deployment stops during build phase
**Solutions**:
1. Check requirements.txt for typos
2. Ensure all packages are pip-installable
3. Verify Python version compatibility

### Issue 2: App Crashes on Start
**Symptoms**: Build succeeds but app immediately crashes
**Solutions**:
1. Check Procfile syntax
2. Verify app.py imports all exist
3. Check for missing environment variables

### Issue 3: Port Binding Issues
**Symptoms**: "Address already in use" or similar
**Solutions**:
1. Ensure using $PORT environment variable
2. Don't hardcode port numbers
3. Use 0.0.0.0 as host

### Issue 4: Import Errors
**Symptoms**: ModuleNotFoundError in logs
**Solutions**:
1. Add missing package to requirements.txt
2. Check for case-sensitive imports
3. Ensure proper package structure

## 📊 Deployment Verification

After deployment, verify success:

1. **Check Railway Dashboard**
   - Green status indicator
   - No error logs
   - Proper resource usage

2. **Test Endpoints**
   ```bash
   # Health check
   curl https://your-app.railway.app/
   
   # API endpoint
   curl -X POST https://your-app.railway.app/api/campaign/create \
     -H "Content-Type: application/json" \
     -d '{"message": "Create a campaign with $50/day budget"}'
   ```

3. **Monitor Logs**
   ```bash
   railway logs --tail 50
   ```

## 🚨 Emergency Rollback

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # List deployments
   railway deployments
   
   # Rollback to previous
   railway rollback
   ```

2. **Debug Locally**
   ```bash
   # Test with Railway environment
   railway run python app.py
   ```

## 📋 Pre-Deployment Cleanup

1. **Remove Unnecessary Files**
   ```bash
   # Remove node_modules if not needed
   rm -rf node_modules/
   
   # Clean Python cache
   find . -type d -name __pycache__ -exec rm -rf {} +
   find . -type f -name "*.pyc" -delete
   
   # Remove logs
   rm -f *.log
   ```

2. **Update .gitignore**
   ```
   __pycache__/
   *.py[cod]
   *$py.class
   *.so
   .Python
   venv/
   ENV/
   *.log
   .env
   node_modules/
   ```

## 🔄 Continuous Monitoring

Set up monitoring for production:

1. **Health Check Script**
   ```bash
   # Create monitoring script
   while true; do
     curl -s https://your-app.railway.app/api/health
     sleep 60
   done
   ```

2. **Log Aggregation**
   ```bash
   # Save logs periodically
   railway logs > railway_logs_$(date +%Y%m%d).log
   ```

## 📞 Support Resources

1. **Railway Documentation**: https://docs.railway.app
2. **Railway Discord**: https://discord.gg/railway
3. **Status Page**: https://status.railway.app

## 🎯 Next Steps

1. Fix the runtime.txt format issue (if real)
2. Clean up unnecessary files
3. Run deployment with monitoring
4. Verify all endpoints work
5. Set up automated health checks