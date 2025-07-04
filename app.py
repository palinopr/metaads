"""
Simple Flask app for Railway - AI Marketing Automation
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
# Enable CORS for Vercel frontend
CORS(app, origins=["https://metaads.vercel.app", "https://metaads-peach.vercel.app", "https://metaads-ai-new.vercel.app", "http://localhost:3000"])

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "AI Marketing Automation API",
        "version": "1.0.0",
        "endpoints": {
            "/": "Health check",
            "/api/campaign/create": "Create AI campaign (POST)",
            "/api/health": "Detailed health status"
        }
    })

@app.route('/api/campaign/create', methods=['POST', 'OPTIONS'])
def create_campaign():
    """Create campaign endpoint - matches Next.js API"""
    if request.method == 'OPTIONS':
        # Handle preflight
        return '', 204
        
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('userId', 'web_user')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        # Check if we have OpenAI key
        has_real_key = os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY") != "sk-demo-key-replace-with-real-api-key"
        
        # For now, enhanced demo mode (AI integration coming next)
        # Parse intent from message
        budget = "100"
        if "$" in message:
            parts = message.split("$")
            if len(parts) > 1:
                budget_part = parts[1].split()[0].replace("/day", "").replace("/month", "").replace(",", "")
                try:
                    budget = str(int(float(budget_part)))
                except:
                    budget = "100"
        
        platform = "Facebook & Instagram"
        if "instagram" in message.lower():
            platform = "Instagram"
        elif "facebook" in message.lower():
            platform = "Facebook"
        elif "tiktok" in message.lower():
            platform = "TikTok"
            
        business = "your business"
        if "vegan" in message.lower() and "restaurant" in message.lower():
            business = "vegan restaurant"
        elif "coffee" in message.lower():
            business = "coffee shop"
        elif "fitness" in message.lower():
            business = "fitness app"
        elif "saas" in message.lower() or "software" in message.lower():
            business = "software platform"
            
        # Extract location if mentioned
        location = ""
        if "brooklyn" in message.lower():
            location = "Brooklyn"
        elif "manhattan" in message.lower():
            location = "Manhattan"
        elif "california" in message.lower():
            location = "California"
            
        # Generate response
        campaign_id = f"campaign-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        response = {
            "success": True,
            "campaign": {
                "id": campaign_id,
                "name": f"{business.title()} {platform} Campaign" + (f" - {location}" if location else ""),
                "status": "ready",
                "budget": f"${budget}/day",
                "audience": f"{location} health-conscious millennials" if location and "vegan" in message.lower() else "AI-optimized targeting",
                "platform": platform,
                "estimatedReach": int(budget) * 1000,
                "estimatedClicks": int(budget) * 50
            },
            "content": [{
                "headline": f"Brooklyn's Best {business.title()}" if location == "Brooklyn" else f"Discover the Best {business.title()} Experience",
                "text": "Fresh, local, and loved by millennials!" if "vegan" in message.lower() else f"Join thousands of satisfied customers. Limited time offer!",
                "cta": "Reserve Now" if "restaurant" in message.lower() else "Learn More"
            }],
            "executionTime": 2.5,
            "message": f"Campaign created! Targeting {platform} with ${budget}/day budget.",
            "mode": "ai-ready" if has_real_key else "demo",
            "ai_status": "ready" if has_real_key else "waiting for real API key"
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            "error": "Failed to create campaign",
            "details": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Detailed health check"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": {
            "python_version": "3.11",
            "has_openai_key": bool(os.getenv("OPENAI_API_KEY")),
            "openai_key_valid": os.getenv("OPENAI_API_KEY") != "sk-demo-key-replace-with-real-api-key" if os.getenv("OPENAI_API_KEY") else False,
            "cors_enabled": True,
            "railway_region": os.getenv("RAILWAY_ENVIRONMENT", "unknown")
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"AI Marketing Automation API starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)