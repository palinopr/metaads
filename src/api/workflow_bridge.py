#!/usr/bin/env python3
"""
Workflow Bridge - Connects Next.js API to our Python agents

CEO Note: This is the bridge between worlds. Keep it simple and fast.
"""

import sys
import json
import asyncio
import argparse
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from workflows.complete_campaign_workflow import create_campaign_magic


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", required=True, help="User campaign request")
    parser.add_argument("--user_id", default="web_user", help="User ID")
    args = parser.parse_args()
    
    try:
        # Execute workflow
        result = await create_campaign_magic(
            user_request=args.message,
            user_id=args.user_id
        )
        
        # Extract key data for frontend
        output = {
            "success": True,
            "campaign": {
                "id": result.get("campaign_id", f"camp_{int(asyncio.get_event_loop().time())}"),
                "name": result.get("campaign_config", {}).get("campaign", {}).get("name", "New Campaign"),
                "status": result.get("workflow_status", "completed"),
                "config": result.get("campaign_config", {}),
            },
            "content": [
                {
                    "id": var.get("variation_id", f"var_{i}"),
                    "headline": var.get("base", {}).get("headline", ""),
                    "text": var.get("base", {}).get("primary_text", ""),
                    "cta": var.get("base", {}).get("call_to_action", "Learn More")
                }
                for i, var in enumerate(result.get("generated_content", [])[:3])
            ],
            "executionTime": result.get("success_metrics", {}).get("workflow_completion_time", "Unknown"),
            "metrics": result.get("success_metrics", {}),
            "nextSteps": result.get("next_steps", [])
        }
        
        # Output JSON to stdout
        print(json.dumps(output))
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "campaign": None,
            "content": []
        }
        print(json.dumps(error_output))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())