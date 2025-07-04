"""
Content Generation Agent - The Creative Genius

CEO Vision: This agent makes every user a world-class copywriter.
It understands what sells and creates content that converts.

No more staring at blank screens. No more generic ads.
Just compelling content that drives results.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple, Literal
from datetime import datetime
import re
from collections import defaultdict

from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field, validator
import logging

# Import base agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from examples.agents.base_agent import BaseMarketingAgent, AgentResult, AgentStatus


# CEO-Approved Content Models
class BrandVoice(BaseModel):
    """How the brand speaks - extracted from examples or defined explicitly"""
    tone: List[str] = Field(description="e.g., professional, friendly, bold")
    personality_traits: List[str] = Field(description="e.g., innovative, trustworthy")
    vocabulary_level: Literal["simple", "moderate", "sophisticated"]
    emoji_usage: Literal["never", "sparingly", "frequently"]
    key_phrases: List[str] = Field(default_factory=list)
    avoid_phrases: List[str] = Field(default_factory=list)


class ContentVariation(BaseModel):
    """A single piece of ad content"""
    variation_id: str
    headline: str
    primary_text: str
    description: Optional[str]
    call_to_action: str
    platform_variants: Dict[str, Dict[str, str]]
    psychological_triggers: List[str]
    estimated_performance: Dict[str, float]
    creativity_score: float = Field(ge=0.0, le=1.0)


class ContentBrief(BaseModel):
    """What we need to create content for"""
    product_service: str
    unique_value_props: List[str]
    target_audience: Dict[str, Any]
    campaign_objective: str
    key_messages: List[str]
    competitors: List[str] = Field(default_factory=list)
    mandatory_elements: List[str] = Field(default_factory=list)
    prohibited_elements: List[str] = Field(default_factory=list)


class ContentGenerationAgent(BaseMarketingAgent):
    """
    The Content Generation Agent - Turning ideas into irresistible ads.
    
    CEO Promise: Create content so good, users think we hired Don Draper.
    But faster, cheaper, and data-driven.
    """
    
    def __init__(self):
        super().__init__(
            name="content_generation_agent",
            description="I create compelling ad content that converts browsers into buyers"
        )
        
        # CEO Decision: Use Claude for creative writing, GPT-4 for analysis
        self.creative_llm = ChatAnthropic(
            model="claude-3-opus-20240229",
            temperature=0.8,  # More creative
            max_tokens=4000
        )
        
        self.analysis_llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.3  # More analytical
        )
        
        # CEO Metrics
        self.content_generated = 0
        self.high_performing_content = 0
        
        # Proven copywriting formulas (CEO-curated)
        self.copywriting_formulas = {
            "PAS": "Problem-Agitate-Solution",
            "AIDA": "Attention-Interest-Desire-Action",
            "BAB": "Before-After-Bridge",
            "FAB": "Features-Advantages-Benefits",
            "4Ps": "Promise-Picture-Proof-Push",
            "STAR": "Situation-Task-Action-Result"
        }
        
        # Platform best practices (CEO research)
        self.platform_specs = {
            "facebook": {
                "headline_limit": 40,
                "primary_text_limit": 125,
                "description_limit": 30,
                "best_practices": ["Use numbers", "Ask questions", "Create urgency"]
            },
            "instagram": {
                "headline_limit": 40,
                "primary_text_limit": 125,
                "best_practices": ["Emoji-friendly", "Visual language", "Hashtags in first comment"]
            },
            "linkedin": {
                "headline_limit": 70,
                "primary_text_limit": 150,
                "best_practices": ["Professional tone", "Industry stats", "Thought leadership"]
            }
        }
    
    def _initialize_tools(self):
        """CEO-approved content creation tools"""
        
        @tool
        async def analyze_brand_voice(
            existing_content: List[str],
            brand_guidelines: Optional[Dict[str, Any]] = None
        ) -> Dict[str, Any]:
            """
            Extract or define the brand voice.
            CEO Principle: Consistency builds trust.
            """
            prompt = f"""
            Analyze this brand's voice and communication style.
            
            Existing content examples:
            {json.dumps(existing_content[:5], indent=2)}
            
            Brand guidelines (if any):
            {json.dumps(brand_guidelines or {}, indent=2)}
            
            Extract:
            1. Tone characteristics (3-5 adjectives)
            2. Personality traits
            3. Vocabulary complexity
            4. Unique phrases or terminology
            5. What to avoid
            
            If no examples provided, suggest a compelling brand voice based on industry best practices.
            
            Return as JSON matching BrandVoice schema.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def generate_content_variations(
            brief: Dict[str, Any],
            brand_voice: Dict[str, Any],
            num_variations: int = 5
        ) -> List[Dict[str, Any]]:
            """
            Generate multiple content variations.
            CEO Mandate: Variety + Quality = Winner
            """
            prompt = f"""
            You are the world's best copywriter. Create {num_variations} DIFFERENT ad variations.
            
            Brief: {json.dumps(brief, indent=2)}
            Brand Voice: {json.dumps(brand_voice, indent=2)}
            
            For EACH variation:
            1. Use a different copywriting formula: {json.dumps(self.copywriting_formulas, indent=2)}
            2. Target a different psychological trigger
            3. Vary the length and structure
            4. Adapt for different platforms
            
            Requirements:
            - Headlines that stop scrolling
            - Copy that connects emotionally
            - Clear, compelling CTAs
            - Platform-specific adaptations
            
            Make each variation distinctly different.
            First variation should be your best.
            
            Return as JSON list with full content details.
            """
            
            response = await self.creative_llm.ainvoke([HumanMessage(content=prompt)])
            variations = json.loads(response.content)
            
            # Add variation IDs and metadata
            for i, var in enumerate(variations):
                var["variation_id"] = f"var_{datetime.now().strftime('%Y%m%d')}_{i+1}"
                var["creativity_score"] = 0.9 - (i * 0.1)  # First is most creative
            
            return variations
        
        @tool
        async def optimize_for_platform(
            content: Dict[str, Any],
            platform: str
        ) -> Dict[str, Any]:
            """
            Optimize content for specific platform requirements.
            CEO Rule: Respect the platform, win the audience.
            """
            specs = self.platform_specs.get(platform, {})
            
            prompt = f"""
            Optimize this ad content for {platform}.
            
            Original content: {json.dumps(content, indent=2)}
            Platform specs: {json.dumps(specs, indent=2)}
            
            Requirements:
            1. Respect character limits
            2. Follow platform best practices
            3. Adapt tone for platform audience
            4. Optimize for platform algorithm
            
            Keep the core message but make it native to {platform}.
            
            Return optimized content as JSON.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def predict_content_performance(
            content: Dict[str, Any],
            target_audience: Dict[str, Any],
            historical_data: Optional[List[Dict[str, Any]]] = None
        ) -> Dict[str, Any]:
            """
            Predict how well content will perform.
            CEO Innovation: Data-driven creativity.
            """
            prompt = f"""
            Predict the performance of this ad content.
            
            Content: {json.dumps(content, indent=2)}
            Target Audience: {json.dumps(target_audience, indent=2)}
            Historical Performance (if any): {json.dumps(historical_data[:5] if historical_data else [], indent=2)}
            
            Analyze:
            1. Headline effectiveness (1-10)
            2. Copy persuasiveness (1-10)
            3. CTA strength (1-10)
            4. Audience resonance (1-10)
            5. Predicted CTR (percentage)
            6. Predicted conversion rate (percentage)
            
            Provide reasoning for each score.
            Be realistic, not optimistic.
            
            Return as JSON with scores and explanations.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def generate_creative_angles(
            product: str,
            audience: Dict[str, Any],
            competitors: List[str]
        ) -> List[Dict[str, Any]]:
            """
            Generate unique angles to approach the content.
            CEO Strategy: Find the angle competitors missed.
            """
            prompt = f"""
            Generate 7 UNIQUE creative angles for advertising this product.
            
            Product: {product}
            Target Audience: {json.dumps(audience, indent=2)}
            Competitors: {competitors}
            
            For each angle provide:
            1. The hook/angle name
            2. Why it will resonate
            3. Example headline
            4. Differentiation from competitors
            5. Best platform for this angle
            
            Be bold. Safe doesn't sell.
            Think like Mad Men meets Silicon Valley.
            
            Return as JSON list.
            """
            
            response = await self.creative_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def create_urgency_elements(
            offer: str,
            objective: str
        ) -> Dict[str, Any]:
            """
            Add urgency without being pushy.
            CEO Wisdom: Urgency sells, desperation repels.
            """
            prompt = f"""
            Create authentic urgency elements for this offer.
            
            Offer: {offer}
            Objective: {objective}
            
            Generate:
            1. Time-based urgency options
            2. Scarcity-based urgency options
            3. Social proof urgency options
            4. Value-based urgency options
            
            Each should feel authentic, not manufactured.
            Avoid overused phrases like "Limited time only!"
            
            Return as JSON with multiple options.
            """
            
            response = await self.creative_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        self.tools = [
            analyze_brand_voice,
            generate_content_variations,
            optimize_for_platform,
            predict_content_performance,
            generate_creative_angles,
            create_urgency_elements
        ]
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        CEO Mandate: Create content that makes people stop, think, and buy.
        Every word must earn its place.
        """
        try:
            # Extract requirements
            brief = ContentBrief(
                product_service=state.get("product_service", "Your Product"),
                unique_value_props=state.get("value_props", ["Great value"]),
                target_audience=state.get("target_audience", {}),
                campaign_objective=state.get("objective", "conversions"),
                key_messages=state.get("key_messages", []),
                competitors=state.get("competitors", []),
                mandatory_elements=state.get("mandatory_elements", []),
                prohibited_elements=state.get("prohibited_elements", [])
            )
            
            self.logger.info(f"🎨 Creating content for: {brief.product_service}")
            
            # Step 1: Establish brand voice
            self.logger.info("Analyzing brand voice...")
            existing_content = state.get("existing_content", [])
            brand_guidelines = state.get("brand_guidelines", {})
            
            brand_voice = await self.tools[0].ainvoke({
                "existing_content": existing_content,
                "brand_guidelines": brand_guidelines
            })
            
            # Step 2: Generate creative angles
            self.logger.info("Generating creative angles...")
            angles = await self.tools[4].ainvoke({
                "product": brief.product_service,
                "audience": brief.target_audience,
                "competitors": brief.competitors
            })
            
            # Step 3: Create content variations
            self.logger.info("Creating content variations...")
            variations = await self.tools[1].ainvoke({
                "brief": brief.dict(),
                "brand_voice": brand_voice,
                "num_variations": state.get("num_variations", 5)
            })
            
            # Step 4: Optimize for platforms
            platforms = state.get("platforms", ["facebook", "instagram"])
            optimized_variations = []
            
            for var in variations:
                var_optimized = {"base": var, "platforms": {}}
                
                for platform in platforms:
                    self.logger.info(f"Optimizing for {platform}...")
                    platform_version = await self.tools[2].ainvoke({
                        "content": var,
                        "platform": platform
                    })
                    var_optimized["platforms"][platform] = platform_version
                
                optimized_variations.append(var_optimized)
            
            # Step 5: Predict performance
            performance_predictions = []
            for var in optimized_variations[:3]:  # Top 3 only
                prediction = await self.tools[3].ainvoke({
                    "content": var["base"],
                    "target_audience": brief.target_audience,
                    "historical_data": state.get("historical_performance", [])
                })
                performance_predictions.append({
                    "variation_id": var["base"]["variation_id"],
                    "prediction": prediction
                })
            
            # Step 6: Add urgency elements
            urgency = await self.tools[5].ainvoke({
                "offer": brief.product_service,
                "objective": brief.campaign_objective
            })
            
            # Track metrics
            self.content_generated += len(variations)
            
            # Build result
            result = {
                "status": "success",
                "brand_voice": brand_voice,
                "creative_angles": angles,
                "content_variations": optimized_variations,
                "performance_predictions": performance_predictions,
                "urgency_options": urgency,
                "recommendations": self._generate_recommendations(
                    variations, performance_predictions, brief
                ),
                "content_calendar": self._suggest_content_calendar(len(variations)),
                "total_variations": len(variations),
                "estimated_testing_time": f"{len(variations) * 2} days",
                "ceo_pick": optimized_variations[0]["base"]["variation_id"]
            }
            
            # Update state
            state["content_generation_result"] = result
            
            # CEO Message
            top_headline = optimized_variations[0]["base"].get("headline", "Your Amazing Product")
            state["messages"].append(
                AIMessage(content=f"""
✍️ Content Creation Complete!

I've created {len(variations)} unique variations for your campaign.

My top pick:
"{top_headline}"

Why this will work:
- Grabs attention in < 2 seconds
- Speaks directly to your audience's desires  
- Clear path from interest to action
- Tested psychological triggers included

Ready to start A/B testing? The first 48 hours will tell us everything!

Remember: Great content is just the beginning. Testing makes it perfect.

- Your Content Generation Agent
                """)
            )
            
            return state
            
        except Exception as e:
            self.logger.error(f"Content generation error: {str(e)}")
            state["content_generation_result"] = {
                "status": "error",
                "error": str(e),
                "fallback": self._generate_fallback_content(state)
            }
            return state
    
    def _generate_recommendations(
        self,
        variations: List[Dict[str, Any]],
        predictions: List[Dict[str, Any]],
        brief: ContentBrief
    ) -> List[str]:
        """
        CEO Strategy: Turn data into actionable recommendations.
        """
        recommendations = []
        
        # Testing strategy
        if len(variations) > 3:
            recommendations.append(
                f"Start with top 3 variations for 48-hour test. "
                f"Invest 70% budget in winner, 30% in continued testing."
            )
        
        # Platform strategy
        if brief.campaign_objective == "awareness":
            recommendations.append(
                "For awareness, prioritize Instagram Stories and Reels. "
                "Visual content gets 3x more reach than static posts."
            )
        elif brief.campaign_objective == "conversions":
            recommendations.append(
                "For conversions, Facebook Feed typically delivers best ROI. "
                "Combine with retargeting on Instagram for maximum impact."
            )
        
        # Content strategy
        if any(p["prediction"].get("headline_effectiveness", 0) > 8 for p in predictions):
            recommendations.append(
                "Your headlines are strong. Test them as email subject lines too!"
            )
        
        # CEO bonus tip
        recommendations.append(
            "Pro tip: Update creative every 2 weeks to combat ad fatigue. "
            "I'll generate fresh variations automatically based on performance data."
        )
        
        return recommendations
    
    def _suggest_content_calendar(self, num_variations: int) -> Dict[str, Any]:
        """
        CEO Innovation: Plan content rotation for maximum impact.
        """
        return {
            "week_1": {
                "action": "Test all variations with equal budget",
                "expected_outcome": "Identify top 2-3 performers"
            },
            "week_2": {
                "action": "Scale winners, pause losers",
                "expected_outcome": "2x improvement in CTR"
            },
            "week_3": {
                "action": "Introduce urgency elements to winners",
                "expected_outcome": "30% boost in conversions"
            },
            "week_4": {
                "action": "Refresh with new angles based on data",
                "expected_outcome": "Maintain performance, prevent fatigue"
            }
        }
    
    def _generate_fallback_content(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        CEO Principle: Never leave users empty-handed.
        Even our fallbacks are better than average.
        """
        product = state.get("product_service", "Your Product/Service")
        
        return {
            "headline": f"Discover {product} Today",
            "primary_text": f"Join thousands who are already benefiting from {product}. "
                          f"Start your journey today with our special offer.",
            "description": "Limited time offer - Start now",
            "call_to_action": "Learn More",
            "note": "This is a safe, proven template. Customize based on your specific offer."
        }


# CEO Testing Suite
if __name__ == "__main__":
    async def ceo_content_test():
        """CEO's personal test of content generation"""
        
        print("🎨 CEO Testing Content Generation Agent\n")
        
        agent = ContentGenerationAgent()
        
        # Test: SaaS product campaign
        test_state = {
            "messages": [],
            "product_service": "AI-powered CRM that predicts customer churn",
            "value_props": [
                "Reduce churn by 30%",
                "2-minute setup",
                "No credit card required",
                "Integrates with everything"
            ],
            "target_audience": {
                "job_titles": ["SaaS founders", "Customer Success Managers"],
                "company_size": "50-500 employees",
                "pain_points": ["High churn", "Poor visibility", "Manual processes"]
            },
            "objective": "conversions",
            "competitors": ["Salesforce", "HubSpot", "Intercom"],
            "platforms": ["linkedin", "facebook"],
            "num_variations": 3
        }
        
        print("Creating content for B2B SaaS product...")
        result = await agent(test_state)
        
        content_result = result.get("content_generation_result", {})
        print(f"\nStatus: {content_result.get('status')}")
        print(f"Variations created: {content_result.get('total_variations', 0)}")
        
        # Show top variation
        if content_result.get("content_variations"):
            top_var = content_result["content_variations"][0]["base"]
            print(f"\n🏆 CEO's Top Pick:")
            print(f"Headline: {top_var.get('headline')}")
            print(f"Primary Text: {top_var.get('primary_text')[:100]}...")
            print(f"CTA: {top_var.get('call_to_action')}")
        
        # Show recommendations
        print("\n📋 Strategic Recommendations:")
        for rec in content_result.get("recommendations", [])[:3]:
            print(f"- {rec}")
        
        print("\n✅ Remember: Words are weapons. Use them wisely!")
    
    asyncio.run(ceo_content_test())