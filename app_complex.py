"""
Flask app for Railway deployment of AI Marketing Agents
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Try to import our workflow
try:
    from agents.workflow import process_campaign_request
    import asyncio
    AGENTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import agents: {e}")
    AGENTS_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "AI Marketing Automation",
        "agents_available": AGENTS_AVAILABLE,
        "version": "1.0.0"
    })

@app.route('/api/campaign/create', methods=['POST'])
def create_campaign():
    """Create campaign endpoint matching Vercel API"""
    try:
        data = request.json
        message = data.get('message')
        user_id = data.get('userId', 'web_user')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        # Check for AI capability
        if not AGENTS_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
            # Return demo response
            return jsonify({
                "success": True,
                "campaign": {
                    "id": "campaign-demo-railway",
                    "name": "AI Marketing Campaign",
                    "status": "ready",
                    "budget": "$100/day",
                    "audience": "Optimized targeting"
                },
                "content": [{
                    "headline": "Transform Your Business with AI",
                    "text": "Join thousands of businesses already seeing 5x ROI",
                    "cta": "Get Started"
                }],
                "executionTime": 2.5,
                "message": "Campaign created successfully! 🚀 (Demo mode - add OPENAI_API_KEY for real AI)"
            })
        
        # Run the actual workflow
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            start_time = datetime.now()
            result = loop.run_until_complete(
                process_campaign_request(message, user_id)
            )
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Format response to match frontend expectations
            response = {
                "success": True,
                "campaign": {
                    "id": f"campaign-{result.get('session_id', '')[:8]}",
                    "name": result.get("campaign_name", "AI Campaign"),
                    "status": "ready",
                    "budget": f"${result.get('budget', 100)}/{result.get('budget_type', 'day')}",
                    "audience": f"{result.get('target_audience', {}).get('age_min', 18)}-{result.get('target_audience', {}).get('age_max', 65)}"
                },
                "content": [{
                    "headline": result.get("ad_creative", {}).get("headline", "Amazing Offer"),
                    "text": result.get("ad_creative", {}).get("primary_text", "Don't miss out!"),
                    "cta": result.get("ad_creative", {}).get("cta", "Learn More")
                }],
                "executionTime": execution_time,
                "message": "Campaign created with AI optimization! 🚀"
            }
            
            return jsonify(response)
            
        finally:
            loop.close()
            
    except Exception as e:
        return jsonify({
            "error": "Failed to create campaign",
            "details": str(e),
            "agents_available": AGENTS_AVAILABLE
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Detailed health check"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": {
            "python_version": sys.version,
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "agents_available": AGENTS_AVAILABLE
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port)