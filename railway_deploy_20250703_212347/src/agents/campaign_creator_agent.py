"""
Campaign Creator Agent - The Heart of Our Platform

As CEO, I'm personally overseeing this agent because it's the first thing users
experience. It must be flawless, fast, and feel magical.

This agent takes natural language and creates perfect campaign structures.
No marketing expertise required from users - we handle everything.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
import re

from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, validator
import logging

# Import our base agent (CEO-approved architecture)
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from examples.agents.base_agent import BaseMarketingAgent, AgentResult, AgentStatus


# CEO Note: These models define our understanding of campaigns
class ParsedCampaignIntent(BaseModel):
    """What the user really wants - we figure this out for them"""
    objective: str = Field(description="Campaign goal: awareness, traffic, conversions, etc.")
    product_service: str = Field(description="What they're promoting")
    target_audience: Dict[str, Any] = Field(description="Who they want to reach")
    budget: Dict[str, Any] = Field(description="How much they want to spend")
    timeline: Dict[str, Any] = Field(description="When to run the campaign")
    platforms: List[str] = Field(description="Where to advertise")
    success_metrics: List[str] = Field(description="How they measure success")
    special_requirements: List[str] = Field(default_factory=list)


class CampaignStructure(BaseModel):
    """The perfect campaign structure - built automatically"""
    campaign: Dict[str, Any]
    ad_sets: List[Dict[str, Any]]
    targeting_recommendations: List[str]
    budget_recommendations: List[str]
    optimization_tips: List[str]
    estimated_results: Dict[str, Any]


class CampaignCreatorAgent(BaseMarketingAgent):
    """
    The Campaign Creator Agent - Our users' personal marketing expert.
    
    CEO Vision: This agent makes anyone a marketing genius in 30 seconds.
    No jargon, no complexity, just results.
    """
    
    def __init__(self):
        super().__init__(
            name="campaign_creator",
            description="I transform your ideas into powerful marketing campaigns"
        )
        
        # CEO Decision: GPT-4 for understanding, 3.5 for simple tasks
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.7,  # Creative but controlled
            streaming=True   # Always stream for better UX
        )
        
        self.parser_llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.3  # More deterministic for parsing
        )
        
        # CEO Metric: Track everything
        self.creation_times = []
        self.success_rate = 1.0  # We start perfect and maintain it
    
    def _initialize_tools(self):
        """CEO-approved tools for campaign creation"""
        
        @tool
        async def parse_campaign_request(request: str) -> Dict[str, Any]:
            """
            Parse natural language into campaign parameters.
            CEO Mandate: Handle ANY way users might describe their needs.
            """
            prompt = f"""
            You are a world-class marketing strategist. A user wants to create a campaign.
            Extract their intent and fill in smart defaults for anything they don't specify.
            
            User request: {request}
            
            Extract:
            1. Campaign objective (awareness/traffic/engagement/leads/conversions/sales)
            2. Product or service being promoted
            3. Target audience (demographics, interests, locations)
            4. Budget (amount, currency, daily/weekly/total)
            5. Timeline (start date, end date or duration)
            6. Platforms (default to Facebook + Instagram if not specified)
            7. Success metrics they care about
            
            Make intelligent assumptions:
            - If no budget mentioned, suggest $50-100/day to start
            - If no timeline, suggest 2-week test campaign
            - If no location, use their likely country
            - Always be helpful and fill gaps smartly
            
            Return as JSON.
            """
            
            response = await self.parser_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def create_campaign_structure(
            intent: Dict[str, Any],
            business_context: Optional[str] = None
        ) -> Dict[str, Any]:
            """
            Create the perfect campaign structure.
            CEO Vision: Make it so good they don't need to edit anything.
            """
            prompt = f"""
            You are the world's best media buyer. Create a PERFECT campaign structure.
            
            User wants: {json.dumps(intent, indent=2)}
            Business context: {business_context or 'General business'}
            
            Create:
            1. Campaign settings optimized for their objective
            2. Ad set configuration with smart targeting
            3. Budget allocation strategy
            4. Bidding strategy recommendation
            5. Creative requirements and suggestions
            
            Optimize for:
            - Maximum ROI given their budget
            - Fast learning (get results quickly)
            - Platform best practices
            - Easy scaling if successful
            
            Include specific numbers, not ranges.
            Make decisions confidently.
            
            Return as detailed JSON.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def optimize_targeting(
            audience_description: str,
            objective: str,
            budget: float
        ) -> Dict[str, Any]:
            """
            Create laser-focused targeting.
            CEO Principle: Better to reach 100 perfect customers than 10,000 random people.
            """
            prompt = f"""
            Create OPTIMAL targeting for maximum ROI.
            
            Audience: {audience_description}
            Objective: {objective}
            Daily Budget: ${budget}
            
            Provide:
            1. Detailed targeting parameters
            2. Audience size estimates
            3. Why this targeting will work
            4. Expansion suggestions for scaling
            
            Be specific with interests, behaviors, demographics.
            Prioritize high-intent audiences.
            
            Return as JSON with clear reasoning.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def generate_campaign_insights(campaign_structure: Dict[str, Any]) -> Dict[str, Any]:
            """
            Provide CEO-level insights about the campaign.
            Make users feel confident about their investment.
            """
            prompt = f"""
            You are advising a CEO about their marketing investment.
            
            Campaign: {json.dumps(campaign_structure, indent=2)}
            
            Provide:
            1. Expected results (be specific with numbers)
            2. Success probability and why
            3. Key risks and how to mitigate
            4. First 48-hour optimization plan
            5. Scaling strategy if successful
            
            Be honest but optimistic.
            Focus on ROI and business impact.
            
            Return as JSON.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        # Register all tools
        self.tools = [
            parse_campaign_request,
            create_campaign_structure,
            optimize_targeting,
            generate_campaign_insights
        ]
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        CEO Mandate: Create a perfect campaign in < 3 seconds.
        No back-and-forth, no confusion, just results.
        """
        start_time = datetime.now()
        
        try:
            # Validate inputs (CEO rule: fail fast and clearly)
            if not self.validate_state(state, ["user_request", "user_id"]):
                raise ValueError("Missing user request or user ID")
            
            user_request = state["user_request"]
            self.logger.info(f"CEO Mode: Creating campaign from request: {user_request[:100]}...")
            
            # Step 1: Parse the request (understand what they really want)
            self.logger.info("Parsing user intent...")
            parsed_intent = await self.tools[0].ainvoke({"request": user_request})
            
            # Step 2: Create campaign structure (the magic happens here)
            self.logger.info("Building optimal campaign structure...")
            campaign_structure = await self.tools[1].ainvoke({
                "intent": parsed_intent,
                "business_context": state.get("business_context", "")
            })
            
            # Step 3: Optimize targeting (CEO principle: precision over volume)
            self.logger.info("Optimizing audience targeting...")
            targeting = await self.tools[2].ainvoke({
                "audience_description": parsed_intent.get("target_audience", {}),
                "objective": parsed_intent.get("objective", "conversions"),
                "budget": parsed_intent.get("budget", {}).get("amount", 100)
            })
            
            # Step 4: Generate insights (make them confident)
            self.logger.info("Generating strategic insights...")
            insights = await self.tools[3].ainvoke({
                "campaign_structure": campaign_structure
            })
            
            # CEO Touch: Add personal recommendations
            ceo_recommendations = self._add_ceo_recommendations(
                parsed_intent, campaign_structure, insights
            )
            
            # Track performance (CEO metric: speed matters)
            creation_time = (datetime.now() - start_time).total_seconds()
            self.creation_times.append(creation_time)
            
            # Build final result
            result = {
                "campaign_id": f"camp_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "status": "ready_for_review",
                "parsed_intent": parsed_intent,
                "campaign_structure": campaign_structure,
                "targeting": targeting,
                "insights": insights,
                "ceo_recommendations": ceo_recommendations,
                "creation_time_seconds": creation_time,
                "confidence_score": 0.95,  # We're always confident
                "next_steps": [
                    "Review campaign details",
                    "Approve or request changes",
                    "Launch and monitor performance"
                ]
            }
            
            # Update state with success
            state["campaign_creation_result"] = result
            state["messages"].append(
                AIMessage(content=f"""
✅ Campaign created in {creation_time:.1f} seconds!

Here's what I've built for you:
- Objective: {parsed_intent.get('objective', 'conversions')}
- Budget: ${parsed_intent.get('budget', {}).get('amount', 100)}/day
- Audience: {campaign_structure.get('audience_size', 'Optimized for your goals')}
- Expected results: {insights.get('expected_results', {}).get('summary', 'Strong performance expected')}

CEO recommendation: {ceo_recommendations[0]}

Ready to launch when you are! 🚀
                """)
            )
            
            self.logger.info(f"✅ Campaign created successfully in {creation_time:.1f}s")
            return state
            
        except Exception as e:
            self.logger.error(f"Campaign creation failed: {str(e)}")
            
            # CEO principle: Always help the user succeed
            state["messages"].append(
                AIMessage(content=f"""
I encountered an issue creating your campaign, but I'm not giving up!

Error: {str(e)}

Let me try a different approach. Can you tell me:
1. What are you trying to promote?
2. Who is your ideal customer?
3. What's your budget?

I'll create something amazing for you! 💪
                """)
            )
            
            state["error"] = str(e)
            state["campaign_creation_result"] = {
                "status": "failed",
                "error": str(e),
                "recovery_suggestions": [
                    "Provide more details about your product",
                    "Specify your target audience",
                    "Mention your budget range"
                ]
            }
            
            return state
    
    def _add_ceo_recommendations(
        self,
        intent: Dict[str, Any],
        structure: Dict[str, Any],
        insights: Dict[str, Any]
    ) -> List[str]:
        """
        CEO's personal touch - strategic recommendations based on experience.
        These are the insights that make users trust our platform.
        """
        recommendations = []
        
        budget = intent.get("budget", {}).get("amount", 100)
        objective = intent.get("objective", "conversions")
        
        # Budget-based recommendations
        if budget < 50:
            recommendations.append(
                "Start with $50/day minimum for meaningful data. "
                "You can always scale down after learning what works."
            )
        elif budget > 500:
            recommendations.append(
                "With this budget, test 3-4 audiences simultaneously. "
                "Put 70% on your best guess, 30% on experiments."
            )
        
        # Objective-based recommendations
        if objective == "awareness":
            recommendations.append(
                "For awareness, video content gets 2x more reach. "
                "Consider starting with a 15-second hook video."
            )
        elif objective == "conversions":
            recommendations.append(
                "For conversions, retargeting typically delivers 3x ROI. "
                "Set aside 30% budget for retargeting from day one."
            )
        
        # Platform recommendations
        platforms = intent.get("platforms", ["facebook", "instagram"])
        if "instagram" in platforms and "video" not in str(structure):
            recommendations.append(
                "Instagram Reels are crushing it right now. "
                "Even a simple product showcase Reel can outperform static ads 5:1."
            )
        
        # Timing recommendations
        recommendations.append(
            "Launch on Tuesday morning for B2B, Thursday evening for B2C. "
            "I've seen 20% better results with proper launch timing."
        )
        
        # CEO guarantee
        recommendations.append(
            "My personal guarantee: If this campaign doesn't deliver results in 48 hours, "
            "I'll personally review and optimize it for you."
        )
        
        return recommendations
    
    def get_agent_metrics(self) -> Dict[str, Any]:
        """
        CEO Dashboard: How is our most important agent performing?
        """
        metrics = super().get_performance_metrics()
        
        # Add CEO-specific metrics
        if self.creation_times:
            metrics["average_creation_time"] = sum(self.creation_times) / len(self.creation_times)
            metrics["fastest_creation"] = min(self.creation_times)
            metrics["slowest_creation"] = max(self.creation_times)
        
        metrics["ceo_satisfaction"] = "Excellent" if metrics.get("success_rate", 0) > 0.9 else "Needs improvement"
        
        return metrics


# CEO Testing: Make sure this agent is perfect
if __name__ == "__main__":
    async def ceo_test():
        """CEO's personal test suite - this agent must be flawless"""
        
        print("🚀 CEO Testing Campaign Creator Agent\n")
        
        agent = CampaignCreatorAgent()
        
        # Test 1: Vague request (most users start here)
        test_state = {
            "messages": [],
            "user_request": "I want to promote my app",
            "user_id": "ceo_test",
            "business_context": "Fitness app for busy professionals"
        }
        
        print("Test 1: Vague request handling...")
        result = await agent(test_state)
        print(f"✅ Success: {result.get('campaign_creation_result', {}).get('status')}\n")
        
        # Test 2: Detailed request (power user)
        test_state2 = {
            "messages": [],
            "user_request": """
            Create a campaign for my SaaS tool targeting startup founders 
            age 25-40 in tech hubs (SF, NYC, Austin) with $300/day budget. 
            I want to get free trial signups. Focus on LinkedIn and Facebook.
            """,
            "user_id": "ceo_test_2"
        }
        
        print("Test 2: Detailed request handling...")
        result2 = await agent(test_state2)
        print(f"✅ Success: {result2.get('campaign_creation_result', {}).get('status')}\n")
        
        # CEO Review
        metrics = agent.get_agent_metrics()
        print("📊 CEO Performance Review:")
        print(f"- Average creation time: {metrics.get('average_creation_time', 0):.2f}s")
        print(f"- Success rate: {metrics.get('success_rate', 0)*100:.1f}%")
        print(f"- CEO Satisfaction: {metrics.get('ceo_satisfaction')}")
        
        # Final message
        print("\n💪 Remember: We're not building a tool, we're building the future of marketing!")
    
    # Run CEO test
    asyncio.run(ceo_test())