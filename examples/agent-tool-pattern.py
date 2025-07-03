"""
Agent Tool Pattern - MetaAds Standard
This example shows how to create reusable tools for AI agents
"""

from typing import Dict, Any, List, Optional, Callable
from langchain.tools import tool, Tool
from langchain.pydantic_v1 import BaseModel, Field
from datetime import datetime
import asyncio
import aiohttp
import json

# 1. Tool Input Schema Definition
# Always define clear schemas for tool inputs
class CampaignAnalysisInput(BaseModel):
    """Input schema for campaign analysis"""
    campaign_id: str = Field(description="The Meta campaign ID to analyze")
    metrics: List[str] = Field(
        default=["impressions", "clicks", "spend", "ctr", "cpc"],
        description="List of metrics to retrieve"
    )
    date_range: Dict[str, str] = Field(
        default={"start": "7_days_ago", "end": "today"},
        description="Date range for analysis"
    )

class AudienceTargetingInput(BaseModel):
    """Input schema for audience targeting"""
    interests: List[str] = Field(description="List of interests to target")
    age_min: int = Field(default=18, description="Minimum age")
    age_max: int = Field(default=65, description="Maximum age")
    locations: List[str] = Field(description="Geographic locations to target")

# 2. Base Tool Class for MetaAds
class MetaAdsTool:
    """Base class for MetaAds agent tools"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://graph.facebook.com/v18.0"
        
    async def _make_request(
        self, 
        endpoint: str, 
        method: str = "GET", 
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make async HTTP request to Meta API"""
        url = f"{self.base_url}/{endpoint}"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=data
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise Exception(f"Meta API error: {error_data}")
                
                return await response.json()

# 3. Specific Tool Implementations
@tool(args_schema=CampaignAnalysisInput)
async def analyze_campaign_performance(
    campaign_id: str,
    metrics: List[str],
    date_range: Dict[str, str]
) -> Dict[str, Any]:
    """
    Analyze campaign performance metrics from Meta Ads
    
    This tool fetches and analyzes campaign performance data,
    providing insights and recommendations.
    """
    # Mock implementation - replace with actual Meta API calls
    analysis = {
        "campaign_id": campaign_id,
        "period": date_range,
        "metrics": {
            "impressions": 150000,
            "clicks": 3750,
            "spend": 1250.50,
            "ctr": 2.5,
            "cpc": 0.33,
            "conversions": 125,
            "cpa": 10.00
        },
        "performance_score": 85,
        "insights": [
            "CTR is above industry average (2.5% vs 1.9%)",
            "CPC is highly competitive for this audience",
            "Conversion rate indicates strong ad-to-landing page alignment"
        ],
        "recommendations": [
            {
                "type": "budget",
                "action": "increase",
                "reason": "High performance justifies 20% budget increase",
                "impact": "Estimated +25 conversions/week"
            },
            {
                "type": "audience",
                "action": "expand",
                "reason": "Lookalike audience likely to perform well",
                "impact": "Reach +50K similar users"
            }
        ]
    }
    
    return analysis

@tool
def calculate_optimal_budget(
    current_performance: Dict[str, Any],
    business_goals: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate optimal budget based on performance and goals
    
    This tool uses performance data to recommend budget adjustments
    that align with business objectives.
    """
    current_spend = current_performance.get("spend", 0)
    current_conversions = current_performance.get("conversions", 0)
    target_conversions = business_goals.get("target_conversions", 100)
    max_cpa = business_goals.get("max_cpa", 50)
    
    if current_conversions > 0:
        current_cpa = current_spend / current_conversions
        
        if current_cpa < max_cpa:
            # Performance is good, scale up
            scaling_factor = min(2.0, max_cpa / current_cpa)
            recommended_budget = current_spend * scaling_factor
            
            return {
                "current_budget": current_spend,
                "recommended_budget": round(recommended_budget, 2),
                "expected_conversions": int(current_conversions * scaling_factor * 0.9),
                "confidence": "high",
                "reasoning": f"Current CPA (${current_cpa:.2f}) is below target"
            }
    
    return {
        "current_budget": current_spend,
        "recommended_budget": current_spend,
        "expected_conversions": current_conversions,
        "confidence": "low",
        "reasoning": "Insufficient data for optimization"
    }

# 4. Tool Factory Pattern
class ToolFactory:
    """Factory for creating specialized tools with shared configuration"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.access_token = config.get("meta_access_token")
        
    def create_campaign_tools(self) -> List[Tool]:
        """Create all campaign-related tools"""
        return [
            self._create_performance_analyzer(),
            self._create_budget_optimizer(),
            self._create_audience_expander(),
            self._create_creative_tester()
        ]
    
    def _create_performance_analyzer(self) -> Tool:
        """Create performance analysis tool"""
        return Tool(
            name="analyze_performance",
            func=self._analyze_performance_wrapper,
            description="Analyze campaign performance and provide insights"
        )
    
    async def _analyze_performance_wrapper(self, campaign_id: str) -> Dict[str, Any]:
        """Wrapper for performance analysis with error handling"""
        try:
            # Add authentication and error handling
            tool = MetaAdsTool(self.access_token)
            
            # Fetch insights
            insights = await tool._make_request(
                f"{campaign_id}/insights",
                params={
                    "fields": "impressions,clicks,spend,ctr,cpc,conversions",
                    "date_preset": "last_7d"
                }
            )
            
            # Process and return
            return self._process_insights(insights)
            
        except Exception as e:
            return {
                "error": str(e),
                "fallback": "Using cached data",
                "cached_insights": self._get_cached_insights(campaign_id)
            }
    
    def _process_insights(self, raw_insights: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw insights into actionable format"""
        # Processing logic here
        pass
    
    def _get_cached_insights(self, campaign_id: str) -> Dict[str, Any]:
        """Retrieve cached insights as fallback"""
        # Cache retrieval logic
        pass

# 5. Composite Tools for Complex Operations
class CampaignOptimizationToolset:
    """Composite toolset for campaign optimization workflows"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.tools = self._initialize_tools()
    
    def _initialize_tools(self) -> Dict[str, Tool]:
        """Initialize all required tools"""
        factory = ToolFactory({"meta_access_token": self.access_token})
        
        return {
            "analyzer": analyze_campaign_performance,
            "budget_optimizer": calculate_optimal_budget,
            "audience_tools": factory.create_campaign_tools()
        }
    
    @tool
    async def full_campaign_optimization(
        self,
        campaign_id: str,
        optimization_goals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform complete campaign optimization workflow
        
        This composite tool orchestrates multiple tools to:
        1. Analyze current performance
        2. Identify optimization opportunities
        3. Apply changes
        4. Monitor results
        """
        # Step 1: Analyze
        performance = await self.tools["analyzer"].ainvoke({
            "campaign_id": campaign_id,
            "metrics": ["all"],
            "date_range": {"start": "14_days_ago", "end": "today"}
        })
        
        # Step 2: Optimize budget
        budget_recommendation = self.tools["budget_optimizer"].invoke({
            "current_performance": performance["metrics"],
            "business_goals": optimization_goals
        })
        
        # Step 3: Generate optimization plan
        optimization_plan = {
            "campaign_id": campaign_id,
            "current_state": performance,
            "recommendations": {
                "budget": budget_recommendation,
                "audience": self._get_audience_recommendations(performance),
                "creative": self._get_creative_recommendations(performance)
            },
            "expected_impact": self._calculate_expected_impact(
                performance, 
                budget_recommendation
            ),
            "implementation_steps": self._generate_implementation_steps(
                budget_recommendation
            )
        }
        
        return optimization_plan
    
    def _get_audience_recommendations(
        self, 
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate audience recommendations based on performance"""
        # Implementation
        pass
    
    def _get_creative_recommendations(
        self, 
        performance: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate creative recommendations based on performance"""
        # Implementation
        pass
    
    def _calculate_expected_impact(
        self,
        current: Dict[str, Any],
        changes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate expected impact of optimizations"""
        # Implementation
        pass
    
    def _generate_implementation_steps(
        self,
        recommendations: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate step-by-step implementation plan"""
        # Implementation
        pass

# 6. Usage Example
async def example_usage():
    """Example of using agent tools"""
    
    # Initialize toolset
    toolset = CampaignOptimizationToolset(
        access_token="your_meta_access_token"
    )
    
    # Run full optimization
    result = await toolset.full_campaign_optimization(
        campaign_id="123456789",
        optimization_goals={
            "target_conversions": 500,
            "max_cpa": 25.00,
            "monthly_budget": 10000
        }
    )
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(example_usage())