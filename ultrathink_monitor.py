#!/usr/bin/env python3
"""
ULTRATHINK DEPLOYMENT MONITOR
============================
Continuous monitoring system for deployment status and health.
"""

import os
import sys
import time
import json
import requests
import subprocess
import threading
import logging
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import signal

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


class DeploymentMonitor:
    """Advanced deployment monitoring system"""
    
    def __init__(self):
        self.monitoring = True
        self.deployment_info = self._load_deployment_info()
        self.health_checks = []
        self.metrics = {
            "start_time": datetime.now(),
            "checks_performed": 0,
            "failures": 0,
            "last_check": None,
            "status_history": []
        }
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Received shutdown signal, stopping monitor...")
        self.monitoring = False
        sys.exit(0)
        
    def _load_deployment_info(self) -> Dict[str, Any]:
        """Load deployment information"""
        info_files = [
            "last_deployment.json",
            "deployment_report.json",
            ".railway/deployment.json"
        ]
        
        for file in info_files:
            if Path(file).exists():
                try:
                    with open(file) as f:
                        return json.load(f)
                except:
                    pass
                    
        return {}
        
    def start_monitoring(self):
        """Start the monitoring loop"""
        logger.info("=" * 60)
        logger.info("ULTRATHINK DEPLOYMENT MONITOR STARTED")
        logger.info("=" * 60)
        
        # Set up health checks
        self._setup_health_checks()
        
        # Start monitoring threads
        threads = [
            threading.Thread(target=self._health_check_loop),
            threading.Thread(target=self._log_monitor_loop),
            threading.Thread(target=self._metrics_reporter_loop),
            threading.Thread(target=self._alert_loop)
        ]
        
        for thread in threads:
            thread.daemon = True
            thread.start()
            
        # Main monitoring loop
        try:
            while self.monitoring:
                self._display_dashboard()
                time.sleep(5)  # Update dashboard every 5 seconds
        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")
            
    def _setup_health_checks(self):
        """Configure health checks"""
        # Railway-specific checks
        if shutil.which("railway"):
            self.health_checks.append({
                "name": "Railway CLI Status",
                "func": self._check_railway_cli,
                "interval": 30
            })
            
        # Application endpoint checks
        if self.deployment_info.get("url"):
            self.health_checks.append({
                "name": "Application Health",
                "func": self._check_app_health,
                "interval": 60
            })
            
        # API endpoint checks
        self.health_checks.append({
            "name": "API Health",
            "func": self._check_api_health,
            "interval": 60
        })
        
        # Resource checks
        self.health_checks.append({
            "name": "Build Status",
            "func": self._check_build_status,
            "interval": 120
        })
        
    def _health_check_loop(self):
        """Run health checks continuously"""
        while self.monitoring:
            for check in self.health_checks:
                try:
                    result = check["func"]()
                    self._record_check_result(check["name"], result)
                except Exception as e:
                    logger.error(f"Health check '{check['name']}' failed: {e}")
                    self._record_check_result(check["name"], {
                        "status": "error",
                        "error": str(e)
                    })
                    
            time.sleep(10)  # Run checks every 10 seconds
            
    def _check_railway_cli(self) -> Dict[str, Any]:
        """Check Railway CLI status"""
        try:
            # Check authentication
            result = subprocess.run(
                ["railway", "whoami"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                user = result.stdout.strip()
                
                # Check project status
                status_result = subprocess.run(
                    ["railway", "status"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                return {
                    "status": "healthy",
                    "user": user,
                    "project_linked": status_result.returncode == 0,
                    "details": status_result.stdout if status_result.returncode == 0 else None
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Not authenticated"
                }
                
        except subprocess.TimeoutExpired:
            return {"status": "timeout", "error": "Command timed out"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def _check_app_health(self) -> Dict[str, Any]:
        """Check application health via HTTP"""
        url = self.deployment_info.get("url") or self.deployment_info.get("app_url")
        
        if not url:
            return {"status": "unknown", "error": "No deployment URL found"}
            
        try:
            response = requests.get(url, timeout=10)
            
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "url": url
            }
        except requests.RequestException as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "url": url
            }
            
    def _check_api_health(self) -> Dict[str, Any]:
        """Check API endpoints"""
        base_url = self.deployment_info.get("url") or self.deployment_info.get("app_url")
        
        if not base_url:
            return {"status": "unknown", "error": "No deployment URL found"}
            
        api_endpoints = [
            "/api/health",
            "/api/status",
            "/health",
            "/api/campaign/create"
        ]
        
        results = []
        for endpoint in api_endpoints:
            try:
                url = f"{base_url.rstrip('/')}{endpoint}"
                response = requests.get(url, timeout=5)
                results.append({
                    "endpoint": endpoint,
                    "status": response.status_code,
                    "healthy": response.status_code < 500
                })
            except:
                results.append({
                    "endpoint": endpoint,
                    "status": "error",
                    "healthy": False
                })
                
        healthy_count = sum(1 for r in results if r["healthy"])
        
        return {
            "status": "healthy" if healthy_count > 0 else "unhealthy",
            "endpoints_checked": len(results),
            "healthy_endpoints": healthy_count,
            "details": results
        }
        
    def _check_build_status(self) -> Dict[str, Any]:
        """Check build/deployment status"""
        try:
            if shutil.which("railway"):
                # Get recent logs
                result = subprocess.run(
                    ["railway", "logs", "--tail", "20"],
                    capture_output=True,
                    text=True,
                    timeout=15
                )
                
                logs = result.stdout if result.returncode == 0 else ""
                
                # Analyze logs for issues
                error_keywords = ["error", "failed", "exception", "crash"]
                errors_found = any(keyword in logs.lower() for keyword in error_keywords)
                
                return {
                    "status": "unhealthy" if errors_found else "healthy",
                    "recent_errors": errors_found,
                    "log_sample": logs[:500] if logs else None
                }
            else:
                return {"status": "unknown", "error": "Railway CLI not available"}
                
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    def _log_monitor_loop(self):
        """Monitor deployment logs for issues"""
        if not shutil.which("railway"):
            return
            
        while self.monitoring:
            try:
                # Stream logs
                process = subprocess.Popen(
                    ["railway", "logs", "--tail", "10"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                for line in process.stdout:
                    if line:
                        self._analyze_log_line(line.strip())
                        
            except Exception as e:
                logger.error(f"Log monitoring error: {e}")
                
            time.sleep(30)  # Restart log streaming every 30 seconds
            
    def _analyze_log_line(self, line: str):
        """Analyze log line for issues"""
        error_patterns = [
            ("CRITICAL", r"critical|fatal"),
            ("ERROR", r"error|exception|failed"),
            ("WARNING", r"warning|warn"),
            ("CRASH", r"crash|segfault|terminated")
        ]
        
        for level, pattern in error_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                self._record_log_event(level, line)
                break
                
    def _record_log_event(self, level: str, message: str):
        """Record significant log events"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message[:200]  # Truncate long messages
        }
        
        # Save to event log
        event_file = "deployment_events.jsonl"
        with open(event_file, "a") as f:
            f.write(json.dumps(event) + "\n")
            
        # Alert if critical
        if level in ["CRITICAL", "CRASH"]:
            self._send_alert(f"Critical event detected: {message[:100]}")
            
    def _metrics_reporter_loop(self):
        """Report metrics periodically"""
        while self.monitoring:
            self._generate_metrics_report()
            time.sleep(300)  # Report every 5 minutes
            
    def _generate_metrics_report(self):
        """Generate and save metrics report"""
        uptime = datetime.now() - self.metrics["start_time"]
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "uptime_seconds": uptime.total_seconds(),
            "checks_performed": self.metrics["checks_performed"],
            "failures": self.metrics["failures"],
            "failure_rate": self.metrics["failures"] / max(self.metrics["checks_performed"], 1),
            "last_check": self.metrics["last_check"],
            "current_status": self._get_overall_status()
        }
        
        # Save report
        with open("deployment_metrics.json", "w") as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Metrics updated: {self.metrics['checks_performed']} checks, "
                   f"{self.metrics['failures']} failures")
                   
    def _alert_loop(self):
        """Check for alert conditions"""
        consecutive_failures = 0
        
        while self.monitoring:
            current_status = self._get_overall_status()
            
            if current_status == "unhealthy":
                consecutive_failures += 1
                
                if consecutive_failures >= 3:
                    self._send_alert("Deployment unhealthy for 3+ consecutive checks")
                    consecutive_failures = 0  # Reset to avoid spam
            else:
                consecutive_failures = 0
                
            time.sleep(60)  # Check every minute
            
    def _send_alert(self, message: str):
        """Send alert notification"""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "severity": "high"
        }
        
        # Log alert
        logger.warning(f"ALERT: {message}")
        
        # Save to alerts file
        with open("deployment_alerts.jsonl", "a") as f:
            f.write(json.dumps(alert) + "\n")
            
        # Could integrate with external alerting services here
        # (Slack, email, PagerDuty, etc.)
        
    def _get_overall_status(self) -> str:
        """Determine overall deployment status"""
        if not self.metrics["status_history"]:
            return "unknown"
            
        recent_statuses = self.metrics["status_history"][-10:]
        healthy_count = sum(1 for s in recent_statuses if s["status"] == "healthy")
        
        if healthy_count >= 8:
            return "healthy"
        elif healthy_count >= 5:
            return "degraded"
        else:
            return "unhealthy"
            
    def _record_check_result(self, check_name: str, result: Dict[str, Any]):
        """Record health check result"""
        self.metrics["checks_performed"] += 1
        self.metrics["last_check"] = datetime.now().isoformat()
        
        if result.get("status") != "healthy":
            self.metrics["failures"] += 1
            
        # Add to history
        self.metrics["status_history"].append({
            "timestamp": datetime.now().isoformat(),
            "check": check_name,
            "status": result.get("status", "unknown")
        })
        
        # Keep only recent history
        if len(self.metrics["status_history"]) > 100:
            self.metrics["status_history"] = self.metrics["status_history"][-100:]
            
    def _display_dashboard(self):
        """Display monitoring dashboard"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print("=" * 80)
        print("ULTRATHINK DEPLOYMENT MONITOR DASHBOARD")
        print("=" * 80)
        print(f"Started: {self.metrics['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Uptime: {datetime.now() - self.metrics['start_time']}")
        print(f"Status: {self._get_overall_status().upper()}")
        print()
        
        print("HEALTH CHECKS:")
        print("-" * 40)
        
        # Display recent check results
        recent_checks = {}
        for item in reversed(self.metrics["status_history"][-20:]):
            check_name = item["check"]
            if check_name not in recent_checks:
                recent_checks[check_name] = item
                
        for check_name, result in recent_checks.items():
            status_icon = "✅" if result["status"] == "healthy" else "❌"
            print(f"{status_icon} {check_name}: {result['status']}")
            
        print()
        print("METRICS:")
        print("-" * 40)
        print(f"Total Checks: {self.metrics['checks_performed']}")
        print(f"Failures: {self.metrics['failures']}")
        print(f"Success Rate: {(1 - self.metrics['failures']/max(self.metrics['checks_performed'], 1)) * 100:.1f}%")
        
        print()
        print("Press Ctrl+C to stop monitoring")
        

class AutoRecovery:
    """Automated recovery system for deployment issues"""
    
    def __init__(self):
        self.recovery_actions = []
        self._setup_recovery_actions()
        
    def _setup_recovery_actions(self):
        """Configure recovery actions"""
        self.recovery_actions = [
            {
                "condition": "app_not_responding",
                "action": self._restart_deployment,
                "description": "Restart deployment"
            },
            {
                "condition": "high_error_rate",
                "action": self._rollback_deployment,
                "description": "Rollback to previous version"
            },
            {
                "condition": "config_error",
                "action": self._fix_configuration,
                "description": "Fix configuration issues"
            }
        ]
        
    def check_and_recover(self, status: Dict[str, Any]) -> bool:
        """Check status and perform recovery if needed"""
        for action in self.recovery_actions:
            if self._check_condition(action["condition"], status):
                logger.info(f"Triggering recovery: {action['description']}")
                try:
                    result = action["action"]()
                    if result:
                        logger.info(f"Recovery successful: {action['description']}")
                        return True
                    else:
                        logger.error(f"Recovery failed: {action['description']}")
                except Exception as e:
                    logger.error(f"Recovery error: {e}")
                    
        return False
        
    def _check_condition(self, condition: str, status: Dict[str, Any]) -> bool:
        """Check if recovery condition is met"""
        if condition == "app_not_responding":
            return status.get("app_health", {}).get("status") == "unhealthy"
        elif condition == "high_error_rate":
            return status.get("error_rate", 0) > 0.5
        elif condition == "config_error":
            return "configuration" in str(status.get("last_error", "")).lower()
        return False
        
    def _restart_deployment(self) -> bool:
        """Attempt to restart deployment"""
        try:
            if shutil.which("railway"):
                # Restart via Railway CLI
                result = subprocess.run(
                    ["railway", "restart"],
                    capture_output=True,
                    text=True
                )
                return result.returncode == 0
        except:
            pass
        return False
        
    def _rollback_deployment(self) -> bool:
        """Attempt to rollback deployment"""
        # This would integrate with your version control
        # For now, just log the attempt
        logger.info("Rollback requested - manual intervention needed")
        return False
        
    def _fix_configuration(self) -> bool:
        """Attempt to fix configuration issues"""
        # Check for common config problems
        fixes_applied = []
        
        # Check Procfile
        if not Path("Procfile").exists():
            with open("Procfile", "w") as f:
                f.write("web: gunicorn app:app --bind 0.0.0.0:$PORT\n")
            fixes_applied.append("Created missing Procfile")
            
        # Check runtime.txt
        if not Path("runtime.txt").exists():
            with open("runtime.txt", "w") as f:
                f.write("python-3.11.0\n")
            fixes_applied.append("Created missing runtime.txt")
            
        if fixes_applied:
            logger.info(f"Applied fixes: {', '.join(fixes_applied)}")
            return True
            
        return False


def main():
    """Main entry point for monitoring"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Ultrathink Deployment Monitor")
    parser.add_argument("--recovery", action="store_true", help="Enable auto-recovery")
    parser.add_argument("--dashboard", action="store_true", help="Show dashboard (default)")
    parser.add_argument("--quiet", action="store_true", help="Quiet mode (logs only)")
    
    args = parser.parse_args()
    
    monitor = DeploymentMonitor()
    
    if args.recovery:
        recovery = AutoRecovery()
        # Start recovery system
        logger.info("Auto-recovery enabled")
        
    monitor.start_monitoring()


if __name__ == "__main__":
    main()