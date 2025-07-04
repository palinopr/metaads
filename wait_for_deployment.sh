#!/bin/bash
# Wait for Railway Deployment Script

echo "🧠 ULTRATHINKING DEPLOYMENT WAIT MONITOR"
echo "======================================"
echo ""
echo "I will check your deployment every 30 seconds."
echo "Enter your Railway URL to monitor (or press Ctrl+C to exit):"
echo "Example: https://metaads-ai.railway.app"
read RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "Using example URL for testing: https://metaads-ai.railway.app"
    RAILWAY_URL="https://metaads-ai.railway.app"
fi

echo ""
echo "Monitoring: $RAILWAY_URL"
echo "======================================"

ATTEMPTS=0
MAX_ATTEMPTS=20  # 10 minutes max

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    ATTEMPTS=$((ATTEMPTS + 1))
    echo ""
    echo "Attempt $ATTEMPTS/$MAX_ATTEMPTS - $(date '+%H:%M:%S')"
    
    # Try to connect
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$RAILWAY_URL" 2>/dev/null)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ SUCCESS! Deployment is live!"
        echo ""
        # Get full response
        RESPONSE=$(curl -s "$RAILWAY_URL")
        echo "Response: $RESPONSE"
        echo ""
        echo "======================================"
        echo "🎯 DEPLOYMENT SUCCESSFUL!"
        echo "Next step: Add to Vercel environment:"
        echo "EXTERNAL_API_URL=$RAILWAY_URL"
        echo "======================================"
        exit 0
    elif [ "$HTTP_STATUS" = "000" ]; then
        echo "⏳ Not ready yet (connection failed)..."
    else
        echo "⚠️  Got status $HTTP_STATUS - checking..."
    fi
    
    if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
        echo "Waiting 30 seconds before next check..."
        sleep 30
    fi
done

echo ""
echo "❌ Timeout after 10 minutes"
echo "Check Railway dashboard for errors"