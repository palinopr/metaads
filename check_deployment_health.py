#!/usr/bin/env python3
"""
Railway Deployment Health Check
Verifies all files are correctly configured for Python deployment
"""

import os
import json
import sys

def check_file_exists(filepath, required=True):
    """Check if a file exists"""
    exists = os.path.exists(filepath)
    status = "✅" if exists else ("❌" if required else "⚠️")
    print(f"{status} {filepath}: {'Found' if exists else 'Missing'}")
    return exists

def check_file_content(filepath, expected_content, description):
    """Check if file contains expected content"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            if expected_content in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - Expected: {expected_content}")
                return False
    except Exception as e:
        print(f"❌ {description} - Error: {str(e)}")
        return False

def main():
    print("🔍 Railway Python Deployment Health Check")
    print("=" * 50)
    
    issues = []
    
    # Check required files
    print("\n📁 Required Files:")
    if not check_file_exists("app.py"):
        issues.append("Missing app.py - main application file")
    if not check_file_exists("requirements.txt"):
        issues.append("Missing requirements.txt - dependencies file")
    if not check_file_exists("Procfile"):
        issues.append("Missing Procfile - process configuration")
    if not check_file_exists("runtime.txt"):
        issues.append("Missing runtime.txt - Python version specification")
    
    # Check optional but recommended files
    print("\n📁 Optional Files:")
    check_file_exists(".railwayignore", required=False)
    check_file_exists(".env", required=False)
    
    # Check file contents
    print("\n📝 File Content Validation:")
    
    # Check runtime.txt format
    if os.path.exists("runtime.txt"):
        with open("runtime.txt", 'r') as f:
            runtime = f.read().strip()
            if runtime == "python-3.11.0":
                print("✅ runtime.txt: Correct format (python-3.11.0)")
            else:
                print(f"❌ runtime.txt: Invalid format '{runtime}' - should be 'python-3.11.0'")
                issues.append(f"Invalid runtime.txt format: {runtime}")
    
    # Check Procfile
    if not check_file_content("Procfile", "web: gunicorn app:app", "Procfile has correct gunicorn command"):
        issues.append("Procfile missing or incorrect gunicorn configuration")
    
    # Check requirements.txt
    if os.path.exists("requirements.txt"):
        with open("requirements.txt", 'r') as f:
            reqs = f.read()
            missing_deps = []
            if "flask" not in reqs:
                missing_deps.append("flask")
            if "gunicorn" not in reqs:
                missing_deps.append("gunicorn")
            if "flask-cors" not in reqs:
                missing_deps.append("flask-cors")
            
            if missing_deps:
                print(f"❌ requirements.txt missing: {', '.join(missing_deps)}")
                issues.append(f"Missing dependencies: {', '.join(missing_deps)}")
            else:
                print("✅ requirements.txt has all required dependencies")
    
    # Check for conflicting files
    print("\n🔍 Checking for Conflicts:")
    if os.path.exists("main.py"):
        print("❌ main.py exists - may conflict with app.py")
        issues.append("main.py exists - remove to avoid conflicts")
    else:
        print("✅ No main.py conflict")
    
    if os.path.exists("nixpacks.toml"):
        print("❌ nixpacks.toml exists - may override Procfile")
        issues.append("nixpacks.toml exists - remove to use Procfile")
    else:
        print("✅ No nixpacks.toml conflict")
    
    # Check app.py structure
    if os.path.exists("app.py"):
        with open("app.py", 'r') as f:
            app_content = f.read()
            if "app = Flask(__name__)" in app_content:
                print("✅ app.py has Flask initialization")
            else:
                print("❌ app.py missing Flask initialization")
                issues.append("app.py missing proper Flask setup")
            
            if "if __name__ == '__main__':" in app_content:
                print("✅ app.py has main block")
            else:
                print("⚠️  app.py missing main block (optional but recommended)")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    if not issues:
        print("✅ All checks passed! Ready for deployment.")
        print("\n🚀 Deploy with: ./create_python_service.sh")
    else:
        print(f"❌ Found {len(issues)} issue(s):")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
        print("\n⚠️  Fix these issues before deploying!")
        sys.exit(1)

if __name__ == "__main__":
    main()