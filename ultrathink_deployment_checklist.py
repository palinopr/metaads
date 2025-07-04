#!/usr/bin/env python3
"""
ULTRATHINK DEPLOYMENT CHECKLIST
==============================
Automated deployment checklist with validation and fixes.
"""

import os
import sys
import json
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class DeploymentChecklist:
    """Comprehensive deployment checklist"""
    
    def __init__(self):
        self.checks = []
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "passed": 0,
            "failed": 0,
            "warnings": 0,
            "details": []
        }
        self._setup_checks()
        
    def _setup_checks(self):
        """Configure all deployment checks"""
        self.checks = [
            # Environment checks
            ("Python version", self._check_python_version, "critical"),
            ("Node.js installed", self._check_node_installed, "critical"),
            ("NPM installed", self._check_npm_installed, "critical"),
            ("Git installed", self._check_git_installed, "important"),
            
            # Railway checks
            ("Railway CLI available", self._check_railway_cli, "important"),
            ("Railway authentication", self._check_railway_auth, "important"),
            ("Railway project linked", self._check_railway_project, "important"),
            
            # Project structure
            ("Backend files present", self._check_backend_files, "critical"),
            ("Frontend files present", self._check_frontend_files, "critical"),
            ("Configuration files", self._check_config_files, "critical"),
            ("Dependencies specified", self._check_dependencies, "critical"),
            
            # Code quality
            ("No syntax errors", self._check_syntax_errors, "critical"),
            ("Environment variables", self._check_env_vars, "important"),
            ("Port configuration", self._check_port_config, "critical"),
            
            # Build readiness
            ("Node modules installed", self._check_node_modules, "warning"),
            ("Python packages installed", self._check_python_packages, "warning"),
            ("Build scripts present", self._check_build_scripts, "important"),
            
            # Security
            ("No sensitive data", self._check_sensitive_data, "critical"),
            ("Git ignore configured", self._check_gitignore, "important"),
            
            # Deployment specific
            ("Procfile valid", self._check_procfile, "critical"),
            ("Runtime specified", self._check_runtime, "important"),
            ("Start command works", self._check_start_command, "critical"),
        ]
        
    def run_checklist(self) -> Dict:
        """Run all checks and return results"""
        print("=" * 60)
        print("ULTRATHINK DEPLOYMENT CHECKLIST")
        print("=" * 60)
        print()
        
        for check_name, check_func, severity in self.checks:
            print(f"Checking: {check_name}... ", end="", flush=True)
            
            try:
                result = check_func()
                
                if result["status"] == "pass":
                    print("✅ PASS")
                    self.results["passed"] += 1
                elif result["status"] == "warning":
                    print("⚠️  WARNING")
                    self.results["warnings"] += 1
                else:
                    print("❌ FAIL")
                    self.results["failed"] += 1
                    
                self.results["details"].append({
                    "check": check_name,
                    "severity": severity,
                    "status": result["status"],
                    "message": result.get("message", ""),
                    "fix": result.get("fix", "")
                })
                
            except Exception as e:
                print("❌ ERROR")
                self.results["failed"] += 1
                self.results["details"].append({
                    "check": check_name,
                    "severity": severity,
                    "status": "error",
                    "message": str(e),
                    "fix": "Check implementation"
                })
        
        # Summary
        print()
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"⚠️  Warnings: {self.results['warnings']}")
        print(f"❌ Failed: {self.results['failed']}")
        print()
        
        # Save results
        with open("deployment_checklist_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
            
        # Generate fix script if needed
        if self.results["failed"] > 0:
            self._generate_fix_script()
            
        return self.results
        
    def _check_python_version(self) -> Dict:
        """Check Python version"""
        version = sys.version_info
        if version.major >= 3 and version.minor >= 8:
            return {"status": "pass", "message": f"Python {version.major}.{version.minor}"}
        else:
            return {
                "status": "fail",
                "message": f"Python {version.major}.{version.minor} (need 3.8+)",
                "fix": "Install Python 3.8 or higher"
            }
            
    def _check_node_installed(self) -> Dict:
        """Check if Node.js is installed"""
        if shutil.which("node"):
            try:
                result = subprocess.run(["node", "--version"], 
                                      capture_output=True, text=True)
                return {"status": "pass", "message": result.stdout.strip()}
            except:
                pass
        return {
            "status": "fail",
            "message": "Node.js not found",
            "fix": "Install Node.js from https://nodejs.org"
        }
        
    def _check_npm_installed(self) -> Dict:
        """Check if NPM is installed"""
        if shutil.which("npm"):
            try:
                result = subprocess.run(["npm", "--version"], 
                                      capture_output=True, text=True)
                return {"status": "pass", "message": f"NPM {result.stdout.strip()}"}
            except:
                pass
        return {
            "status": "fail",
            "message": "NPM not found",
            "fix": "Install Node.js which includes NPM"
        }
        
    def _check_git_installed(self) -> Dict:
        """Check if Git is installed"""
        if shutil.which("git"):
            return {"status": "pass"}
        return {
            "status": "warning",
            "message": "Git not found",
            "fix": "Install Git for version control"
        }
        
    def _check_railway_cli(self) -> Dict:
        """Check if Railway CLI is available"""
        if shutil.which("railway"):
            return {"status": "pass"}
        return {
            "status": "warning",
            "message": "Railway CLI not installed",
            "fix": "npm install -g @railway/cli"
        }
        
    def _check_railway_auth(self) -> Dict:
        """Check Railway authentication"""
        if not shutil.which("railway"):
            return {"status": "warning", "message": "Railway CLI not installed"}
            
        try:
            result = subprocess.run(["railway", "whoami"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return {"status": "pass", "message": f"Authenticated as {result.stdout.strip()}"}
        except:
            pass
            
        return {
            "status": "warning",
            "message": "Not authenticated",
            "fix": "railway login"
        }
        
    def _check_railway_project(self) -> Dict:
        """Check Railway project linking"""
        if not shutil.which("railway"):
            return {"status": "warning", "message": "Railway CLI not installed"}
            
        try:
            result = subprocess.run(["railway", "status"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return {"status": "pass"}
        except:
            pass
            
        return {
            "status": "warning",
            "message": "No project linked",
            "fix": "railway link or railway init"
        }
        
    def _check_backend_files(self) -> Dict:
        """Check backend files"""
        required_files = ["app.py"]
        missing = [f for f in required_files if not Path(f).exists()]
        
        if not missing:
            return {"status": "pass"}
        return {
            "status": "fail",
            "message": f"Missing files: {', '.join(missing)}",
            "fix": "Create missing backend files"
        }
        
    def _check_frontend_files(self) -> Dict:
        """Check frontend files"""
        required_files = ["package.json", "next.config.mjs"]
        missing = [f for f in required_files if not Path(f).exists()]
        
        if not missing:
            return {"status": "pass"}
        return {
            "status": "fail",
            "message": f"Missing files: {', '.join(missing)}",
            "fix": "Create missing frontend files"
        }
        
    def _check_config_files(self) -> Dict:
        """Check configuration files"""
        required_files = ["Procfile"]
        optional_files = ["runtime.txt", "railway.json", "railway.toml"]
        
        missing_required = [f for f in required_files if not Path(f).exists()]
        missing_optional = [f for f in optional_files if not Path(f).exists()]
        
        if missing_required:
            return {
                "status": "fail",
                "message": f"Missing required: {', '.join(missing_required)}",
                "fix": "Create missing configuration files"
            }
        elif missing_optional:
            return {
                "status": "warning",
                "message": f"Missing optional: {', '.join(missing_optional)}"
            }
        return {"status": "pass"}
        
    def _check_dependencies(self) -> Dict:
        """Check if dependencies are specified"""
        issues = []
        
        # Check Python dependencies
        if not Path("requirements.txt").exists() and not Path("railway-requirements.txt").exists():
            issues.append("No Python requirements file")
            
        # Check Node dependencies
        if Path("package.json").exists():
            with open("package.json") as f:
                pkg = json.load(f)
                if not pkg.get("dependencies"):
                    issues.append("No Node dependencies in package.json")
        
        if issues:
            return {
                "status": "fail",
                "message": "; ".join(issues),
                "fix": "Add dependency files"
            }
        return {"status": "pass"}
        
    def _check_syntax_errors(self) -> Dict:
        """Check for Python syntax errors"""
        errors = []
        
        for py_file in Path(".").glob("*.py"):
            try:
                with open(py_file) as f:
                    compile(f.read(), py_file, 'exec')
            except SyntaxError as e:
                errors.append(f"{py_file}: {e}")
                
        if errors:
            return {
                "status": "fail",
                "message": f"Syntax errors found in {len(errors)} files",
                "fix": "Fix syntax errors in Python files"
            }
        return {"status": "pass"}
        
    def _check_env_vars(self) -> Dict:
        """Check environment variables"""
        required_vars = ["OPENAI_API_KEY"]
        missing = [var for var in required_vars if not os.environ.get(var)]
        
        if missing:
            return {
                "status": "warning",
                "message": f"Missing env vars: {', '.join(missing)}",
                "fix": "Set environment variables in Railway dashboard"
            }
        return {"status": "pass"}
        
    def _check_port_config(self) -> Dict:
        """Check port configuration"""
        issues = []
        
        # Check app.py for PORT usage
        if Path("app.py").exists():
            with open("app.py") as f:
                content = f.read()
                if "PORT" not in content and "port" not in content.lower():
                    issues.append("app.py may not use PORT environment variable")
                    
        if issues:
            return {
                "status": "warning",
                "message": "; ".join(issues),
                "fix": "Ensure app uses os.environ.get('PORT', 5000)"
            }
        return {"status": "pass"}
        
    def _check_node_modules(self) -> Dict:
        """Check if node_modules exists"""
        if Path("package.json").exists() and not Path("node_modules").exists():
            return {
                "status": "warning",
                "message": "node_modules not found",
                "fix": "Run: npm install"
            }
        return {"status": "pass"}
        
    def _check_python_packages(self) -> Dict:
        """Check if Python packages are installed"""
        if Path("requirements.txt").exists():
            try:
                import flask
                import gunicorn
                return {"status": "pass"}
            except ImportError:
                return {
                    "status": "warning",
                    "message": "Some Python packages not installed locally",
                    "fix": "Run: pip install -r requirements.txt"
                }
        return {"status": "pass"}
        
    def _check_build_scripts(self) -> Dict:
        """Check build scripts in package.json"""
        if Path("package.json").exists():
            with open("package.json") as f:
                pkg = json.load(f)
                scripts = pkg.get("scripts", {})
                
                if "build" not in scripts:
                    return {
                        "status": "warning",
                        "message": "No build script in package.json",
                        "fix": "Add build script to package.json"
                    }
        return {"status": "pass"}
        
    def _check_sensitive_data(self) -> Dict:
        """Check for sensitive data in code"""
        patterns = [
            r"sk-[a-zA-Z0-9]{48}",  # OpenAI API key
            r"ghp_[a-zA-Z0-9]{36}",  # GitHub token
            r"password\s*=\s*[\"'][^\"']+[\"']",  # Hardcoded passwords
        ]
        
        issues = []
        for py_file in Path(".").glob("**/*.py"):
            if "venv" in str(py_file) or "node_modules" in str(py_file):
                continue
                
            try:
                with open(py_file) as f:
                    content = f.read()
                    for pattern in patterns:
                        import re
                        if re.search(pattern, content):
                            issues.append(str(py_file))
                            break
            except:
                pass
                
        if issues:
            return {
                "status": "fail",
                "message": f"Possible secrets in: {', '.join(issues[:3])}",
                "fix": "Remove hardcoded secrets, use environment variables"
            }
        return {"status": "pass"}
        
    def _check_gitignore(self) -> Dict:
        """Check .gitignore configuration"""
        if not Path(".gitignore").exists():
            return {
                "status": "warning",
                "message": "No .gitignore file",
                "fix": "Create .gitignore file"
            }
            
        with open(".gitignore") as f:
            content = f.read()
            
        important_entries = ["venv", "node_modules", "__pycache__", ".env"]
        missing = [e for e in important_entries if e not in content]
        
        if missing:
            return {
                "status": "warning",
                "message": f"Missing from .gitignore: {', '.join(missing)}",
                "fix": "Add missing entries to .gitignore"
            }
        return {"status": "pass"}
        
    def _check_procfile(self) -> Dict:
        """Check Procfile validity"""
        if not Path("Procfile").exists():
            return {
                "status": "fail",
                "message": "No Procfile found",
                "fix": "Create Procfile with: web: gunicorn app:app"
            }
            
        with open("Procfile") as f:
            content = f.read().strip()
            
        if not content.startswith("web:"):
            return {
                "status": "fail",
                "message": "Procfile must define web process",
                "fix": "Update Procfile to: web: gunicorn app:app"
            }
        return {"status": "pass"}
        
    def _check_runtime(self) -> Dict:
        """Check runtime.txt"""
        if not Path("runtime.txt").exists():
            return {
                "status": "warning",
                "message": "No runtime.txt found",
                "fix": "Create runtime.txt with: python-3.11.0"
            }
            
        with open("runtime.txt") as f:
            content = f.read().strip()
            
        if not content.startswith("python-"):
            return {
                "status": "fail",
                "message": "Invalid runtime.txt format",
                "fix": "Set content to: python-3.11.0"
            }
        return {"status": "pass"}
        
    def _check_start_command(self) -> Dict:
        """Check if start command works"""
        if Path("Procfile").exists():
            with open("Procfile") as f:
                procfile = f.read().strip()
                
            # Extract command
            if procfile.startswith("web:"):
                command = procfile[4:].strip()
                
                # Basic validation
                if "gunicorn" in command and "app:app" in command:
                    return {"status": "pass"}
                elif "python" in command:
                    return {"status": "warning", "message": "Consider using gunicorn for production"}
                    
        return {
            "status": "warning",
            "message": "Cannot validate start command",
            "fix": "Ensure Procfile has valid web command"
        }
        
    def _generate_fix_script(self):
        """Generate script to fix common issues"""
        fixes = []
        
        for detail in self.results["details"]:
            if detail["status"] == "fail" and detail.get("fix"):
                fixes.append(f"# {detail['check']}")
                fixes.append(f"# Fix: {detail['fix']}")
                
                # Generate actual fix commands
                if "Procfile" in detail["check"]:
                    fixes.append('echo "web: gunicorn app:app --bind 0.0.0.0:$PORT" > Procfile')
                elif "runtime.txt" in detail["check"]:
                    fixes.append('echo "python-3.11.0" > runtime.txt')
                elif "Railway CLI" in detail["fix"]:
                    fixes.append("npm install -g @railway/cli")
                    
                fixes.append("")
                
        if fixes:
            script_content = f"""#!/bin/bash
# Auto-generated fix script
# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

set -e

echo "Applying deployment fixes..."

{chr(10).join(fixes)}

echo "Fixes applied! Re-run checklist to verify."
"""
            
            with open("apply_fixes.sh", "w") as f:
                f.write(script_content)
                
            os.chmod("apply_fixes.sh", 0o755)
            print("Fix script generated: ./apply_fixes.sh")


def main():
    """Run deployment checklist"""
    checklist = DeploymentChecklist()
    results = checklist.run_checklist()
    
    # Determine readiness
    if results["failed"] == 0:
        print("✅ Ready for deployment!")
        sys.exit(0)
    else:
        print("❌ Not ready for deployment. Fix issues above.")
        sys.exit(1)


if __name__ == "__main__":
    main()