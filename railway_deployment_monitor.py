#!/usr/bin/env python3
"""
Railway Deployment Monitor
==========================
Real-time monitoring and logging for Railway deployments.
"""

import os
import sys
import time
import json
import subprocess
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

class RailwayDeploymentMonitor:
    def __init__(self, project_token: Optional[str] = None):
        self.project_token = project_token or os.getenv('RAILWAY_TOKEN')
        self.deployment_start = None
        self.logs = []
        self.deployment_id = None
        
    def start_monitoring(self):
        """Start monitoring Railway deployment"""
        print("🚀 Railway Deployment Monitor Started")
        print("=" * 80)
        
        self.deployment_start = datetime.now()
        
        # Check Railway CLI
        if not self.check_railway_cli():
            print("❌ Railway CLI not installed!")
            print("Install with: npm install -g @railway/cli")
            return False
            
        # Get current deployment status
        self.check_current_deployment()
        
        # Monitor deployment
        self.monitor_deployment_progress()
        
        return True
        
    def check_railway_cli(self):
        """Check if Railway CLI is installed"""
        try:
            result = subprocess.run(['railway', '--version'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✓ Railway CLI version: {result.stdout.strip()}")
                return True
        except FileNotFoundError:
            pass
        return False
        
    def check_current_deployment(self):
        """Check current deployment status"""
        print("\n📊 Checking current deployment status...")
        
        try:
            # Check if logged in
            result = subprocess.run(['railway', 'whoami'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✓ Logged in as: {result.stdout.strip()}")
            else:
                print("❌ Not logged in to Railway")
                print("Run: railway login")
                return
                
            # Check current project
            result = subprocess.run(['railway', 'status'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✓ Project status:")
                print(result.stdout)
            else:
                print("⚠️  No active project linked")
                
        except Exception as e:
            print(f"❌ Error checking deployment status: {e}")
            
    def monitor_deployment_progress(self):
        """Monitor deployment progress in real-time"""
        print("\n🔄 Monitoring deployment progress...")
        
        # Create log file
        log_file = Path('railway_deployment.log')
        
        try:
            # Start deployment
            print("\n🚀 Starting deployment...")
            
            with open(log_file, 'w') as f:
                f.write(f"Railway Deployment Log - {datetime.now()}\n")
                f.write("=" * 80 + "\n\n")
                
                # Run deployment command
                process = subprocess.Popen(
                    ['railway', 'up', '--detach'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1
                )
                
                # Monitor output
                while True:
                    output = process.stdout.readline()
                    if output == '' and process.poll() is not None:
                        break
                    if output:
                        print(f"  > {output.strip()}")
                        f.write(f"{datetime.now()}: {output}")
                        f.flush()
                        
                        # Check for deployment ID
                        if 'Deployment ID:' in output:
                            self.deployment_id = output.split('Deployment ID:')[1].strip()
                            
                # Get final status
                rc = process.poll()
                
                if rc == 0:
                    print("\n✅ Deployment command completed successfully!")
                    self.monitor_deployment_logs()
                else:
                    print(f"\n❌ Deployment failed with code: {rc}")
                    
                # Capture any errors
                errors = process.stderr.read()
                if errors:
                    print("\n⚠️  Errors:")
                    print(errors)
                    f.write(f"\nErrors:\n{errors}")
                    
        except KeyboardInterrupt:
            print("\n⚠️  Monitoring interrupted by user")
        except Exception as e:
            print(f"\n❌ Error during deployment: {e}")
            
        print(f"\n📄 Full logs saved to: {log_file}")
        
    def monitor_deployment_logs(self):
        """Monitor deployment logs after deployment starts"""
        print("\n📜 Monitoring deployment logs...")
        
        try:
            # Give deployment time to start
            time.sleep(5)
            
            # Stream logs
            process = subprocess.Popen(
                ['railway', 'logs', '--tail', '100'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            log_count = 0
            while log_count < 50:  # Monitor first 50 log lines
                output = process.stdout.readline()
                if output:
                    print(f"  📝 {output.strip()}")
                    log_count += 1
                    
                    # Check for common issues
                    if 'error' in output.lower():
                        print("  ⚠️  Error detected in logs!")
                    elif 'starting' in output.lower():
                        print("  ✓ Application starting...")
                    elif 'listening' in output.lower() or 'running on' in output.lower():
                        print("  ✅ Application appears to be running!")
                        
                time.sleep(0.5)
                
        except Exception as e:
            print(f"⚠️  Error monitoring logs: {e}")
            
    def generate_deployment_report(self):
        """Generate deployment report"""
        duration = datetime.now() - self.deployment_start if self.deployment_start else "Unknown"
        
        report = {
            'deployment_id': self.deployment_id,
            'start_time': str(self.deployment_start),
            'duration': str(duration),
            'logs': self.logs,
            'timestamp': str(datetime.now())
        }
        
        with open('railway_deployment_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n📊 Deployment report saved to: railway_deployment_report.json")


class DeploymentValidator:
    """Validate deployment readiness"""
    
    @staticmethod
    def validate_all():
        """Run all validation checks"""
        print("\n🔍 Validating deployment readiness...")
        print("=" * 80)
        
        checks = {
            'Files': DeploymentValidator.check_required_files(),
            'Python': DeploymentValidator.check_python_setup(),
            'Dependencies': DeploymentValidator.check_dependencies(),
            'Configuration': DeploymentValidator.check_configuration(),
            'Environment': DeploymentValidator.check_environment()
        }
        
        # Summary
        print("\n📊 Validation Summary:")
        all_passed = True
        for category, passed in checks.items():
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"  {category}: {status}")
            if not passed:
                all_passed = False
                
        return all_passed
        
    @staticmethod
    def check_required_files():
        """Check for required files"""
        print("\n📁 Checking required files...")
        
        required = {
            'app.py': 'Main application file',
            'requirements.txt': 'Python dependencies',
            'Procfile': 'Process configuration',
            'runtime.txt': 'Python version specification'
        }
        
        all_present = True
        for file, desc in required.items():
            if Path(file).exists():
                print(f"  ✓ {file} - {desc}")
            else:
                print(f"  ❌ {file} - {desc} (MISSING)")
                all_present = False
                
        return all_present
        
    @staticmethod
    def check_python_setup():
        """Check Python setup"""
        print("\n🐍 Checking Python setup...")
        
        try:
            # Check Python version
            version = sys.version_info
            print(f"  ✓ Python version: {version.major}.{version.minor}.{version.micro}")
            
            # Check virtual environment
            if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
                print("  ✓ Running in virtual environment")
            else:
                print("  ⚠️  Not running in virtual environment")
                
            return True
        except Exception as e:
            print(f"  ❌ Error checking Python setup: {e}")
            return False
            
    @staticmethod
    def check_dependencies():
        """Check if all dependencies are installed"""
        print("\n📦 Checking dependencies...")
        
        try:
            # Read requirements.txt
            if Path('requirements.txt').exists():
                with open('requirements.txt', 'r') as f:
                    requirements = f.read().strip().split('\n')
                    
                print(f"  ✓ Found {len(requirements)} dependencies")
                
                # Check for common issues
                missing_essential = []
                essential_packages = ['flask', 'fastapi', 'django', 'gunicorn', 'uvicorn']
                
                has_server = False
                for pkg in essential_packages:
                    if any(pkg in req.lower() for req in requirements):
                        has_server = True
                        break
                        
                if not has_server:
                    print("  ⚠️  No web server package found")
                    
                return True
            else:
                print("  ❌ requirements.txt not found")
                return False
                
        except Exception as e:
            print(f"  ❌ Error checking dependencies: {e}")
            return False
            
    @staticmethod
    def check_configuration():
        """Check configuration files"""
        print("\n⚙️  Checking configuration...")
        
        config_ok = True
        
        # Check Procfile
        if Path('Procfile').exists():
            with open('Procfile', 'r') as f:
                content = f.read().strip()
                if 'web:' in content:
                    print("  ✓ Procfile has web process")
                else:
                    print("  ❌ Procfile missing web process")
                    config_ok = False
        else:
            print("  ❌ Procfile not found")
            config_ok = False
            
        # Check runtime.txt
        if Path('runtime.txt').exists():
            with open('runtime.txt', 'r') as f:
                content = f.read().strip()
                print(f"  ✓ Runtime: {content}")
        else:
            print("  ⚠️  runtime.txt not found (using default)")
            
        return config_ok
        
    @staticmethod
    def check_environment():
        """Check environment variables"""
        print("\n🌍 Checking environment...")
        
        # Check for Railway environment
        if os.getenv('RAILWAY_ENVIRONMENT'):
            print(f"  ✓ Railway environment: {os.getenv('RAILWAY_ENVIRONMENT')}")
        else:
            print("  ⚠️  Not running in Railway environment")
            
        # Check for common env vars
        important_vars = ['DATABASE_URL', 'SECRET_KEY', 'API_KEY']
        for var in important_vars:
            if os.getenv(var):
                print(f"  ✓ {var} is set")
                
        return True


def main():
    """Main entry point"""
    print("🚂 Railway Deployment Toolkit")
    print("=" * 80)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'monitor':
            monitor = RailwayDeploymentMonitor()
            monitor.start_monitoring()
        elif command == 'validate':
            if DeploymentValidator.validate_all():
                print("\n✅ Deployment validation PASSED!")
            else:
                print("\n❌ Deployment validation FAILED!")
                sys.exit(1)
        else:
            print(f"Unknown command: {command}")
            print("Usage: python railway_deployment_monitor.py [monitor|validate]")
    else:
        # Run validation by default
        DeploymentValidator.validate_all()


if __name__ == "__main__":
    main()