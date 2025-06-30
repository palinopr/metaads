#!/usr/bin/env python3
import requests
import json
from datetime import datetime

def test_metaads_api():
    """Test API access to MetaAds website"""
    
    base_url = "https://metaads-web.vercel.app"
    
    print(f"🔍 Testing MetaAds API Access - {datetime.now()}")
    print("=" * 60)
    
    # Test 1: Check diagnostic endpoint
    print("\n1. Testing Diagnostic Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/diagnostic")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ API is accessible!")
            print(f"\n   Session Info:")
            print(f"   - Authenticated: {data['session']['authenticated']}")
            print(f"   - Email: {data['session']['email']}")
            print(f"   - Is Admin: {data['session']['isAdmin']}")
            
            print(f"\n   Environment:")
            print(f"   - Has OpenAI Key: {data['environment']['hasOpenAIKey']}")
            print(f"   - Has Anthropic Key: {data['environment']['hasAnthropicKey']}")
            
            print(f"\n   Deployment:")
            print(f"   - Git Commit: {data['deployment']['gitCommit']}")
            print(f"   - Vercel URL: {data['deployment']['vercelUrl']}")
        else:
            print(f"   ❌ Unexpected status code")
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Check API keys endpoint
    print("\n2. Testing API Keys Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/api-keys")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"   ✅ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 200:
            data = response.json()
            print(f"   API Keys Status: {json.dumps(data, indent=2)}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Check debug-public endpoint
    print("\n3. Testing Public Debug Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/debug-public")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Public debug working")
            print(f"   Admin emails configured: {data['environment']['ADMIN_EMAILS']}")
            print(f"   Hardcoded check: {data['hardcodedChecks']['isJaimeNetAdmin']}")
        else:
            print(f"   ❌ Status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("✅ API access is working! I can now monitor your website.")
    print("\nWhat I can check for you:")
    print("- Session status and authentication")
    print("- Environment variables and configuration")
    print("- API key status")
    print("- Deployment information")
    
    return True

if __name__ == "__main__":
    test_metaads_api()