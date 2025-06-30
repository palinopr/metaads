"""
Campaign Creation Agent for Meta Ads Platform
This agent helps users create optimized ad campaigns through conversation
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain.agents import create_react_agent
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, MessagesState
from langgraph.checkpoint.memory import InMemorySaver
import asyncio

# Environment setup
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")

# Campaign creation tools
@tool
def analyze_business_objective(objective: str) -> Dict[str, Any]:
    """Analyze the business objective and recommend campaign settings"""
    
    objective_mapping = {
        "sales": {
            "campaign_objective": "CONVERSIONS",
            "optimization_goal": "PURCHASE",
            "bidding_strategy": "LOWEST_COST_WITHOUT_CAP",
            "recommended_budget": {"min": 50, "max": 500, "optimal": 100}
        },
        "traffic": {
            "campaign_objective": "TRAFFIC",
            "optimization_goal": "LINK_CLICKS",
            "bidding_strategy": "LOWEST_COST_WITHOUT_CAP",
            "recommended_budget": {"min": 20, "max": 200, "optimal": 50}
        },
        "awareness": {
            "campaign_objective": "REACH",
            "optimization_goal": "REACH",
            "bidding_strategy": "LOWEST_COST_WITHOUT_CAP",
            "recommended_budget": {"min": 30, "max": 300, "optimal": 75}
        },
        "engagement": {
            "campaign_objective": "ENGAGEMENT",
            "optimization_goal": "POST_ENGAGEMENT",
            "bidding_strategy": "LOWEST_COST_WITHOUT_CAP",
            "recommended_budget": {"min": 25, "max": 250, "optimal": 60}
        }
    }
    
    # Simple keyword matching for demo
    objective_lower = objective.lower()
    for key, config in objective_mapping.items():
        if key in objective_lower:
            return {
                "success": True,
                "recommendation": config,
                "explanation": f"Based on your goal '{objective}', I recommend a {config['campaign_objective']} campaign optimized for {config['optimization_goal']}."
            }
    
    return {
        "success": False,
        "recommendation": objective_mapping["traffic"],
        "explanation": "I'll set up a traffic campaign as a default. Can you tell me more about your specific goals?"
    }

@tool
def generate_audience_suggestions(business_type: str, target_market: str, objective: str) -> Dict[str, Any]:
    """Generate audience targeting suggestions based on business info"""
    
    # This would integrate with Meta's audience insights API
    # For demo, returning mock suggestions
    
    suggestions = {
        "demographics": {
            "age_min": 25,
            "age_max": 54,
            "genders": ["all"],
            "languages": ["en"]
        },
        "geo_locations": {
            "countries": ["US"],
            "location_type": "home"
        },
        "interests": [],
        "behaviors": [],
        "custom_audiences": [],
        "lookalike_audiences": []
    }
    
    # Business-specific suggestions
    if "ecommerce" in business_type.lower() or "online" in business_type.lower():
        suggestions["interests"] = [
            {"id": "6003139266461", "name": "Online shopping"},
            {"id": "6003397425735", "name": "Shopping"},
            {"id": "6003659420716", "name": "Discount Shopping"}
        ]
        suggestions["behaviors"] = [
            {"id": "6002714895372", "name": "Engaged Shoppers"}
        ]
    
    if "fitness" in business_type.lower() or "health" in business_type.lower():
        suggestions["interests"] = [
            {"id": "6003107902433", "name": "Fitness and wellness"},
            {"id": "6003012939573", "name": "Physical exercise"},
            {"id": "6003188626794", "name": "Healthy diet"}
        ]
    
    # Calculate estimated reach (mock data)
    estimated_reach = {
        "users_lower_bound": 1500000,
        "users_upper_bound": 2000000
    }
    
    return {
        "targeting": suggestions,
        "estimated_reach": estimated_reach,
        "explanation": f"Based on your {business_type} business targeting {target_market}, I've created an audience that should reach 1.5-2M potential customers."
    }

@tool
def calculate_budget_recommendation(objective: str, audience_size: int, duration_days: int = 7) -> Dict[str, Any]:
    """Calculate recommended budget based on campaign parameters"""
    
    # Base CPM rates by objective (mock data)
    cpm_rates = {
        "CONVERSIONS": 15.0,
        "TRAFFIC": 8.0,
        "REACH": 5.0,
        "ENGAGEMENT": 10.0
    }
    
    base_cpm = cpm_rates.get(objective, 10.0)
    
    # Calculate daily budget recommendation
    min_daily = 20  # Meta's minimum
    optimal_daily = max(min_daily, (audience_size / 1000) * base_cpm * 0.01)
    max_daily = optimal_daily * 3
    
    total_budget = optimal_daily * duration_days
    
    # Estimate results (simplified calculation)
    estimated_impressions = (total_budget / base_cpm) * 1000
    estimated_clicks = estimated_impressions * 0.02  # 2% CTR
    estimated_conversions = estimated_clicks * 0.03  # 3% conversion rate
    
    return {
        "budget_recommendation": {
            "daily_budget": {
                "min": round(min_daily, 2),
                "optimal": round(optimal_daily, 2),
                "max": round(max_daily, 2)
            },
            "total_budget": round(total_budget, 2),
            "duration_days": duration_days
        },
        "estimated_results": {
            "impressions": int(estimated_impressions),
            "clicks": int(estimated_clicks),
            "conversions": int(estimated_conversions) if objective == "CONVERSIONS" else None,
            "cost_per_click": round(total_budget / estimated_clicks, 2) if estimated_clicks > 0 else 0,
            "cost_per_conversion": round(total_budget / estimated_conversions, 2) if estimated_conversions > 0 else None
        },
        "explanation": f"With a daily budget of ${optimal_daily:.2f} over {duration_days} days, you can expect approximately {int(estimated_clicks):,} clicks."
    }

@tool
def generate_ad_creative_ideas(business_type: str, objective: str, target_audience: str) -> Dict[str, Any]:
    """Generate ad creative suggestions based on campaign parameters"""
    
    creative_templates = {
        "CONVERSIONS": {
            "formats": ["carousel", "single_image", "video"],
            "headlines": [
                "Shop Now and Save 20%",
                "Limited Time Offer - Free Shipping",
                "Discover Your Perfect [Product]"
            ],
            "descriptions": [
                "Transform your [lifestyle] with our premium [products]. Order today!",
                "Join thousands of satisfied customers. 30-day money-back guarantee.",
                "Exclusive online prices. Quality guaranteed."
            ],
            "cta_buttons": ["SHOP_NOW", "LEARN_MORE", "GET_OFFER"]
        },
        "TRAFFIC": {
            "formats": ["single_image", "video", "carousel"],
            "headlines": [
                "Discover What Makes Us Different",
                "Your Guide to [Topic]",
                "See Why Customers Love Us"
            ],
            "descriptions": [
                "Learn more about [topic] from the experts.",
                "Get insider tips and exclusive content.",
                "Explore our collection and find your favorites."
            ],
            "cta_buttons": ["LEARN_MORE", "SEE_MORE", "DOWNLOAD"]
        }
    }
    
    template = creative_templates.get(objective, creative_templates["TRAFFIC"])
    
    return {
        "creative_suggestions": {
            "recommended_formats": template["formats"],
            "headline_ideas": template["headlines"],
            "description_ideas": template["descriptions"],
            "cta_options": template["cta_buttons"],
            "image_recommendations": {
                "dimensions": "1200x628 or 1080x1080",
                "style": "High-quality, eye-catching visuals with clear branding",
                "text_overlay": "Keep text to less than 20% of image area"
            },
            "video_recommendations": {
                "length": "15-30 seconds for best engagement",
                "format": "Square (1:1) or vertical (9:16) for mobile",
                "captions": "Always include captions for silent viewing"
            }
        },
        "best_practices": [
            "Test multiple creative variations",
            "Use high-quality, authentic imagery",
            "Include a clear call-to-action",
            "Keep messaging concise and benefit-focused"
        ]
    }

# Campaign Creation Agent Class
class CampaignCreationAgent:
    def __init__(self, llm_model="anthropic"):
        # Initialize LLM
        if llm_model == "anthropic":
            self.llm = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=ANTHROPIC_API_KEY
            )
        else:
            self.llm = ChatOpenAI(
                model="gpt-4-turbo-preview",
                api_key=OPENAI_API_KEY
            )
        
        # Define tools
        self.tools = [
            analyze_business_objective,
            generate_audience_suggestions,
            calculate_budget_recommendation,
            generate_ad_creative_ideas
        ]
        
        # Create the agent prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert Meta Ads campaign creation assistant. Your role is to help users create effective advertising campaigns by:

1. Understanding their business objectives
2. Suggesting optimal targeting and audiences  
3. Recommending appropriate budgets
4. Providing creative ideas and best practices

Always be helpful, ask clarifying questions when needed, and explain your recommendations clearly. Guide users through the campaign creation process step by step.

Current date: {current_date}
"""),
            ("human", "{input}"),
            ("assistant", "{agent_scratchpad}")
        ])
        
        # Initialize checkpointer for conversation memory
        self.checkpointer = InMemorySaver()
    
    async def create_campaign_conversation(self, user_input: str, thread_id: str = "default"):
        """Handle a conversation about campaign creation"""
        
        # Create the ReAct agent
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )
        
        # Execute with context
        config = {
            "configurable": {"thread_id": thread_id},
            "current_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        try:
            response = await agent.ainvoke(
                {"input": user_input},
                config=config
            )
            
            return {
                "success": True,
                "response": response["output"],
                "thread_id": thread_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": "I encountered an error while processing your request. Please try again."
            }
    
    def extract_campaign_data(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Extract structured campaign data from conversation history"""
        
        # This would parse the conversation to extract campaign parameters
        # For now, returning a template structure
        
        return {
            "campaign": {
                "name": "New Campaign",
                "objective": "TRAFFIC",
                "status": "PAUSED",
                "special_ad_categories": []
            },
            "adset": {
                "name": "Ad Set 1",
                "daily_budget": 5000,  # In cents
                "optimization_goal": "LINK_CLICKS",
                "billing_event": "IMPRESSIONS",
                "targeting": {
                    "age_min": 25,
                    "age_max": 54,
                    "genders": [1, 2],
                    "geo_locations": {
                        "countries": ["US"]
                    }
                }
            },
            "ads": []
        }

# Example usage
async def main():
    # Initialize the agent
    agent = CampaignCreationAgent()
    
    # Example conversation flow
    conversations = [
        "I want to create a campaign for my online fitness coaching business",
        "My goal is to get more people to sign up for my programs",
        "I'm targeting people interested in fitness and health in the US",
        "My budget is around $100 per day"
    ]
    
    thread_id = f"session_{datetime.now().timestamp()}"
    
    for user_input in conversations:
        print(f"\nUser: {user_input}")
        response = await agent.create_campaign_conversation(user_input, thread_id)
        print(f"Agent: {response['response']}")
        print("-" * 80)

if __name__ == "__main__":
    # Run the example
    asyncio.run(main())