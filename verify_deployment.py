#!/usr/bin/env python3
"""
Railway Deployment Verification Script
======================================
Comprehensive verification of Railway deployment success.
"""

import os
import sys
import time
import json
import requests
import subprocess
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class DeploymentVerifier:
    def __init__(self, app_url: Optional[str] = None):
        self.app_url = app_url
        self.checks_passed = 0
        self.checks_failed = 0
        self.results = []
        
    def run_verification(self):
        """Run all verification checks"""
        print("🔍 Railway Deployment Verification")
        print("=" * 80)
        
        # Get app URL if not provided
        if not self.app_url:
            self.app_url = self.get_railway_url()
            
        if not self.app_url:
            print("❌ Could not determine Railway app URL")
            print("Please provide URL: python verify_deployment.py <your-app-url>")
            return False
            
        print(f"🌐 Testing URL: {self.app_url}")
        print("=" * 80)
        
        # Run all checks
        self.check_basic_connectivity()
        self.check_health_endpoint()
        self.check_api_endpoints()
        self.check_cors_headers()
        self.check_response_times()
        self.check_error_handling()
        
        # Generate report
        self.generate_report()
        
        return self.checks_failed == 0
        
    def get_railway_url(self):
        """Try to get Railway URL from CLI"""
        try:
            result = subprocess.run(
                ['railway', 'open', '--json'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return data.get('url')
        except:
            pass
        return None
        
    def check_basic_connectivity(self):
        """Check basic connectivity to the app"""
        print("\n1️⃣ Checking Basic Connectivity...")
        
        try:
            response = requests.get(self.app_url, timeout=10)
            if response.status_code == 200:
                self.record_success("Basic connectivity", "App is reachable")
                print("  ✅ App is reachable")
                
                # Check response content
                try:
                    data = response.json()
                    if 'status' in data and data['status'] == 'healthy':
                        self.record_success("Health status", "App reports healthy")
                        print("  ✅ App reports healthy status")
                except:
                    self.record_warning("Response format", "Not JSON or missing status")
                    
            else:
                self.record_failure("Basic connectivity", f"Status code: {response.status_code}")
                print(f"  ❌ Unexpected status code: {response.status_code}")
                
        except requests.exceptions.Timeout:
            self.record_failure("Basic connectivity", "Request timed out")
            print("  ❌ Request timed out")
        except requests.exceptions.ConnectionError:
            self.record_failure("Basic connectivity", "Connection failed")
            print("  ❌ Connection failed - app may not be running")
        except Exception as e:
            self.record_failure("Basic connectivity", str(e))
            print(f"  ❌ Error: {e}")
            
    def check_health_endpoint(self):
        """Check health endpoint"""
        print("\n2️⃣ Checking Health Endpoint...")
        
        try:
            response = requests.get(f"{self.app_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ['status', 'timestamp', 'environment']
                for field in expected_fields:
                    if field in data:
                        print(f"  ✅ {field}: {data[field]}")
                    else:
                        self.record_warning("Health endpoint", f"Missing field: {field}")
                        
                self.record_success("Health endpoint", "All checks passed")
                
                # Check environment details
                if 'environment' in data:
                    env = data['environment']
                    print(f"  📊 Python version: {env.get('python_version', 'unknown')}")
                    print(f"  🔑 OpenAI key configured: {env.get('has_openai_key', False)}")
                    print(f"  🌍 Railway region: {env.get('railway_region', 'unknown')}")
                    
            else:
                self.record_failure("Health endpoint", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.record_failure("Health endpoint", str(e))
            print(f"  ❌ Error: {e}")
            
    def check_api_endpoints(self):
        """Check API endpoints"""
        print("\n3️⃣ Checking API Endpoints...")
        
        # Test campaign creation endpoint
        test_payload = {
            "message": "Create a Facebook campaign with $100/day budget for coffee shop",
            "userId": "test_user"
        }
        
        try:
            response = requests.post(
                f"{self.app_url}/api/campaign/create",
                json=test_payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    self.record_success("Campaign API", "Campaign created successfully")
                    print("  ✅ Campaign creation API working")
                    
                    # Check response structure
                    if 'campaign' in data:
                        campaign = data['campaign']
                        print(f"  📋 Campaign ID: {campaign.get('id')}")
                        print(f"  💰 Budget: {campaign.get('budget')}")
                        print(f"  🎯 Platform: {campaign.get('platform')}")
                else:
                    self.record_failure("Campaign API", "API returned success=false")
                    
            else:
                self.record_failure("Campaign API", f"Status code: {response.status_code}")
                print(f"  ❌ Status code: {response.status_code}")
                
        except Exception as e:
            self.record_failure("Campaign API", str(e))
            print(f"  ❌ Error: {e}")
            
    def check_cors_headers(self):
        """Check CORS headers"""
        print("\n4️⃣ Checking CORS Configuration...")
        
        # Test OPTIONS request
        try:
            response = requests.options(
                f"{self.app_url}/api/campaign/create",
                headers={
                    "Origin": "https://metaads.vercel.app",
                    "Access-Control-Request-Method": "POST"
                },
                timeout=10
            )
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            # Check if CORS is properly configured
            if cors_headers['Access-Control-Allow-Origin']:
                self.record_success("CORS", "Headers present")
                print("  ✅ CORS headers configured")
                for header, value in cors_headers.items():
                    if value:
                        print(f"  📋 {header}: {value}")
            else:
                self.record_failure("CORS", "Missing CORS headers")
                print("  ❌ CORS headers missing")
                
        except Exception as e:
            self.record_failure("CORS", str(e))
            print(f"  ❌ Error checking CORS: {e}")
            
    def check_response_times(self):
        """Check response times"""
        print("\n5️⃣ Checking Response Times...")
        
        endpoints = [
            ('/', 'Home'),
            ('/api/health', 'Health'),
            ('/api/campaign/create', 'Campaign API')
        ]
        
        for endpoint, name in endpoints:
            try:
                start = time.time()
                
                if endpoint == '/api/campaign/create':
                    response = requests.post(
                        f"{self.app_url}{endpoint}",
                        json={"message": "test", "userId": "test"},
                        timeout=10
                    )
                else:
                    response = requests.get(f"{self.app_url}{endpoint}", timeout=10)
                    
                elapsed = (time.time() - start) * 1000  # Convert to ms
                
                if elapsed < 500:
                    self.record_success(f"{name} response time", f"{elapsed:.0f}ms")
                    print(f"  ✅ {name}: {elapsed:.0f}ms (Good)")
                elif elapsed < 1000:
                    self.record_warning(f"{name} response time", f"{elapsed:.0f}ms")
                    print(f"  ⚠️  {name}: {elapsed:.0f}ms (Slow)")
                else:
                    self.record_failure(f"{name} response time", f"{elapsed:.0f}ms")
                    print(f"  ❌ {name}: {elapsed:.0f}ms (Too slow)")
                    
            except Exception as e:
                self.record_failure(f"{name} response time", "Failed to measure")
                print(f"  ❌ {name}: Failed to measure")
                
    def check_error_handling(self):
        """Check error handling"""
        print("\n6️⃣ Checking Error Handling...")
        
        # Test with invalid payload
        try:
            response = requests.post(
                f"{self.app_url}/api/campaign/create",
                json={},  # Empty payload
                timeout=10
            )
            
            if response.status_code == 400:
                self.record_success("Error handling", "Properly rejects invalid input")
                print("  ✅ Properly handles invalid input (400)")
            else:
                self.record_warning("Error handling", f"Unexpected status: {response.status_code}")
                print(f"  ⚠️  Unexpected status for invalid input: {response.status_code}")
                
        except Exception as e:
            self.record_failure("Error handling", str(e))
            print(f"  ❌ Error: {e}")
            
        # Test 404 handling
        try:
            response = requests.get(f"{self.app_url}/nonexistent", timeout=10)
            if response.status_code == 404:
                self.record_success("404 handling", "Properly handles missing routes")
                print("  ✅ Properly handles 404")
            else:
                self.record_warning("404 handling", f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.record_failure("404 handling", str(e))
            
    def record_success(self, check: str, details: str):
        """Record successful check"""
        self.checks_passed += 1
        self.results.append(('✅', check, details))
        
    def record_failure(self, check: str, details: str):
        """Record failed check"""
        self.checks_failed += 1
        self.results.append(('❌', check, details))
        
    def record_warning(self, check: str, details: str):
        """Record warning"""
        self.results.append(('⚠️ ', check, details))
        
    def generate_report(self):
        """Generate verification report"""
        print("\n" + "=" * 80)
        print("📊 VERIFICATION REPORT")
        print("=" * 80)
        
        print(f"\n✅ Passed: {self.checks_passed}")
        print(f"❌ Failed: {self.checks_failed}")
        
        if self.checks_failed == 0:
            print("\n🎉 DEPLOYMENT VERIFIED SUCCESSFULLY!")
            print("Your Railway app is running correctly.")
        else:
            print("\n⚠️  DEPLOYMENT HAS ISSUES!")
            print("Please check the failed items above.")
            
        # Save detailed report
        report_data = {
            'url': self.app_url,
            'timestamp': datetime.now().isoformat(),
            'passed': self.checks_passed,
            'failed': self.checks_failed,
            'results': self.results
        }
        
        with open('deployment_verification_report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
            
        print(f"\n📄 Detailed report saved to: deployment_verification_report.json")


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        app_url = sys.argv[1]
        if not app_url.startswith('http'):
            app_url = f"https://{app_url}"
    else:
        app_url = None
        
    verifier = DeploymentVerifier(app_url)
    success = verifier.run_verification()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()