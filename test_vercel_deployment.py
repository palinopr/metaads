#!/usr/bin/env python3
"""
Test the Vercel deployment of Python AI agents
"""
import requests
import json
import time

def test_vercel_deployment():
    """Test the deployed Python endpoint"""
    print("🚀 Testing Vercel Python Deployment\n")
    
    # Wait for deployment to complete
    print("⏳ Waiting 30 seconds for Vercel deployment...")
    time.sleep(30)
    
    # Test URLs
    urls = [
        "https://metaads-peach.vercel.app",
        "https://metaads.vercel.app"
    ]
    
    for base_url in urls:
        print(f"\n📍 Testing {base_url}")
        
        try:
            # Test if site is up
            response = requests.get(base_url, timeout=10)
            print(f"   ✅ Site is up (Status: {response.status_code})")
            
            # Test the API endpoint
            api_url = f"{base_url}/api/campaign/create"
            test_data = {
                "message": "Create a campaign for my fitness app targeting millennials in NYC with $100/day budget",
                "userId": "test_vercel"
            }
            
            print(f"   🔄 Testing API at {api_url}")
            api_response = requests.post(
                api_url,
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if api_response.status_code == 200:
                data = api_response.json()
                print(f"   ✅ API working! Response: {data.get('message', 'Success')}")
                if data.get('campaign'):
                    print(f"   📊 Campaign: {data['campaign'].get('name', 'Unknown')}")
                    print(f"   💰 Budget: {data['campaign'].get('budget', 'Unknown')}")
            else:
                print(f"   ❌ API returned {api_response.status_code}")
                print(f"   Response: {api_response.text[:200]}")
                
        except requests.exceptions.Timeout:
            print(f"   ⏱️  Request timed out")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "="*50)
    print("💡 Next steps:")
    print("1. Check Vercel dashboard for build logs")
    print("2. Set OPENAI_API_KEY in Vercel environment variables")
    print("3. Test with real AI agents enabled")
    print("="*50 + "\n")

if __name__ == "__main__":
    test_vercel_deployment()