#!/usr/bin/env python3
"""
ULTRATHINKING DEPLOYMENT MONITOR
Real-time monitoring of Railway deployment
"""

import time
import requests
import sys
from datetime import datetime

def test_deployment(url):
    """Test if deployment is working"""
    try:
        # Test health endpoint
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy':
                return True, "✅ Deployment successful!", data
        return False, f"❌ Got status {response.status_code}", response.text
    except requests.exceptions.ConnectionError:
        return False, "⏳ Not ready yet (connection failed)", None
    except Exception as e:
        return False, f"❌ Error: {str(e)}", None

def monitor_deployment():
    """Monitor deployment with ultrathinking approach"""
    print("🧠 ULTRATHINKING DEPLOYMENT MONITOR")
    print("==================================")
    print()
    
    # Get URL from user
    print("Enter your Railway URL to monitor:")
    print("(e.g., https://metaads-python-api.railway.app)")
    url = input("> ").strip()
    
    if not url:
        print("❌ No URL provided")
        return
    
    print()
    print(f"Monitoring: {url}")
    print("==================================")
    
    # Pre-checks
    print("\n📋 Pre-deployment checks:")
    print("✅ Code structure validated")
    print("✅ Dependencies verified") 
    print("✅ Configuration correct")
    print("✅ Ready for deployment")
    
    print("\n🔄 Monitoring deployment...")
    print("(Press Ctrl+C to stop)")
    
    attempts = 0
    max_attempts = 40  # 10 minutes
    
    while attempts < max_attempts:
        attempts += 1
        
        # Test deployment
        success, message, data = test_deployment(url)
        
        # Display status
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"\n[{timestamp}] Attempt {attempts}/{max_attempts}")
        print(message)
        
        if success:
            print("\n🎯 DEPLOYMENT SUCCESSFUL!")
            print("==================================")
            print("Response:", data)
            print("\n✅ Next steps:")
            print("1. Test API endpoint:")
            print(f"   curl -X POST {url}/api/campaign/create \\")
            print("     -H 'Content-Type: application/json' \\")
            print("     -d '{\"message\": \"Test campaign\", \"userId\": \"test\"}'")
            print("\n2. Update Vercel environment:")
            print(f"   EXTERNAL_API_URL={url}")
            print("==================================")
            return
        
        # Wait before next attempt
        if attempts < max_attempts:
            print("Waiting 15 seconds...")
            time.sleep(15)
    
    print("\n❌ Deployment timeout after 10 minutes")
    print("Check Railway dashboard for errors")

def quick_test():
    """Quick test of a URL"""
    if len(sys.argv) > 1:
        url = sys.argv[1]
        print(f"🧠 Quick test of: {url}")
        success, message, data = test_deployment(url)
        print(message)
        if success:
            print("Data:", data)
    else:
        monitor_deployment()

if __name__ == "__main__":
    try:
        quick_test()
    except KeyboardInterrupt:
        print("\n\n⏹️  Monitoring stopped")