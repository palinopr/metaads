# 🚂 Railway Deployment Quick Reference

## 🚀 Quick Deploy (If Everything is Ready)
```bash
railway login
railway link
railway up
```

## 📋 Pre-Deployment Checklist
```bash
./railway_deployment_checklist.sh
```

## 🔍 Full Diagnostic
```bash
python3 railway_diagnostic.py
```

## 🚀 Complete Deployment Process
```bash
./deploy_to_railway_complete.sh
```

## 📊 Monitor Deployment
```bash
python3 railway_deployment_monitor.py monitor
```

## ✅ Verify After Deployment
```bash
python3 verify_deployment.py <your-app-url>
```

## 🛠️ Common Railway Commands

### Authentication
```bash
railway login       # Login to Railway
railway logout      # Logout
railway whoami      # Check current user
```

### Project Management
```bash
railway link        # Link to a project
railway unlink      # Unlink from project
railway status      # Show project status
railway open        # Open project in browser
```

### Deployment
```bash
railway up          # Deploy current directory
railway up --detach # Deploy without attaching to logs
railway logs        # View deployment logs
railway logs -n 100 # View last 100 log lines
```

### Environment Variables
```bash
railway variables              # List all variables
railway variables set KEY=val  # Set a variable
railway variables delete KEY   # Delete a variable
```

### Debugging
```bash
railway run <command>  # Run command with Railway env
railway shell         # Open shell with Railway env
railway down         # Stop deployment
```

## 🔧 Common Issues & Solutions

### Issue: Build Fails
```bash
# Check requirements.txt syntax
python3 -m pip install -r requirements.txt --dry-run

# Verify Python version
cat runtime.txt  # Should be: python-3.11
```

### Issue: App Crashes
```bash
# Check logs
railway logs --tail 200

# Test locally with Railway environment
railway run python app.py
```

### Issue: Port Binding Error
```python
# In app.py, ensure:
port = int(os.environ.get('PORT', 8080))
app.run(host='0.0.0.0', port=port)
```

### Issue: Module Not Found
```bash
# Add to requirements.txt and redeploy
echo "missing-module==1.0.0" >> requirements.txt
railway up
```

## 📁 Required Files

### Procfile
```
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120
```

### runtime.txt
```
python-3.11
```

### requirements.txt
```
flask==3.0.0
gunicorn==21.2.0
flask-cors==4.0.0
# Add other dependencies
```

### app.py (minimal example)
```python
from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def home():
    return {"status": "healthy"}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

## 🚨 Emergency Commands

### Rollback Deployment
```bash
railway deployments    # List deployments
railway rollback      # Rollback to previous
```

### Force Redeploy
```bash
railway down          # Stop current
railway up --force    # Force new deployment
```

### Check Service Health
```bash
# From local machine
curl https://your-app.railway.app/api/health

# With Railway CLI
railway run curl http://localhost:$PORT/api/health
```

## 📞 Getting Help

1. **Check Logs First**: `railway logs --tail 100`
2. **Run Diagnostic**: `python3 railway_diagnostic.py`
3. **Railway Docs**: https://docs.railway.app
4. **Railway Discord**: https://discord.gg/railway
5. **Status Page**: https://status.railway.app

## 🎯 Deployment Success Criteria

✅ **Deployment is successful when:**
- Railway dashboard shows green status
- App responds to health check
- No errors in logs
- All API endpoints work
- CORS headers are present

❌ **Deployment has failed if:**
- Build fails with errors
- App crashes on startup
- Port binding errors
- Module import errors
- 500 errors on all endpoints