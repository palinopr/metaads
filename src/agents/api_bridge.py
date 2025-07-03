#!/usr/bin/env python3
"""
API Bridge for Next.js to Python Workflow
"""
import asyncio
import json
import sys
from datetime import datetime
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.workflow import process_campaign_request


async def main():
    """
    Process campaign request from command line arguments
    """
    # In production, use proper argument parsing
    # For MVP, quick extraction
    message = None
    user_id = None
    
    # Parse arguments
    args = sys.argv[1:]
    for i in range(0, len(args), 2):
        if args[i] == "--message" and i + 1 < len(args):
            message = args[i + 1]
        elif args[i] == "--user_id" and i + 1 < len(args):
            user_id = args[i + 1]
    
    if not message:
        print(json.dumps({"error": "No message provided"}))
        sys.exit(1)
    
    try:
        # Process through workflow
        start_time = datetime.now()
        result = await process_campaign_request(message, user_id)
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Format response for frontend
        response = {
            "success": True,
            "sessionId": result.get("session_id"),
            "campaign": {
                "id": f"campaign-{result.get('session_id', '')[:8]}",
                "name": result.get("campaign_name", "AI Campaign"),
                "status": "draft",
                "objective": result.get("campaign_objective"),
                "budget": result.get("budget"),
                "budgetType": result.get("budget_type", "daily"),
                "estimatedReach": result.get("estimated_reach", 0),
                "estimatedClicks": result.get("estimated_clicks", 0),
                "estimatedConversions": result.get("estimated_conversions", 0),
            },
            "creative": result.get("ad_creative", {}),
            "messages": result.get("messages", []),
            "executionTime": execution_time,
            "errors": result.get("errors", []),
            "warnings": result.get("warnings", [])
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        error_response = {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_response))
        sys.exit(1)


if __name__ == "__main__":
    # Check if we have OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        # For demo, return mock data
        mock_response = {
            "success": True,
            "sessionId": "demo-session",
            "campaign": {
                "id": "campaign-demo123",
                "name": "AI Marketing Campaign",
                "status": "draft",
                "objective": "TRAFFIC",
                "budget": 100,
                "budgetType": "daily",
                "estimatedReach": 10000,
                "estimatedClicks": 500,
                "estimatedConversions": 50,
            },
            "creative": {
                "headline": "Discover the Future of Marketing",
                "primaryText": "AI-powered campaigns that deliver 5x better results. Join thousands of successful businesses.",
                "cta": "LEARN_MORE"
            },
            "messages": [
                {
                    "role": "assistant",
                    "content": "I've analyzed your request and created a high-performance campaign optimized for your goals!"
                }
            ],
            "executionTime": 2.5,
            "errors": [],
            "warnings": []
        }
        print(json.dumps(mock_response))
    else:
        # Run actual workflow
        asyncio.run(main())