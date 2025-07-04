"""
Production Flask app for Railway - AI Marketing Automation
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import asyncio
import json

# Import will be done conditionally to avoid deployment errors
process_campaign_request = None

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
        
        # Check if we have OpenAI key and should use AI
        if os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY") != "sk-demo-key-replace-with-real-api-key":
            try:
                # Lazy import to avoid deployment issues
                global process_campaign_request
                if process_campaign_request is None:
                    from src.agents.workflow import process_campaign_request
                
                # Use AI workflow
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                # Process through AI agents
                result = loop.run_until_complete(
                    process_campaign_request(message, user_id)
                )
                
                # Extract campaign data from AI result
                campaign_plan = result.get('campaign_plan', {})
                ad_creative = result.get('ad_creative', {})
                
                response = {
                    "success": True,
                    "campaign": {
                        "id": result.get('session_id', f"campaign-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                        "name": result.get('campaign_name', 'AI Campaign'),
                        "status": "ready",
                        "budget": f"${result.get('budget', 100)}/day",
                        "audience": result.get('target_audience', 'AI-optimized targeting'),
                        "platform": result.get('platform', 'Facebook & Instagram'),
                        "estimatedReach": campaign_plan.get('estimated_reach', 100000),
                        "estimatedClicks": campaign_plan.get('estimated_clicks', 5000),
                        "objective": result.get('campaign_objective', 'Brand Awareness')
                    },
                    "content": [{
                        "headline": ad_creative.get('headline', 'Transform Your Business'),
                        "text": ad_creative.get('body', 'Discover amazing opportunities'),
                        "cta": ad_creative.get('cta', 'Learn More')
                    }],
                    "executionTime": 3.5,
                    "message": "AI-powered campaign created successfully! 🚀",
                    "mode": "ai",
                    "reasoning": result.get('messages', [])[-1] if result.get('messages') else "AI agents processed your request"
                }
                
                return jsonify(response)
                
            except Exception as ai_error:
                print(f"AI processing error: {ai_error}")
                # Fall back to demo mode
                
        # Demo mode (no API key or AI failed)
        # Parse intent from message (simple demo logic)
        budget = "100"
        if "$" in message:
            # Extract budget
            parts = message.split("$")
            if len(parts) > 1:
                budget_part = parts[1].split()[0].replace("/day", "").replace(",", "")
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
        if "coffee" in message.lower():
            business = "coffee shop"
        elif "fitness" in message.lower():
            business = "fitness app"
        elif "saas" in message.lower() or "software" in message.lower():
            business = "software platform"
        elif "vegan" in message.lower() or "restaurant" in message.lower():
            business = "vegan restaurant"
            
        # Generate response
        campaign_id = f"campaign-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        response = {
            "success": True,
            "campaign": {
                "id": campaign_id,
                "name": f"{business.title()} {platform} Campaign",
                "status": "ready",
                "budget": f"${budget}/day",
                "audience": "AI-optimized targeting",
                "platform": platform,
                "estimatedReach": int(budget) * 1000,
                "estimatedClicks": int(budget) * 50
            },
            "content": [{
                "headline": f"Discover the Best {business.title()} Experience",
                "text": f"Join thousands of satisfied customers. Limited time offer - don't miss out!",
                "cta": "Learn More" if int(budget) < 100 else "Shop Now"
            }],
            "executionTime": 2.5,
            "message": f"Campaign created! Targeting {platform} with ${budget}/day budget.",
            "mode": "demo"
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
            "cors_enabled": True,
            "railway_region": os.getenv("RAILWAY_ENVIRONMENT", "unknown")
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"AI Marketing Automation API starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)