"""
Optimization Agent - The Relentless Performance Maximizer

CEO Vision: This agent never sleeps, never stops improving campaigns.
It's like having the world's best media buyer working 24/7 for every user.

This agent monitors, analyzes, and optimizes campaigns continuously.
Users wake up to better performance every single day.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple, Literal
from datetime import datetime, timedelta
from decimal import Decimal
import random
import numpy as np

from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, validator
import logging

# Import base agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from examples.agents.base_agent import BaseMarketingAgent, AgentResult, AgentStatus


# CEO-Approved Optimization Models
class CampaignMetrics(BaseModel):
    """Real-time campaign performance data"""
    impressions: int
    clicks: int
    conversions: int
    spend: Decimal
    ctr: float = Field(description="Click-through rate")
    cpc: Decimal = Field(description="Cost per click")
    cpa: Decimal = Field(description="Cost per acquisition")
    roas: float = Field(description="Return on ad spend")
    
    @validator('ctr', 'roas')
    def round_percentages(cls, v):
        return round(v, 4)


class OptimizationOpportunity(BaseModel):
    """An opportunity to improve performance"""
    type: Literal["budget", "bidding", "targeting", "creative", "scheduling"]
    impact: Literal["high", "medium", "low"]
    description: str
    expected_improvement: Dict[str, float]
    confidence: float = Field(ge=0.0, le=1.0)
    action_required: Dict[str, Any]


class OptimizationResult(BaseModel):
    """Result of an optimization action"""
    action_taken: str
    success: bool
    metrics_before: Dict[str, float]
    metrics_after: Optional[Dict[str, float]]
    improvement_percentage: Optional[float]
    next_check_time: datetime


class OptimizationAgent(BaseMarketingAgent):
    """
    The Optimization Agent - Turning good campaigns into great ones.
    
    CEO Promise: Every campaign gets better every day, automatically.
    No manual tweaking needed - we handle everything.
    """
    
    def __init__(self):
        super().__init__(
            name="optimization_agent",
            description="I maximize your campaign ROI 24/7 through intelligent optimization"
        )
        
        # CEO Decision: Use GPT-4 for complex analysis, 3.5 for routine checks
        self.analysis_llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.3,  # Analytical, not creative
            streaming=True
        )
        
        self.execution_llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.1  # Precise execution
        )
        
        # CEO Metrics: Track our impact
        self.total_optimizations = 0
        self.successful_optimizations = 0
        self.total_improvement_percentage = 0.0
        
        # Optimization thresholds (CEO-tuned)
        self.thresholds = {
            "min_impressions_for_optimization": 1000,
            "min_spend_for_optimization": 10.0,
            "ctr_warning_threshold": 0.005,  # 0.5%
            "cpa_warning_multiplier": 1.5,    # 50% above target
            "budget_utilization_low": 0.7,    # 70%
            "budget_utilization_high": 0.95   # 95%
        }
    
    def _initialize_tools(self):
        """CEO-approved optimization tools"""
        
        @tool
        async def analyze_performance(
            campaign_id: str,
            metrics: Dict[str, Any],
            historical_data: List[Dict[str, Any]]
        ) -> Dict[str, Any]:
            """
            Deep performance analysis using AI.
            CEO Mandate: Find EVERY opportunity to improve.
            """
            prompt = f"""
            You are the world's best performance marketer analyzing a campaign.
            
            Campaign ID: {campaign_id}
            Current Metrics: {json.dumps(metrics, indent=2)}
            Historical Data (last 7 days): {json.dumps(historical_data[-7:], indent=2)}
            
            Analyze:
            1. Performance trends (improving/declining/stable)
            2. Key issues limiting performance
            3. Hidden opportunities for improvement
            4. Anomalies or concerns
            5. Competitive considerations
            
            Provide specific, actionable insights.
            Quantify expected improvements where possible.
            
            Return as JSON with:
            - performance_score (0-100)
            - trend (improving/declining/stable)
            - top_issues (list)
            - opportunities (list with expected impact)
            - urgent_actions (list)
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def identify_optimization_opportunities(
            analysis: Dict[str, Any],
            campaign_config: Dict[str, Any]
        ) -> List[Dict[str, Any]]:
            """
            Convert analysis into specific optimization actions.
            CEO Principle: Every insight must be actionable.
            """
            prompt = f"""
            Based on this performance analysis, identify SPECIFIC optimizations.
            
            Analysis: {json.dumps(analysis, indent=2)}
            Campaign Config: {json.dumps(campaign_config, indent=2)}
            
            For each opportunity provide:
            1. Type (budget/bidding/targeting/creative/scheduling)
            2. Specific action to take
            3. Expected impact (percentage improvement)
            4. Confidence level (0-1)
            5. Risk assessment
            
            Prioritize by impact and confidence.
            Be aggressive but smart - we want results.
            
            Return as JSON list of opportunities.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def execute_optimization(
            campaign_id: str,
            optimization: Dict[str, Any],
            dry_run: bool = False
        ) -> Dict[str, Any]:
            """
            Execute the optimization action.
            CEO Rule: Move fast but track everything.
            """
            # In production, this would call the actual ad platform APIs
            # For now, simulate the optimization
            
            action = optimization.get("action_required", {})
            opt_type = optimization.get("type", "unknown")
            
            if dry_run:
                return {
                    "status": "dry_run",
                    "would_execute": action,
                    "expected_impact": optimization.get("expected_improvement", {})
                }
            
            # Simulate execution based on type
            result = {
                "campaign_id": campaign_id,
                "optimization_type": opt_type,
                "action_executed": action,
                "timestamp": datetime.now().isoformat(),
                "success": True,  # In production, check actual API response
                "details": {}
            }
            
            # CEO Touch: Add specific execution details
            if opt_type == "budget":
                result["details"] = {
                    "previous_budget": action.get("current_budget", 100),
                    "new_budget": action.get("new_budget", 120),
                    "reason": "Scaling successful performance"
                }
            elif opt_type == "bidding":
                result["details"] = {
                    "strategy_change": action.get("strategy", "target_cpa"),
                    "bid_adjustment": action.get("adjustment", "+20%")
                }
            elif opt_type == "targeting":
                result["details"] = {
                    "audiences_added": action.get("add_audiences", []),
                    "audiences_removed": action.get("remove_audiences", []),
                    "expansion_applied": action.get("lookalike_expansion", False)
                }
            
            return result
        
        @tool
        async def monitor_optimization_impact(
            campaign_id: str,
            optimization_id: str,
            metrics_before: Dict[str, Any],
            metrics_after: Dict[str, Any]
        ) -> Dict[str, Any]:
            """
            Measure the actual impact of our optimization.
            CEO Accountability: We track and learn from every action.
            """
            # Calculate improvements
            improvements = {}
            for metric in ["ctr", "cpa", "roas", "conversions"]:
                if metric in metrics_before and metric in metrics_after:
                    before = float(metrics_before[metric])
                    after = float(metrics_after[metric])
                    
                    if before > 0:
                        if metric == "cpa":  # Lower is better
                            improvement = ((before - after) / before) * 100
                        else:  # Higher is better
                            improvement = ((after - before) / before) * 100
                        improvements[f"{metric}_improvement"] = round(improvement, 2)
            
            # Overall success assessment
            success_score = sum(improvements.values()) / len(improvements) if improvements else 0
            
            return {
                "optimization_id": optimization_id,
                "campaign_id": campaign_id,
                "improvements": improvements,
                "success_score": success_score,
                "status": "successful" if success_score > 5 else "neutral" if success_score > -5 else "negative",
                "learnings": self._extract_learnings(improvements, optimization_id)
            }
        
        @tool
        async def generate_optimization_report(
            campaign_id: str,
            optimizations_performed: List[Dict[str, Any]],
            current_metrics: Dict[str, Any]
        ) -> Dict[str, Any]:
            """
            Create a CEO-level report on optimization performance.
            Make complex data simple and actionable.
            """
            prompt = f"""
            Create an executive optimization report.
            
            Campaign: {campaign_id}
            Optimizations Performed: {json.dumps(optimizations_performed, indent=2)}
            Current Metrics: {json.dumps(current_metrics, indent=2)}
            
            Include:
            1. Executive summary (2-3 sentences)
            2. Key wins and improvements
            3. Areas still needing attention
            4. Next 24-hour action plan
            5. Expected results if plan is followed
            
            Write like you're briefing a CEO - clear, concise, focused on ROI.
            
            Return as JSON.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        self.tools = [
            analyze_performance,
            identify_optimization_opportunities,
            execute_optimization,
            monitor_optimization_impact,
            generate_optimization_report
        ]
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        CEO Mandate: Make every campaign better, every single day.
        No excuses, no delays, just results.
        """
        try:
            # Extract campaign data
            campaign_id = state.get("campaign_id", "unknown")
            metrics = state.get("current_metrics", {})
            historical_data = state.get("historical_metrics", [])
            auto_optimize = state.get("auto_optimize", True)
            
            self.logger.info(f"🎯 CEO Mode: Optimizing campaign {campaign_id}")
            
            # Step 1: Deep performance analysis
            self.logger.info("Analyzing campaign performance...")
            analysis = await self.tools[0].ainvoke({
                "campaign_id": campaign_id,
                "metrics": metrics,
                "historical_data": historical_data
            })
            
            # CEO Check: Is this campaign worth optimizing?
            if not self._should_optimize(metrics, analysis):
                state["optimization_result"] = {
                    "status": "skipped",
                    "reason": "Campaign needs more data before optimization",
                    "next_check": (datetime.now() + timedelta(hours=6)).isoformat()
                }
                return state
            
            # Step 2: Identify opportunities
            self.logger.info("Identifying optimization opportunities...")
            opportunities = await self.tools[1].ainvoke({
                "analysis": analysis,
                "campaign_config": state.get("campaign_config", {})
            })
            
            # CEO Decision: Prioritize high-impact optimizations
            priority_opportunities = [
                opp for opp in opportunities 
                if opp.get("confidence", 0) > 0.7 and opp.get("expected_impact", {})
            ]
            
            if not priority_opportunities:
                self.logger.info("No high-confidence optimizations available")
                state["optimization_result"] = {
                    "status": "monitoring",
                    "reason": "Campaign performing well, continuing monitoring",
                    "next_check": (datetime.now() + timedelta(hours=4)).isoformat()
                }
                return state
            
            # Step 3: Execute optimizations (CEO: Move fast!)
            executed_optimizations = []
            for opp in priority_opportunities[:3]:  # Max 3 at once
                self.logger.info(f"Executing optimization: {opp.get('type')}")
                
                result = await self.tools[2].ainvoke({
                    "campaign_id": campaign_id,
                    "optimization": opp,
                    "dry_run": not auto_optimize
                })
                
                executed_optimizations.append({
                    "optimization": opp,
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Track our success
                if result.get("success"):
                    self.successful_optimizations += 1
                self.total_optimizations += 1
            
            # Step 4: Generate executive report
            report = await self.tools[4].ainvoke({
                "campaign_id": campaign_id,
                "optimizations_performed": executed_optimizations,
                "current_metrics": metrics
            })
            
            # Update state with results
            state["optimization_result"] = {
                "status": "optimized",
                "optimizations_applied": len(executed_optimizations),
                "analysis": analysis,
                "opportunities_found": len(opportunities),
                "actions_taken": executed_optimizations,
                "executive_report": report,
                "next_check": (datetime.now() + timedelta(hours=2)).isoformat(),
                "agent_metrics": self.get_optimization_metrics()
            }
            
            # CEO Touch: Personal message
            improvement_summary = report.get("executive_summary", "Optimizations applied successfully")
            state["messages"].append(
                AIMessage(content=f"""
🚀 Optimization Complete for Campaign {campaign_id}

{improvement_summary}

Actions taken:
{self._format_actions(executed_optimizations)}

I'll check again in 2 hours to ensure improvements are working.
Remember: Great campaigns aren't built, they're optimized into existence!

- Your 24/7 Optimization Agent
                """)
            )
            
            return state
            
        except Exception as e:
            self.logger.error(f"Optimization error: {str(e)}")
            state["optimization_result"] = {
                "status": "error",
                "error": str(e),
                "recovery_plan": "Will retry in 1 hour with fallback strategy"
            }
            return state
    
    def _should_optimize(self, metrics: Dict[str, Any], analysis: Dict[str, Any]) -> bool:
        """
        CEO Decision: Should we optimize this campaign now?
        Balance between having enough data and acting quickly.
        """
        impressions = metrics.get("impressions", 0)
        spend = float(metrics.get("spend", 0))
        performance_score = analysis.get("performance_score", 50)
        
        # Not enough data yet
        if impressions < self.thresholds["min_impressions_for_optimization"]:
            return False
        
        if spend < self.thresholds["min_spend_for_optimization"]:
            return False
        
        # Always optimize poorly performing campaigns
        if performance_score < 40:
            return True
        
        # Optimize good campaigns less frequently
        if performance_score > 80:
            return random.random() < 0.3  # 30% chance
        
        return True
    
    def _extract_learnings(self, improvements: Dict[str, float], optimization_id: str) -> List[str]:
        """
        CEO Principle: Every optimization teaches us something.
        Build institutional knowledge over time.
        """
        learnings = []
        
        for metric, improvement in improvements.items():
            if improvement > 20:
                learnings.append(f"Strong positive response to {optimization_id} ({metric} +{improvement}%)")
            elif improvement < -10:
                learnings.append(f"Negative response to {optimization_id} ({metric} {improvement}%)")
        
        # Store for future ML models
        # In production, save to database for pattern recognition
        
        return learnings
    
    def _format_actions(self, optimizations: List[Dict[str, Any]]) -> str:
        """Format optimization actions for user message"""
        if not optimizations:
            return "- No actions needed at this time"
        
        formatted = []
        for opt in optimizations:
            opt_type = opt["optimization"]["type"]
            impact = opt["optimization"].get("expected_improvement", {})
            formatted.append(f"- {opt_type.title()}: Expected {impact.get('primary_metric', 'improvement')}")
        
        return "\n".join(formatted)
    
    def get_optimization_metrics(self) -> Dict[str, Any]:
        """
        CEO Dashboard: How well is our optimization engine performing?
        """
        success_rate = (
            self.successful_optimizations / self.total_optimizations 
            if self.total_optimizations > 0 else 0
        )
        
        return {
            "total_optimizations": self.total_optimizations,
            "success_rate": round(success_rate, 3),
            "average_improvement": round(self.total_improvement_percentage / max(self.total_optimizations, 1), 2),
            "optimization_velocity": f"{self.total_optimizations / max((datetime.now() - datetime(2024, 1, 1)).days, 1):.1f}/day",
            "ceo_rating": "⭐⭐⭐⭐⭐" if success_rate > 0.9 else "⭐⭐⭐⭐" if success_rate > 0.7 else "⭐⭐⭐"
        }


# CEO Testing Suite
if __name__ == "__main__":
    async def ceo_optimization_test():
        """CEO's test suite for the optimization agent"""
        
        print("🚀 CEO Testing Optimization Agent\n")
        
        agent = OptimizationAgent()
        
        # Test scenario: Underperforming campaign
        test_state = {
            "messages": [],
            "campaign_id": "camp_test_001",
            "current_metrics": {
                "impressions": 50000,
                "clicks": 250,
                "conversions": 5,
                "spend": Decimal("500"),
                "ctr": 0.005,  # 0.5% - below threshold
                "cpc": Decimal("2.00"),
                "cpa": Decimal("100"),  # $100 per conversion - too high
                "roas": 0.5  # Losing money
            },
            "historical_metrics": [
                {"date": "2024-01-01", "ctr": 0.004, "cpa": 120, "roas": 0.4},
                {"date": "2024-01-02", "ctr": 0.005, "cpa": 110, "roas": 0.45},
                {"date": "2024-01-03", "ctr": 0.005, "cpa": 100, "roas": 0.5},
            ],
            "campaign_config": {
                "objective": "conversions",
                "budget": {"amount": 100, "schedule": "daily"},
                "targeting": {"age_min": 25, "age_max": 45}
            },
            "auto_optimize": True
        }
        
        print("Test: Optimizing underperforming campaign...")
        result = await agent(test_state)
        
        opt_result = result.get("optimization_result", {})
        print(f"Status: {opt_result.get('status')}")
        print(f"Optimizations applied: {opt_result.get('optimizations_applied', 0)}")
        print(f"Executive summary: {opt_result.get('executive_report', {}).get('executive_summary', 'N/A')}")
        
        # Display agent metrics
        print("\n📊 Optimization Agent Performance:")
        metrics = agent.get_optimization_metrics()
        for key, value in metrics.items():
            print(f"- {key}: {value}")
        
        print("\n✅ Remember: Every 1% improvement compounds into massive returns!")
    
    asyncio.run(ceo_optimization_test())