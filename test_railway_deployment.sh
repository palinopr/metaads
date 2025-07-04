#!/bin/bash
# Railway Deployment Test Script

echo "🧠 ULTRATHINKING DEPLOYMENT TEST"
echo "================================"
echo ""
echo "Enter your Railway URL (e.g., https://metaads-ai.railway.app):"
read RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo ""
echo "Testing: $RAILWAY_URL"
echo "--------------------------------"

# Test 1: Basic health check
echo "1. Health Check:"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$RAILWAY_URL")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Status: 200 OK"
    echo "✅ Response: $BODY"
else
    echo "❌ Status: $HTTP_STATUS"
    echo "❌ Response: $BODY"
    exit 1
fi

echo ""
echo "2. API Endpoint Test:"
# Test 2: Campaign creation endpoint
CAMPAIGN_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/api/campaign/create" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create Instagram ads for coffee shop $50/day", "userId": "test"}' \
  -w "\nHTTP_STATUS:%{http_code}")

CAMPAIGN_STATUS=$(echo "$CAMPAIGN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CAMPAIGN_BODY=$(echo "$CAMPAIGN_RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$CAMPAIGN_STATUS" = "200" ]; then
    echo "✅ Campaign API: Working"
    echo "✅ Response preview: $(echo "$CAMPAIGN_BODY" | head -c 100)..."
else
    echo "❌ Campaign API Status: $CAMPAIGN_STATUS"
    echo "❌ Error: $CAMPAIGN_BODY"
fi

echo ""
echo "================================"
echo "DEPLOYMENT STATUS:"
if [ "$HTTP_STATUS" = "200" ] && [ "$CAMPAIGN_STATUS" = "200" ]; then
    echo "🎯 SUCCESS! Your Railway deployment is working!"
    echo ""
    echo "Next step: Add this URL to Vercel:"
    echo "EXTERNAL_API_URL=$RAILWAY_URL"
else
    echo "❌ FAILED - Check Railway logs for details"
fi
echo "================================"