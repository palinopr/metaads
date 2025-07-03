"""
Vercel Python Function for Campaign Creation
"""
import json
import os
import sys

# Simple demo response for MVP
def handler(request, response):
    """
    Vercel Python handler for campaign creation
    """
    # Handle CORS
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if request.method == 'OPTIONS':
        response.status_code = 200
        return response
    
    if request.method != 'POST':
        response.status_code = 405
        return {'error': 'Method not allowed'}
    
    try:
        # Get request data
        data = json.loads(request.body)
        message = data.get('message', '')
        user_id = data.get('userId', 'web_user')
        
        if not message:
            response.status_code = 400
            return {'error': 'Message is required'}
        
        # For now, always return demo response
        # In production, this would call our AI agents
        demo_response = {
            "success": True,
            "campaign": {
                "id": "campaign-py-demo",
                "name": "AI Marketing Campaign (Python)",
                "status": "ready",
                "budget": "$100/day",
                "audience": "AI-optimized targeting"
            },
            "content": [{
                "headline": "Transform Your Business",
                "text": "AI-powered marketing that delivers results",
                "cta": "Get Started"
            }],
            "executionTime": 1.5,
            "message": "Campaign created via Python! 🐍"
        }
        
        response.status_code = 200
        return demo_response
        
    except Exception as e:
        response.status_code = 500
        return {
            'error': 'Failed to process request',
            'details': str(e)
        }