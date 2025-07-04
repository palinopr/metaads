#!/bin/bash
# Quick deployment status check

echo "🚀 DEPLOYMENT STATUS"
echo "==================="

if [ -f deployment_state.json ]; then
    cat deployment_state.json | python3 -m json.tool 2>/dev/null || cat deployment_state.json
fi

if [ -f monitor.pid ] && ps -p $(cat monitor.pid) > /dev/null 2>&1; then
    echo ""
    echo "✅ Monitor is running (PID: $(cat monitor.pid))"
else
    echo ""
    echo "❌ Monitor is not running"
fi

if [ -f deployment_url.txt ]; then
    echo ""
    echo "🌐 Deployment URL: $(cat deployment_url.txt)"
fi
