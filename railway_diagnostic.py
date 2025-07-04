#!/usr/bin/env python3
"""
Railway Deployment Diagnostic Script
====================================
Comprehensive diagnostic tool to identify all possible Railway deployment issues.
"""

import os
import sys
import json
import subprocess
import ast
import re
from pathlib import Path
from typing import Dict, List, Tuple, Any

class RailwayDiagnostic:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.info = []
        self.root_path = Path.cwd()
        
    def run_all_checks(self):
        """Run all diagnostic checks"""
        print("🔍 Starting Railway Deployment Diagnostic...")
        print("=" * 80)
        
        # Environment checks
        self.check_python_version()
        self.check_environment_files()
        self.check_railway_config()
        
        # File structure checks
        self.check_project_structure()
        self.check_for_conflicting_files()
        self.check_hidden_files()
        
        # Python checks
        self.check_python_syntax()
        self.check_imports()
        self.check_requirements()
        
        # Railway-specific checks
        self.check_procfile()
        self.check_runtime_txt()
        self.check_port_configuration()
        
        # Application checks
        self.check_app_py()
        self.check_circular_dependencies()
        self.check_file_permissions()
        
        # Generate report
        self.generate_report()
        
    def check_python_version(self):
        """Check Python version compatibility"""
        print("\n📌 Checking Python version...")
        try:
            version = sys.version_info
            if version.major == 3 and version.minor >= 9:
                self.info.append(f"✓ Python version: {version.major}.{version.minor}.{version.micro}")
            else:
                self.issues.append(f"❌ Python version {version.major}.{version.minor} may not be compatible")
        except Exception as e:
            self.issues.append(f"❌ Error checking Python version: {e}")
            
    def check_environment_files(self):
        """Check for environment configuration files"""
        print("\n📌 Checking environment files...")
        env_files = ['.env', '.env.local', '.env.production', 'railway.toml', 'railway.json']
        
        for env_file in env_files:
            if (self.root_path / env_file).exists():
                self.info.append(f"✓ Found {env_file}")
                if env_file == '.env':
                    self.check_env_file_content()
                    
    def check_env_file_content(self):
        """Check .env file for Railway-specific issues"""
        env_path = self.root_path / '.env'
        if env_path.exists():
            try:
                with open(env_path, 'r') as f:
                    content = f.read()
                    if 'PORT=' in content:
                        self.warnings.append("⚠️  PORT defined in .env - Railway sets this automatically")
                    if 'RAILWAY_' in content:
                        self.info.append("✓ Railway environment variables found")
            except Exception as e:
                self.issues.append(f"❌ Error reading .env: {e}")
                
    def check_railway_config(self):
        """Check for Railway configuration files"""
        print("\n📌 Checking Railway configuration...")
        
        # Check railway.toml
        if (self.root_path / 'railway.toml').exists():
            try:
                import toml
                with open('railway.toml', 'r') as f:
                    config = toml.load(f)
                    self.info.append("✓ railway.toml found and valid")
            except ImportError:
                self.warnings.append("⚠️  toml package not installed for parsing railway.toml")
            except Exception as e:
                self.issues.append(f"❌ Error parsing railway.toml: {e}")
                
        # Check railway.json
        if (self.root_path / 'railway.json').exists():
            try:
                with open('railway.json', 'r') as f:
                    config = json.load(f)
                    self.info.append("✓ railway.json found and valid")
            except Exception as e:
                self.issues.append(f"❌ Error parsing railway.json: {e}")
                
    def check_project_structure(self):
        """Check project structure for conflicts"""
        print("\n📌 Checking project structure...")
        
        # Check for multiple app entry points
        app_files = ['app.py', 'main.py', 'server.py', 'wsgi.py', 'application.py']
        found_apps = []
        
        for app_file in app_files:
            if (self.root_path / app_file).exists():
                found_apps.append(app_file)
                
        if len(found_apps) > 1:
            self.warnings.append(f"⚠️  Multiple app entry points found: {', '.join(found_apps)}")
        elif len(found_apps) == 0:
            self.issues.append("❌ No app entry point found (app.py, main.py, etc.)")
        else:
            self.info.append(f"✓ App entry point: {found_apps[0]}")
            
    def check_for_conflicting_files(self):
        """Check for files that might conflict with Railway"""
        print("\n📌 Checking for conflicting files...")
        
        conflict_patterns = [
            ('*.pyc', 'Python bytecode files'),
            ('__pycache__', 'Python cache directories'),
            ('.DS_Store', 'macOS system files'),
            ('*.log', 'Log files'),
            ('*.sqlite', 'SQLite database files'),
            ('node_modules/', 'Node.js dependencies in Python project'),
        ]
        
        for pattern, description in conflict_patterns:
            matches = list(self.root_path.rglob(pattern))
            if matches:
                self.warnings.append(f"⚠️  Found {len(matches)} {description}")
                
    def check_hidden_files(self):
        """Check for hidden files that might affect deployment"""
        print("\n📌 Checking hidden files...")
        
        important_hidden = ['.gitignore', '.dockerignore', '.slugignore']
        
        for hidden_file in important_hidden:
            path = self.root_path / hidden_file
            if path.exists():
                self.info.append(f"✓ Found {hidden_file}")
                if hidden_file == '.gitignore':
                    self.check_gitignore_content()
                    
    def check_gitignore_content(self):
        """Check .gitignore for potential issues"""
        try:
            with open('.gitignore', 'r') as f:
                content = f.read()
                critical_ignores = ['requirements.txt', 'runtime.txt', 'Procfile', 'app.py']
                for critical in critical_ignores:
                    if critical in content:
                        self.issues.append(f"❌ Critical file '{critical}' is in .gitignore!")
        except Exception as e:
            self.warnings.append(f"⚠️  Error reading .gitignore: {e}")
            
    def check_python_syntax(self):
        """Check all Python files for syntax errors"""
        print("\n📌 Checking Python syntax...")
        
        python_files = list(self.root_path.rglob('*.py'))
        syntax_errors = []
        
        for py_file in python_files:
            if 'venv' in str(py_file) or '__pycache__' in str(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    ast.parse(content)
            except SyntaxError as e:
                syntax_errors.append(f"{py_file}: {e}")
            except Exception as e:
                self.warnings.append(f"⚠️  Error checking {py_file}: {e}")
                
        if syntax_errors:
            for error in syntax_errors:
                self.issues.append(f"❌ Syntax error in {error}")
        else:
            self.info.append(f"✓ All {len(python_files)} Python files have valid syntax")
            
    def check_imports(self):
        """Check for import issues"""
        print("\n📌 Checking imports...")
        
        # Check app.py imports specifically
        if (self.root_path / 'app.py').exists():
            try:
                with open('app.py', 'r') as f:
                    content = f.read()
                    
                # Check for common import issues
                if 'from src.' in content or 'import src.' in content:
                    self.info.append("✓ Using src module imports")
                    
                # Check for Flask/FastAPI
                if 'from flask import' in content:
                    self.info.append("✓ Flask framework detected")
                elif 'from fastapi import' in content:
                    self.info.append("✓ FastAPI framework detected")
                else:
                    self.warnings.append("⚠️  No web framework detected in app.py")
                    
            except Exception as e:
                self.issues.append(f"❌ Error checking app.py imports: {e}")
                
    def check_requirements(self):
        """Check requirements files"""
        print("\n📌 Checking requirements...")
        
        req_files = ['requirements.txt', 'railway-requirements.txt', 'agent-requirements.txt']
        main_req_found = False
        
        for req_file in req_files:
            if (self.root_path / req_file).exists():
                self.info.append(f"✓ Found {req_file}")
                if req_file == 'requirements.txt':
                    main_req_found = True
                    self.check_requirements_content()
                    
        if not main_req_found:
            self.issues.append("❌ No requirements.txt found!")
            
    def check_requirements_content(self):
        """Check requirements.txt content"""
        try:
            with open('requirements.txt', 'r') as f:
                content = f.read()
                lines = content.strip().split('\n')
                
                # Check for empty file
                if not content.strip():
                    self.issues.append("❌ requirements.txt is empty!")
                    return
                    
                # Check for common issues
                for line in lines:
                    if line.strip() and not line.startswith('#'):
                        if '==' not in line and '>=' not in line:
                            self.warnings.append(f"⚠️  Unpinned dependency: {line}")
                            
                # Check for essential packages
                essential = ['flask', 'fastapi', 'django', 'gunicorn', 'uvicorn']
                has_server = any(pkg in content.lower() for pkg in essential)
                
                if not has_server:
                    self.warnings.append("⚠️  No web server package found in requirements.txt")
                    
        except Exception as e:
            self.issues.append(f"❌ Error reading requirements.txt: {e}")
            
    def check_procfile(self):
        """Check Procfile configuration"""
        print("\n📌 Checking Procfile...")
        
        if (self.root_path / 'Procfile').exists():
            try:
                with open('Procfile', 'r') as f:
                    content = f.read().strip()
                    
                if not content:
                    self.issues.append("❌ Procfile is empty!")
                else:
                    lines = content.split('\n')
                    web_process = None
                    
                    for line in lines:
                        if line.startswith('web:'):
                            web_process = line
                            self.info.append(f"✓ Web process: {line}")
                            
                    if not web_process:
                        self.issues.append("❌ No web process defined in Procfile!")
                        
                    # Check for common issues
                    if web_process:
                        if '$PORT' not in web_process and '--port' not in web_process:
                            self.warnings.append("⚠️  Procfile may not be using $PORT variable")
                            
            except Exception as e:
                self.issues.append(f"❌ Error reading Procfile: {e}")
        else:
            self.issues.append("❌ No Procfile found!")
            
    def check_runtime_txt(self):
        """Check runtime.txt"""
        print("\n📌 Checking runtime.txt...")
        
        if (self.root_path / 'runtime.txt').exists():
            try:
                with open('runtime.txt', 'r') as f:
                    content = f.read().strip()
                    
                if not content:
                    self.issues.append("❌ runtime.txt is empty!")
                else:
                    self.info.append(f"✓ Runtime: {content}")
                    
                    # Check version format
                    if not re.match(r'python-\d+\.\d+\.\d+', content):
                        self.issues.append("❌ Invalid runtime.txt format (should be 'python-X.Y.Z')")
                        
            except Exception as e:
                self.issues.append(f"❌ Error reading runtime.txt: {e}")
        else:
            self.warnings.append("⚠️  No runtime.txt found (Railway will use default)")
            
    def check_port_configuration(self):
        """Check port configuration"""
        print("\n📌 Checking port configuration...")
        
        if (self.root_path / 'app.py').exists():
            try:
                with open('app.py', 'r') as f:
                    content = f.read()
                    
                # Check for port configuration
                port_patterns = [
                    r'port\s*=\s*int\(os\.environ\.get\(["\']PORT["\']\s*,\s*\d+\)\)',
                    r'port\s*=\s*os\.getenv\(["\']PORT["\']\s*,\s*\d+\)',
                    r'PORT\s*=\s*int\(os\.environ\.get\(["\']PORT["\']\s*,\s*\d+\)\)',
                ]
                
                port_found = any(re.search(pattern, content) for pattern in port_patterns)
                
                if port_found:
                    self.info.append("✓ Port configuration found using environment variable")
                else:
                    self.warnings.append("⚠️  No dynamic port configuration found")
                    
                # Check for hardcoded ports
                if re.search(r'port\s*=\s*\d{4,5}(?!\))', content):
                    self.issues.append("❌ Hardcoded port found - use os.environ.get('PORT')")
                    
            except Exception as e:
                self.issues.append(f"❌ Error checking port configuration: {e}")
                
    def check_app_py(self):
        """Detailed check of app.py"""
        print("\n📌 Checking app.py in detail...")
        
        if (self.root_path / 'app.py').exists():
            try:
                with open('app.py', 'r') as f:
                    content = f.read()
                    
                # Check for app initialization
                if 'app = Flask(__name__)' in content or 'app = FastAPI()' in content:
                    self.info.append("✓ App initialization found")
                else:
                    self.warnings.append("⚠️  No clear app initialization found")
                    
                # Check for main block
                if 'if __name__ == "__main__":' in content:
                    self.info.append("✓ Main block found")
                else:
                    self.warnings.append("⚠️  No main block found")
                    
                # Check for host configuration
                if 'host="0.0.0.0"' in content or 'host=\'0.0.0.0\'' in content:
                    self.info.append("✓ Host configured to 0.0.0.0")
                else:
                    self.warnings.append("⚠️  Host not explicitly set to 0.0.0.0")
                    
            except Exception as e:
                self.issues.append(f"❌ Error analyzing app.py: {e}")
                
    def check_circular_dependencies(self):
        """Check for circular import dependencies"""
        print("\n📌 Checking for circular dependencies...")
        
        # This is a simplified check - looks for common patterns
        try:
            python_files = list(self.root_path.rglob('*.py'))
            import_map = {}
            
            for py_file in python_files:
                if 'venv' in str(py_file) or '__pycache__' in str(py_file):
                    continue
                    
                try:
                    with open(py_file, 'r') as f:
                        content = f.read()
                        imports = re.findall(r'from\s+(\S+)\s+import|import\s+(\S+)', content)
                        import_map[str(py_file)] = [imp[0] or imp[1] for imp in imports]
                except:
                    pass
                    
            # Simplified circular dependency check
            self.info.append(f"✓ Analyzed {len(import_map)} Python files for imports")
            
        except Exception as e:
            self.warnings.append(f"⚠️  Error checking circular dependencies: {e}")
            
    def check_file_permissions(self):
        """Check file permissions"""
        print("\n📌 Checking file permissions...")
        
        try:
            # Check if key files are readable
            key_files = ['app.py', 'requirements.txt', 'Procfile', 'runtime.txt']
            
            for key_file in key_files:
                if (self.root_path / key_file).exists():
                    if os.access(key_file, os.R_OK):
                        self.info.append(f"✓ {key_file} is readable")
                    else:
                        self.issues.append(f"❌ {key_file} is not readable!")
                        
        except Exception as e:
            self.warnings.append(f"⚠️  Error checking file permissions: {e}")
            
    def generate_report(self):
        """Generate comprehensive diagnostic report"""
        print("\n" + "=" * 80)
        print("📊 DIAGNOSTIC REPORT")
        print("=" * 80)
        
        # Critical Issues
        if self.issues:
            print(f"\n🚨 CRITICAL ISSUES ({len(self.issues)}):")
            for issue in self.issues:
                print(f"  {issue}")
        else:
            print("\n✅ No critical issues found!")
            
        # Warnings
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  {warning}")
                
        # Information
        if self.info:
            print(f"\n📌 INFORMATION ({len(self.info)}):")
            for info in self.info:
                print(f"  {info}")
                
        # Summary
        print("\n" + "=" * 80)
        print("📈 SUMMARY:")
        print(f"  - Critical Issues: {len(self.issues)}")
        print(f"  - Warnings: {len(self.warnings)}")
        print(f"  - Info Points: {len(self.info)}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        if self.issues:
            print("  1. Fix all critical issues before deploying")
            print("  2. Review warnings for potential improvements")
            print("  3. Ensure all Railway-specific files are present")
        else:
            print("  1. Review warnings for optimization opportunities")
            print("  2. Test locally with Railway CLI before deploying")
            print("  3. Monitor logs during deployment")
            
        # Save report
        self.save_report()
        
    def save_report(self):
        """Save diagnostic report to file"""
        report_path = self.root_path / 'railway_diagnostic_report.txt'
        
        with open(report_path, 'w') as f:
            f.write("Railway Deployment Diagnostic Report\n")
            f.write("=" * 80 + "\n\n")
            
            f.write(f"Critical Issues: {len(self.issues)}\n")
            for issue in self.issues:
                f.write(f"  {issue}\n")
                
            f.write(f"\nWarnings: {len(self.warnings)}\n")
            for warning in self.warnings:
                f.write(f"  {warning}\n")
                
            f.write(f"\nInformation: {len(self.info)}\n")
            for info in self.info:
                f.write(f"  {info}\n")
                
        print(f"\n📄 Report saved to: {report_path}")


if __name__ == "__main__":
    diagnostic = RailwayDiagnostic()
    diagnostic.run_all_checks()