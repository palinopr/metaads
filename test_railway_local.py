#!/usr/bin/env python3
"""
Test Railway setup locally before deploying
"""
import requests
import json
import subprocess
import time
import os

def test_local_railway():
    """Test the Railway setup locally"""
    print("🚀 Testing Railway Setup Locally\n")
    
    # Check dependencies
    print("📦 Checking dependencies...")
    try:
        import flask
        import gunicorn
        import flask_cors
        print("✅ Web server dependencies installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Run: pip install -r railway-requirements.txt")
        return
    
    # Start the server
    print("\n🔄 Starting Flask server...")
    server_process = subprocess.Popen(
        ["python", "app.py"],
        env={**os.environ, "PORT": "5000"}
    )
    
    # Wait for server to start
    time.sleep(3)
    
    try:
        # Test health endpoint
        print("\n📍 Testing health endpoint...")
        response = requests.get("http://localhost:5000/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # Test campaign creation
        print("\n📍 Testing campaign creation...")
        test_data = {
            "message": "Create a campaign for my fitness app targeting millennials with $100/day budget",
            "userId": "test_local"
        }
        
        response = requests.post(
            "http://localhost:5000/api/campaign/create",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('message')}")
            print(f"Campaign: {data.get('campaign', {}).get('name')}")
            print(f"Budget: {data.get('campaign', {}).get('budget')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        # Stop the server
        print("\n🛑 Stopping server...")
        server_process.terminate()
        server_process.wait()
    
    print("\n" + "="*50)
    print("✨ Local testing complete!")
    print("\nNext steps to deploy on Railway:")
    print("1. Push code to GitHub")
    print("2. Connect GitHub repo to Railway")
    print("3. Add environment variables in Railway")
    print("4. Railway will auto-deploy!")
    print("="*50)

if __name__ == "__main__":
    test_local_railway()