#!/usr/bin/env python3
import requests
import json
from datetime import datetime

def check_metaads_site():
    """Check the MetaAds website and diagnose issues"""
    
    base_url = "https://metaads-web.vercel.app"
    
    print(f"🔍 Checking MetaAds Website at {datetime.now()}")
    print("=" * 50)
    
    # Check diagnostic endpoint
    try:
        print("\n1. Checking diagnostic endpoint...")
        response = requests.get(f"{base_url}/api/admin/diagnostic")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Diagnostic endpoint working")
            print(f"   - Session authenticated: {data['session']['authenticated']}")
            print(f"   - User email: {data['session']['email']}")
            print(f"   - Is admin: {data['session']['isAdmin']}")
            print(f"   - OpenAI key configured: {data['environment']['hasOpenAIKey']}")
            print(f"   - Anthropic key configured: {data['environment']['hasAnthropicKey']}")
            print(f"   - Git commit: {data['deployment']['gitCommit']}")
        else:
            print(f"❌ Diagnostic endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking diagnostic: {e}")
    
    # Check the actual deployment
    print("\n2. Checking latest deployment...")
    try:
        # Get the actual page content (this won't work due to auth, but we can try)
        response = requests.get(f"{base_url}/dashboard/admin/agent-settings")
        print(f"   - Agent settings page status: {response.status_code}")
        
        # Check if the API keys route exists
        response = requests.get(f"{base_url}/api/admin/api-keys")
        print(f"   - API keys endpoint status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking pages: {e}")
    
    print("\n3. What you should see:")
    print("   - 4 tabs: General, Model Settings, Tools, API Keys")
    print("   - The API Keys tab should be the 4th tab")
    print("   - In the API Keys tab, you should see:")
    print("     • OpenAI API Key input field")
    print("     • Anthropic API Key input field")
    print("     • Save buttons for each")
    print("     • Current status display")
    
    print("\n4. Troubleshooting steps:")
    print("   a) Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)")
    print("   b) Clear browser cache completely")
    print("   c) Try incognito/private browsing mode")
    print("   d) Check browser console for errors (F12)")

if __name__ == "__main__":
    check_metaads_site()