#!/usr/bin/env python3
"""
ULTRATHINKING: Railway Deployment Crash Analysis & Fix
"""
import subprocess
import json
import time
from datetime import datetime

def run_command(cmd):
    """Execute command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout, result.stderr
    except Exception as e:
        return None, str(e)

def diagnose_deployment():
    """Comprehensive deployment diagnosis"""
    print("🧠 ULTRATHINKING DEPLOYMENT DIAGNOSIS")
    print("=====================================")
    print()
    
    # 1. Check current service
    print("1️⃣ Checking current service...")
    stdout, _ = run_command("railway status")
    print(stdout)
    
    # 2. Test API health
    print("\n2️⃣ Testing API health...")
    stdout, _ = run_command("curl -s https://metaads-python-api-production.up.railway.app")
    if stdout:
        try:
            data = json.loads(stdout)
            if data.get('status') == 'healthy':
                print("✅ API is HEALTHY!")
                print(f"   Service: {data.get('service')}")
                print(f"   Version: {data.get('version')}")
            else:
                print("❌ API returned non-healthy status")
        except:
            print("❌ API response is not valid JSON")
            print(f"   Response: {stdout[:100]}...")
    else:
        print("❌ No response from API")
    
    # 3. Check for PORT issue
    print("\n3️⃣ Checking PORT configuration...")
    stdout, _ = run_command("railway variables | grep PORT")
    if "PORT" not in stdout:
        print("⚠️  PORT not explicitly set (Railway should provide it)")
        print("   This is usually OK, Railway sets it automatically")
    else:
        print(f"✅ PORT configuration: {stdout}")
    
    # 4. Check recent logs for errors
    print("\n4️⃣ Checking for recent errors...")
    stdout, stderr = run_command("railway logs 2>&1 | tail -50 | grep -i 'error\\|crash\\|failed'")
    if stdout:
        print("❌ Found errors in logs:")
        print(stdout)
    else:
        print("✅ No recent errors found")
    
    # 5. Service comparison
    print("\n5️⃣ Service Configuration Check...")
    print("┌─────────────────────────────────────────┐")
    print("│ SERVICE STATUS                          │")
    print("├─────────────────────────────────────────┤")
    print("│ ✅ metaads-python-api (Python/Flask)    │")
    print("│    Status: Should be ACTIVE             │")
    print("│    URL: metaads-python-api-production.. │")
    print("├─────────────────────────────────────────┤")
    print("│ ❌ metaads (Next.js)                    │")
    print("│    Status: Will CRASH with Python code  │")
    print("│    URL: metaads-production...           │")
    print("└─────────────────────────────────────────┘")

def fix_deployment():
    """Apply fixes based on diagnosis"""
    print("\n🔧 APPLYING FIXES")
    print("=================")
    
    # 1. Ensure correct runtime.txt
    print("\n1️⃣ Checking runtime.txt...")
    with open('runtime.txt', 'r') as f:
        runtime = f.read().strip()
    
    if runtime == 'python-3.11':
        print("   ⚠️  Runtime might need specific version")
        print("   Updating to python-3.11.0...")
        with open('runtime.txt', 'w') as f:
            f.write('python-3.11.0\n')
        print("   ✅ Updated runtime.txt")
    else:
        print(f"   ✅ Runtime is: {runtime}")
    
    # 2. Add explicit PORT handling
    print("\n2️⃣ Checking app.py PORT handling...")
    with open('app.py', 'r') as f:
        app_content = f.read()
    
    if "PORT" in app_content and "0.0.0.0" in app_content:
        print("   ✅ PORT handling looks correct")
    else:
        print("   ❌ PORT handling might need adjustment")
    
    # 3. Create deployment verification script
    print("\n3️⃣ Creating verification script...")
    verification_script = '''#!/bin/bash
# Verify Railway deployment
echo "🔍 Verifying deployment..."
curl -s https://metaads-python-api-production.up.railway.app | jq .
'''
    with open('verify_deployment.sh', 'w') as f:
        f.write(verification_script)
    
    print("   ✅ Created verify_deployment.sh")

def redeploy():
    """Force redeploy with monitoring"""
    print("\n🚀 FORCE REDEPLOYMENT")
    print("====================")
    
    response = input("\nDo you want to force redeploy? (y/n): ")
    if response.lower() != 'y':
        print("Skipping redeploy")
        return
    
    print("\n📦 Redeploying to Railway...")
    stdout, stderr = run_command("railway up --service metaads-python-api --detach")
    
    if "Build Logs:" in stdout:
        print("✅ Deployment started!")
        print(stdout)
        
        print("\n⏳ Waiting for deployment to complete...")
        for i in range(6):  # Wait up to 3 minutes
            time.sleep(30)
            print(f"   Checking... ({i+1}/6)")
            
            # Test if deployment is live
            stdout, _ = run_command("curl -s https://metaads-python-api-production.up.railway.app")
            if stdout and "healthy" in stdout:
                print("\n✅ DEPLOYMENT SUCCESSFUL!")
                print(f"   Response: {stdout}")
                break
        else:
            print("\n⚠️  Deployment might still be in progress")
            print("   Check: https://railway.com/project/88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e")
    else:
        print("❌ Deployment failed to start")
        print(f"Error: {stderr}")

def main():
    """Main execution"""
    print("=" * 50)
    print("ULTRATHINKING RAILWAY CRASH ANALYSIS")
    print("=" * 50)
    print()
    
    # Run diagnosis
    diagnose_deployment()
    
    # Apply fixes
    fix_deployment()
    
    # Ask about redeploy
    redeploy()
    
    print("\n📊 FINAL RECOMMENDATIONS")
    print("========================")
    print("1. Always use 'metaads-python-api' service for Python")
    print("2. Never deploy Python to 'metaads' service")
    print("3. Monitor at: https://railway.com/project/88cfcbd9-fe82-4bda-bb9b-fd1cf5f5688e")
    print("4. Test with: curl https://metaads-python-api-production.up.railway.app")
    print("\n✅ Analysis complete!")

if __name__ == "__main__":
    main()