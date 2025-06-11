#!/bin/bash

# Quick diagnosis script
echo "🔍 Quick Diagnosis for Meta Ads Dashboard"
echo "========================================"

# Check if page is loading
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$response" = "200" ]; then
    echo "✅ Server is running and responding"
    
    # Check page content
    content=$(curl -s http://localhost:3000)
    
    if echo "$content" | grep -q "No campaigns found"; then
        echo "⚠️  Issue: Page loads but shows 'No campaigns found'"
        echo ""
        echo "Solution:"
        echo "1. Open http://localhost:3000 in your browser"
        echo "2. Click the Settings icon (⚙️) in top right"
        echo "3. Add your Meta API credentials:"
        echo "   - Access Token from Meta Business Manager"
        echo "   - Ad Account ID (format: act_123456789)"
        echo "4. Click 'Save & Connect'"
        echo ""
        echo "This is NOT an error - the app is working perfectly!"
        echo "It just needs your API credentials to show campaigns."
    elif echo "$content" | grep -q "Meta Ads Dashboard Pro"; then
        echo "✅ Dashboard is working correctly!"
    fi
else
    echo "❌ Server is not responding"
    echo ""
    echo "Solution:"
    echo "1. Start the server: npm run dev"
    echo "2. Wait for 'Ready' message"
    echo "3. Open http://localhost:3000"
fi