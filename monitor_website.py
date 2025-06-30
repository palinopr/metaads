#!/usr/bin/env python3
import requests
import json
from datetime import datetime
import time

class MetaAdsMonitor:
    def __init__(self):
        self.base_url = "https://metaads-web.vercel.app"
        
    def check_api_keys_saved(self):
        """Check if API keys have been saved"""
        print("\n🔑 Checking API Key Status...")
        
        try:
            # Check diagnostic endpoint
            response = requests.get(f"{self.base_url}/api/admin/diagnostic")
            if response.status_code == 200:
                data = response.json()
                
                openai_configured = data['environment']['hasOpenAIKey']
                anthropic_configured = data['environment']['hasAnthropicKey']
                
                print(f"   OpenAI API Key: {'✅ Configured' if openai_configured else '❌ Not configured'}")
                print(f"   Anthropic API Key: {'✅ Configured' if anthropic_configured else '❌ Not configured'}")
                
                if not openai_configured or not anthropic_configured:
                    print("\n   📝 To add API keys:")
                    print("   1. Go to Admin Panel > Agent Settings")
                    print("   2. Click on the 'API Keys' tab")
                    print("   3. Enter your keys and click Save")
                    
                return openai_configured, anthropic_configured
            else:
                print(f"   ❌ Could not check status: {response.status_code}")
                return False, False
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False, False
    
    def check_deployment_status(self):
        """Check current deployment information"""
        print("\n🚀 Deployment Status...")
        
        try:
            response = requests.get(f"{self.base_url}/api/debug-public")
            if response.status_code == 200:
                data = response.json()
                
                print(f"   Timestamp: {data['timestamp']}")
                print(f"   Admin emails: {data['environment']['ADMIN_EMAILS']}")
                
                # Check if latest features are deployed
                if 'directChecks' in data:
                    print(f"   ✅ Latest code is deployed")
                else:
                    print(f"   ⚠️  May need to update deployment")
                    
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    def monitor_live(self, interval=30):
        """Monitor the website continuously"""
        print(f"\n🔄 Starting live monitoring (checking every {interval} seconds)...")
        print("Press Ctrl+C to stop\n")
        
        try:
            while True:
                print(f"\n{'='*60}")
                print(f"Check at {datetime.now().strftime('%H:%M:%S')}")
                
                self.check_api_keys_saved()
                self.check_deployment_status()
                
                print(f"\nNext check in {interval} seconds...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n\n✋ Monitoring stopped")
    
    def quick_status(self):
        """Get a quick status summary"""
        print(f"\n📊 MetaAds Quick Status - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        openai, anthropic = self.check_api_keys_saved()
        self.check_deployment_status()
        
        print("\n📈 Summary:")
        if openai and anthropic:
            print("   ✅ All API keys configured - AI agents ready to use!")
        elif openai or anthropic:
            print("   ⚠️  Some API keys missing - please configure all keys")
        else:
            print("   ❌ No API keys configured - AI agents won't work")
        
        print("\n💡 Tips:")
        print("   - Hard refresh if you don't see changes: Cmd+Shift+R")
        print("   - API keys are saved per deployment session")
        print("   - For permanent storage, use Vercel environment variables")

def main():
    monitor = MetaAdsMonitor()
    
    print("🤖 MetaAds Website Monitor")
    print("Choose an option:")
    print("1. Quick status check")
    print("2. Live monitoring")
    print("3. Check API keys only")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        monitor.quick_status()
    elif choice == "2":
        interval = input("Check interval in seconds (default 30): ").strip()
        interval = int(interval) if interval.isdigit() else 30
        monitor.monitor_live(interval)
    elif choice == "3":
        monitor.check_api_keys_saved()
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()