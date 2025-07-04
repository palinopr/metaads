#!/usr/bin/env python3
"""
ULTRATHINK VERIFY AND FIX
=========================
Comprehensive deployment verification and automatic fixing.
"""

import os
import sys
import json
import subprocess
import time
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class DeploymentVerifier:
    """Verify deployment and fix issues automatically"""
    
    def __init__(self):
        self.issues_found = []
        self.fixes_applied = []
        self.deployment_info = self._load_deployment_info()
        
    def _load_deployment_info(self) -> Dict:
        """Load deployment information from various sources"""
        info = {}
        
        # Try different info files
        info_files = [
            "deployment_state.json",
            "deployment_report.json", 
            "last_deployment.json",
            "github_deploy_info.json"
        ]
        
        for file in info_files:
            if Path(file).exists():
                try:
                    with open(file) as f:
                        data = json.load(f)
                        info.update(data)
                except:
                    pass
                    
        # Check for URL file
        if Path("deployment_url.txt").exists():
            with open("deployment_url.txt") as f:
                info["deployment_url"] = f.read().strip()
                
        return info
        
    def verify_all(self) -> Dict:
        """Run all verifications"""
        print("=" * 60)
        print("ULTRATHINK DEPLOYMENT VERIFICATION")
        print("=" * 60)
        print()
        
        checks = [
            ("Project Structure", self._verify_project_structure),
            ("Configuration Files", self._verify_configuration),
            ("Dependencies", self._verify_dependencies),
            ("Railway Setup", self._verify_railway_setup),
            ("Deployment Status", self._verify_deployment_status),
            ("Application Health", self._verify_app_health),
            ("Environment Variables", self._verify_env_vars)
        ]
        
        results = {}
        for check_name, check_func in checks:
            print(f"Checking {check_name}... ", end="", flush=True)
            result = check_func()
            results[check_name] = result
            
            if result["status"] == "pass":
                print("✅ PASS")
            elif result["status"] == "warning":
                print("⚠️  WARNING")
                self.issues_found.append((check_name, result))
            else:
                print("❌ FAIL")
                self.issues_found.append((check_name, result))
                
            if result.get("fix_applied"):
                self.fixes_applied.append(result["fix_applied"])
                
        print()
        return results
        
    def _verify_project_structure(self) -> Dict:
        """Verify project has correct structure"""
        required_files = {
            "app.py": self._create_default_app,
            "requirements.txt": self._create_default_requirements,
            "Procfile": self._create_default_procfile,
            "runtime.txt": self._create_default_runtime
        }
        
        missing = []
        for file, create_func in required_files.items():
            if not Path(file).exists():
                missing.append(file)
                # Auto-fix
                create_func()
                self.fixes_applied.append(f"Created {file}")
                
        if missing:
            return {
                "status": "warning",
                "message": f"Missing files auto-created: {', '.join(missing)}",
                "fix_applied": f"Created {len(missing)} files"
            }
        return {"status": "pass"}
        
    def _verify_configuration(self) -> Dict:
        """Verify configuration files are correct"""
        issues = []
        
        # Check Procfile
        if Path("Procfile").exists():
            with open("Procfile") as f:
                content = f.read().strip()
                if not content.startswith("web:"):
                    issues.append("Procfile doesn't define web process")
                    # Fix it
                    with open("Procfile", "w") as f:
                        f.write("web: gunicorn app:app --bind 0.0.0.0:$PORT\n")
                    self.fixes_applied.append("Fixed Procfile")
                    
        # Check runtime.txt
        if Path("runtime.txt").exists():
            with open("runtime.txt") as f:
                content = f.read().strip()
                if not content.startswith("python-"):
                    issues.append("Invalid runtime.txt")
                    # Fix it
                    with open("runtime.txt", "w") as f:
                        f.write("python-3.11.0\n")
                    self.fixes_applied.append("Fixed runtime.txt")
                    
        if issues:
            return {
                "status": "warning",
                "message": f"Fixed issues: {'; '.join(issues)}",
                "fix_applied": True
            }
        return {"status": "pass"}
        
    def _verify_dependencies(self) -> Dict:
        """Verify dependencies are properly specified"""
        if not Path("requirements.txt").exists():
            if Path("railway-requirements.txt").exists():
                # Copy railway requirements
                import shutil
                shutil.copy("railway-requirements.txt", "requirements.txt")
                return {
                    "status": "warning",
                    "message": "Copied railway-requirements.txt to requirements.txt",
                    "fix_applied": "Created requirements.txt"
                }
            else:
                self._create_default_requirements()
                return {
                    "status": "warning", 
                    "message": "Created default requirements.txt",
                    "fix_applied": "Created requirements.txt"
                }
        return {"status": "pass"}
        
    def _verify_railway_setup(self) -> Dict:
        """Verify Railway CLI and setup"""
        if not self._command_exists("railway"):
            return {
                "status": "warning",
                "message": "Railway CLI not installed",
                "fix": "npm install -g @railway/cli"
            }
            
        # Check authentication
        try:
            result = subprocess.run(
                ["railway", "whoami"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                return {
                    "status": "warning",
                    "message": "Not authenticated with Railway",
                    "fix": "railway login"
                }
        except:
            return {"status": "warning", "message": "Cannot check Railway status"}
            
        return {"status": "pass"}
        
    def _verify_deployment_status(self) -> Dict:
        """Verify deployment status"""
        if self.deployment_info.get("success"):
            return {"status": "pass", "message": "Deployment successful"}
        elif self.deployment_info.get("deployment_url"):
            return {"status": "pass", "message": "Deployment URL found"}
        else:
            return {
                "status": "warning",
                "message": "No successful deployment recorded",
                "fix": "Run deployment script"
            }
            
    def _verify_app_health(self) -> Dict:
        """Verify application is healthy"""
        url = self.deployment_info.get("deployment_url")
        if not url:
            return {"status": "warning", "message": "No deployment URL to check"}
            
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return {"status": "pass", "message": f"App responding at {url}"}
            else:
                return {
                    "status": "warning",
                    "message": f"App returned status {response.status_code}",
                    "fix": "Check application logs"
                }
        except requests.RequestException as e:
            return {
                "status": "fail",
                "message": f"Cannot reach app: {str(e)}",
                "fix": "Check if deployment is complete"
            }
            
    def _verify_env_vars(self) -> Dict:
        """Verify environment variables"""
        required_vars = ["OPENAI_API_KEY"]
        missing_local = [v for v in required_vars if not os.environ.get(v)]
        
        if missing_local:
            return {
                "status": "warning",
                "message": f"Missing local env vars: {', '.join(missing_local)}",
                "fix": "Set in Railway dashboard or .env file"
            }
        return {"status": "pass"}
        
    def _command_exists(self, command: str) -> bool:
        """Check if command exists"""
        import shutil
        return shutil.which(command) is not None
        
    def _create_default_app(self):
        """Create default app.py"""
        content = '''from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "status": "healthy",
        "message": "MetaAds deployment successful!",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
'''
        with open("app.py", "w") as f:
            f.write(content)
            
    def _create_default_requirements(self):
        """Create default requirements.txt"""
        content = """flask==3.0.0
gunicorn==21.2.0
flask-cors==4.0.0
"""
        with open("requirements.txt", "w") as f:
            f.write(content)
            
    def _create_default_procfile(self):
        """Create default Procfile"""
        with open("Procfile", "w") as f:
            f.write("web: gunicorn app:app --bind 0.0.0.0:$PORT\n")
            
    def _create_default_runtime(self):
        """Create default runtime.txt"""
        with open("runtime.txt", "w") as f:
            f.write("python-3.11.0\n")
            
    def generate_report(self, results: Dict):
        """Generate verification report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_checks": len(results),
            "passed": sum(1 for r in results.values() if r["status"] == "pass"),
            "warnings": sum(1 for r in results.values() if r["status"] == "warning"),
            "failed": sum(1 for r in results.values() if r["status"] == "fail"),
            "fixes_applied": self.fixes_applied,
            "issues": self.issues_found,
            "results": results
        }
        
        # Save report
        with open("verification_report.json", "w") as f:
            json.dump(report, f, indent=2)
            
        # Print summary
        print("=" * 60)
        print("VERIFICATION SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {report['passed']}")
        print(f"⚠️  Warnings: {report['warnings']}")
        print(f"❌ Failed: {report['failed']}")
        print(f"🔧 Fixes Applied: {len(self.fixes_applied)}")
        print()
        
        if self.fixes_applied:
            print("Fixes Applied:")
            for fix in self.fixes_applied:
                print(f"  - {fix}")
            print()
            
        if report["failed"] > 0 or report["warnings"] > 0:
            print("Next Steps:")
            print("1. Review verification_report.json for details")
            print("2. Run ./ultrathink_deploy_master.sh to deploy")
            print("3. Check deployment logs for any errors")
        else:
            print("✅ Everything looks good!")
            
        return report


def main():
    """Main verification process"""
    verifier = DeploymentVerifier()
    results = verifier.verify_all()
    report = verifier.generate_report(results)
    
    # Create quick status script
    with open("check_status.sh", "w") as f:
        f.write("""#!/bin/bash
echo "🔍 DEPLOYMENT STATUS CHECK"
echo "========================="

# Check Railway
if command -v railway &> /dev/null; then
    echo ""
    echo "Railway Status:"
    railway status 2>/dev/null || echo "  Not connected to project"
    railway whoami 2>/dev/null || echo "  Not authenticated"
fi

# Check deployment info
if [ -f deployment_state.json ]; then
    echo ""
    echo "Last Deployment:"
    cat deployment_state.json | python3 -m json.tool 2>/dev/null || cat deployment_state.json
fi

# Check verification
if [ -f verification_report.json ]; then
    echo ""
    echo "Verification Summary:"
    cat verification_report.json | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'  Passed: {d[\"passed\"]}, Warnings: {d[\"warnings\"]}, Failed: {d[\"failed\"]}')" 2>/dev/null
fi

# Check URL
if [ -f deployment_url.txt ]; then
    echo ""
    echo "Deployment URL: $(cat deployment_url.txt)"
fi
""")
    
    os.chmod("check_status.sh", 0o755)
    
    print()
    print("Quick status check: ./check_status.sh")
    
    # Exit with appropriate code
    sys.exit(0 if report["failed"] == 0 else 1)


if __name__ == "__main__":
    main()