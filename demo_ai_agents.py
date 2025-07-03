#!/usr/bin/env python3
"""
Interactive Demo of AI Marketing Agents

Run this to see the AI agents in action!
"""
import asyncio
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")


def print_header():
    """Print a fancy header"""
    print("\n" + "="*60)
    print("🚀 AI MARKETING AUTOMATION DEMO")
    print("="*60 + "\n")


def print_agent_message(agent: str, message: str):
    """Print a message from an agent"""
    icons = {
        "supervisor": "🎯",
        "parser": "📊",
        "creative": "🎨",
        "builder": "🏗️",
        "user": "👤"
    }
    icon = icons.get(agent, "🤖")
    print(f"{icon} {agent.upper()}: {message}")


async def demo_workflow():
    """Run an interactive demo"""
    print_header()
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Running in DEMO MODE (no OpenAI API key detected)")
        print("\nTo see real AI agents in action:")
        print("1. Get an API key from https://platform.openai.com")
        print("2. Run: export OPENAI_API_KEY='your-key-here'")
        print("3. Run this demo again\n")
        
        # Run demo simulation
        await run_demo_simulation()
    else:
        print("✅ OpenAI API key detected - Running with REAL AI agents!\n")
        await run_real_ai_demo()


async def run_demo_simulation():
    """Simulate the AI workflow without API calls"""
    print("Let's simulate creating a marketing campaign...\n")
    
    # Get user input
    print_agent_message("user", "I want to promote my new fitness app to young professionals in NYC with $200/day budget")
    
    await asyncio.sleep(1)
    
    # Simulate supervisor
    print_agent_message("supervisor", "I'll help you create that campaign. Let me coordinate our specialist agents...")
    
    await asyncio.sleep(1)
    
    # Simulate parser
    print_agent_message("parser", "Analyzing your request...")
    print("   📍 Location: New York City")
    print("   👥 Target: Young professionals (25-35)")
    print("   💰 Budget: $200/day")
    print("   🎯 Objective: APP_PROMOTION")
    
    await asyncio.sleep(1)
    
    # Simulate creative
    print_agent_message("creative", "Generating compelling ad copy...")
    print("\n   🎨 Ad Creative:")
    print("   Headline: \"Transform Your Fitness Journey\"")
    print("   Text: \"Join 10,000+ NYC professionals already crushing their fitness goals.\"")
    print("   CTA: \"Download Now\"")
    
    await asyncio.sleep(1)
    
    # Simulate builder
    print_agent_message("builder", "Structuring your campaign for Meta Ads...")
    print("\n   📊 Campaign Structure:")
    print("   - 1 Campaign (App Installs)")
    print("   - 2 Ad Sets (A/B test)")
    print("   - 4 Ad Variations")
    print("   - Estimated Reach: 50,000 people")
    print("   - Estimated Installs: 500-750")
    
    await asyncio.sleep(1)
    
    print("\n✨ Campaign ready! In production, this would be sent to Meta Ads API.")


async def run_real_ai_demo():
    """Run the actual AI workflow"""
    from agents.workflow import process_campaign_request
    
    # Example requests
    examples = [
        "I want to promote my new fitness app to young professionals in NYC with $200/day budget",
        "Create Instagram ads for my boutique coffee shop, targeting coffee lovers within 5 miles, $50/day",
        "Launch a B2B campaign for our project management software targeting startup CTOs, $5000/month"
    ]
    
    print("Choose a campaign example or enter your own:\n")
    for i, example in enumerate(examples, 1):
        print(f"{i}. {example}")
    print("4. Enter custom request\n")
    
    choice = input("Your choice (1-4): ").strip()
    
    if choice == "1":
        request = examples[0]
    elif choice == "2":
        request = examples[1]
    elif choice == "3":
        request = examples[2]
    else:
        request = input("\nEnter your campaign request: ").strip()
    
    if not request:
        request = examples[0]
    
    print(f"\n📝 Processing: \"{request}\"\n")
    
    # Track progress
    start_time = datetime.now()
    
    async def progress_callback(update: Dict[str, Any]):
        """Show progress updates"""
        if update.get("agent") and update.get("message"):
            agent = update["agent"]
            message = update["message"].get("content", "")[:100]
            if message:
                print_agent_message(agent, message + "...")
    
    try:
        # Process the request
        result = await process_campaign_request(
            request,
            user_id="demo_user",
            stream_callback=progress_callback
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Display results
        print(f"\n✅ Completed in {execution_time:.2f} seconds!\n")
        
        if result.get("campaign_name"):
            print(f"📋 Campaign: {result['campaign_name']}")
        
        if result.get("campaign_objective"):
            print(f"🎯 Objective: {result['campaign_objective']}")
            
        if result.get("budget"):
            print(f"💰 Budget: ${result['budget']} {result.get('budget_type', 'daily')}")
            
        if result.get("target_audience"):
            audience = result["target_audience"]
            print(f"👥 Audience: Ages {audience.get('age_min')}-{audience.get('age_max')}")
            
        if result.get("ad_creative"):
            creative = result["ad_creative"]
            print(f"\n🎨 Ad Creative:")
            print(f"   Headline: \"{creative.get('headline')}\"")
            print(f"   Text: \"{creative.get('primary_text')}\"")
            print(f"   CTA: {creative.get('cta')}")
            
        print("\n✨ This campaign structure is ready for Meta Ads API!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("The AI agents encountered an issue. This might be due to API limits or network issues.")


async def main():
    """Main entry point"""
    try:
        await demo_workflow()
        
        print("\n" + "="*60)
        print("Want to integrate this into your app?")
        print("- Frontend: The UI is already deployed on Vercel")
        print("- Backend: Follow docs/PYTHON_SERVICE_SETUP.md")
        print("- API: Set OPENAI_API_KEY to enable AI features")
        print("="*60 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n👋 Thanks for trying the demo!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run the demo
    asyncio.run(main())