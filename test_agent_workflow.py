#!/usr/bin/env python3
"""
Test the AI agent workflow end-to-end
"""
import asyncio
import json
import os
import sys
from datetime import datetime

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from agents.workflow import process_campaign_request


async def test_workflow():
    """Test the complete AI workflow"""
    print("🚀 Testing AI Marketing Automation Workflow\n")
    
    # Test cases
    test_requests = [
        {
            "name": "E-commerce Campaign",
            "request": "I want to promote my new fitness app to millennials in California with a $5000 monthly budget. Focus on Instagram and Facebook."
        },
        {
            "name": "Local Business",
            "request": "Create a campaign for my coffee shop targeting people within 5 miles who love coffee. Budget is $50 per day."
        },
        {
            "name": "B2B Software",
            "request": "Launch awareness campaign for our project management tool targeting startup founders and CTOs. $10k budget for 30 days."
        }
    ]
    
    # Check if we have OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  No OPENAI_API_KEY found. Running in demo mode.\n")
        print("To test with real AI agents:")
        print("1. Get an OpenAI API key from https://platform.openai.com")
        print("2. Set it in your environment: export OPENAI_API_KEY='your-key-here'")
        print("3. Run this test again\n")
        
        # Demo mode - show what would happen
        for test in test_requests:
            print(f"📝 {test['name']}")
            print(f"   Request: \"{test['request']}\"")
            print(f"   Status: Would process through Parser → Creative → Builder agents")
            print(f"   Result: AI-optimized campaign ready for Meta Ads\n")
        
        return
    
    # Process each test request
    for test in test_requests:
        print(f"📝 Testing: {test['name']}")
        print(f"   Request: \"{test['request']}\"\n")
        
        try:
            # Track progress
            progress_messages = []
            
            async def progress_callback(update):
                """Callback to show progress"""
                if update.get("message"):
                    progress_messages.append(update["message"])
                    print(f"   → {update['agent']}: {update['message']['content'][:100]}...")
            
            # Process the request
            start_time = datetime.now()
            result = await process_campaign_request(
                test["request"],
                user_id="test_user",
                stream_callback=progress_callback
            )
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Display results
            print(f"\n   ✅ Completed in {execution_time:.2f} seconds")
            
            if result.get("campaign_objective"):
                print(f"   📊 Campaign Details:")
                print(f"      - Objective: {result.get('campaign_objective')}")
                print(f"      - Budget: ${result.get('budget')} {result.get('budget_type', 'daily')}")
                print(f"      - Duration: {result.get('duration_days', 30)} days")
                
                if result.get("target_audience"):
                    audience = result["target_audience"]
                    print(f"      - Target: Ages {audience.get('age_min')}-{audience.get('age_max')}")
                    if audience.get("interests"):
                        print(f"      - Interests: {', '.join(audience['interests'][:3])}")
                
                if result.get("ad_creative"):
                    creative = result["ad_creative"]
                    print(f"\n   🎨 Ad Creative:")
                    print(f"      Headline: \"{creative.get('headline')}\"")
                    print(f"      CTA: {creative.get('cta')}")
            
            if result.get("errors"):
                print(f"\n   ⚠️  Errors: {', '.join(result['errors'])}")
            
            print("\n" + "="*60 + "\n")
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
            import traceback
            traceback.print_exc()


async def test_api_bridge():
    """Test the API bridge that Next.js uses"""
    print("\n🔌 Testing API Bridge (Next.js → Python)\n")
    
    # Simulate what Next.js does
    from agents.api_bridge import main
    
    # Mock the command line args
    test_message = "Create a campaign for my online course about Python programming. $100 daily budget."
    original_argv = sys.argv
    sys.argv = ["api_bridge.py", "--message", test_message, "--user_id", "nextjs_user"]
    
    try:
        # Capture output
        import io
        from contextlib import redirect_stdout
        
        output = io.StringIO()
        with redirect_stdout(output):
            await main()
        
        # Parse the JSON response
        response = json.loads(output.getvalue())
        
        if response.get("success"):
            print("✅ API Bridge working correctly!")
            print(f"   Campaign ID: {response['campaign']['id']}")
            print(f"   Execution Time: {response['executionTime']:.2f}s")
        else:
            print(f"❌ API Bridge error: {response.get('error')}")
            
    except Exception as e:
        print(f"❌ API Bridge test failed: {str(e)}")
    finally:
        sys.argv = original_argv


async def main():
    """Run all tests"""
    # Test the workflow
    await test_workflow()
    
    # Test the API bridge
    await test_api_bridge()
    
    print("\n✨ Testing complete!")
    print("\nNext steps:")
    print("1. Set OPENAI_API_KEY to test with real AI")
    print("2. Deploy the Python service to handle production requests")
    print("3. Connect Meta Ads API for actual campaign creation")


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run tests
    asyncio.run(main())