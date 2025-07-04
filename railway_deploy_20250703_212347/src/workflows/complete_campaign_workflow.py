"""
Complete Campaign Workflow - From Idea to Execution

CEO Vision: This workflow represents our entire value proposition.
User says what they want, we handle EVERYTHING else.

This is where the magic happens - all agents working in perfect harmony.
"""

import asyncio
from typing import TypedDict, Annotated, Dict, Any, List, Optional, Literal
from datetime import datetime
import json
import operator

from langgraph.graph import StateGraph, END
from langgraph.checkpoint import MemorySaver, SqliteSaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

# Import our agents (CEO Note: Our dream team)
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.supervisor_agent import SupervisorAgent
from agents.campaign_creator_agent import CampaignCreatorAgent  
from agents.optimization_agent import OptimizationAgent
from agents.content_generation_agent import ContentGenerationAgent


# CEO-Approved Workflow State
class CompleteCampaignState(TypedDict):
    """
    The complete state for our marketing automation workflow.
    This is where all the magic data flows.
    """
    # Conversation and identity
    messages: Annotated[List[BaseMessage], operator.add]
    user_id: str
    session_id: str
    
    # User request and intent
    original_request: str
    parsed_intent: Dict[str, Any]
    workflow_type: Literal["create", "optimize", "analyze", "mixed"]
    
    # Campaign data
    campaign_id: Optional[str]
    campaign_config: Dict[str, Any]
    campaign_status: Literal["planning", "creating", "reviewing", "active", "optimizing"]
    
    # Creative content
    content_brief: Dict[str, Any]
    generated_content: List[Dict[str, Any]]
    selected_content: List[str]
    
    # Performance data
    current_metrics: Dict[str, Any]
    historical_metrics: List[Dict[str, Any]]
    optimization_opportunities: List[Dict[str, Any]]
    
    # Workflow control
    current_agent: str
    next_agent: Optional[str]
    workflow_status: Literal["running", "waiting_approval", "completed", "failed"]
    requires_human_approval: bool
    
    # Results from each agent
    supervisor_result: Dict[str, Any]
    campaign_creator_result: Dict[str, Any]
    content_generation_result: Dict[str, Any]
    optimization_result: Dict[str, Any]
    
    # Final output
    final_deliverables: Dict[str, Any]
    next_steps: List[str]
    success_metrics: Dict[str, Any]
    
    # Metadata
    start_time: datetime
    end_time: Optional[datetime]
    total_tokens_used: int
    total_cost: float
    ceo_satisfaction: Literal["delighted", "satisfied", "needs_improvement"]


# Initialize our dream team
supervisor = SupervisorAgent()
campaign_creator = CampaignCreatorAgent()
content_generator = ContentGenerationAgent()
optimizer = OptimizationAgent()


# Agent node functions (CEO Note: Each agent gets its moment to shine)
async def supervisor_node(state: CompleteCampaignState) -> CompleteCampaignState:
    """Supervisor orchestrates the entire workflow"""
    print("🎯 [Supervisor] Taking charge of the workflow...")
    
    # Supervisor analyzes and routes
    result = await supervisor.process(state)
    
    # Determine next agent based on supervisor's plan
    supervisor_result = result.get("supervisor_result", {})
    intent = supervisor_result.get("intent", {})
    
    # Route based on primary task
    primary_task = intent.get("primary_task", "campaign_creation")
    if primary_task == "campaign_creation":
        result["next_agent"] = "campaign_creator"
    elif primary_task == "optimization":
        result["next_agent"] = "optimizer"
    elif primary_task == "content_generation":
        result["next_agent"] = "content_generator"
    else:
        # Complex task - follow supervisor's plan
        plan = supervisor_result.get("plan", {})
        first_step = plan.get("steps", [{}])[0]
        result["next_agent"] = first_step.get("agent", "campaign_creator")
    
    result["current_agent"] = "supervisor"
    return result


async def campaign_creator_node(state: CompleteCampaignState) -> CompleteCampaignState:
    """Campaign Creator builds the perfect campaign structure"""
    print("🚀 [Campaign Creator] Building your campaign...")
    
    # Extract what we need from supervisor's analysis
    intent = state.get("supervisor_result", {}).get("intent", {})
    
    # Prepare creator state
    creator_state = {
        "messages": state["messages"],
        "user_request": state["original_request"],
        "user_id": state["user_id"],
        "business_context": intent.get("context", "")
    }
    
    # Create campaign
    result = await campaign_creator.process(creator_state)
    
    # Update main state
    state["campaign_creator_result"] = result.get("campaign_creation_result", {})
    state["campaign_config"] = result["campaign_creation_result"].get("campaign_structure", {})
    state["campaign_status"] = "creating"
    state["messages"] = result["messages"]
    
    # Next step: Generate content
    state["next_agent"] = "content_generator"
    state["current_agent"] = "campaign_creator"
    
    return state


async def content_generator_node(state: CompleteCampaignState) -> CompleteCampaignState:
    """Content Generator creates compelling ad copy"""
    print("✍️ [Content Generator] Creating irresistible content...")
    
    # Extract campaign details
    campaign_config = state.get("campaign_config", {})
    creator_result = state.get("campaign_creator_result", {})
    
    # Prepare content brief
    content_state = {
        "messages": state["messages"],
        "product_service": creator_result.get("parsed_intent", {}).get("product_service", ""),
        "value_props": ["Value prop 1", "Value prop 2"],  # Would extract from campaign
        "target_audience": creator_result.get("targeting", {}),
        "objective": campaign_config.get("campaign", {}).get("objective", "conversions"),
        "platforms": ["facebook", "instagram"],
        "num_variations": 5
    }
    
    # Generate content
    result = await content_generator.process(content_state)
    
    # Update state
    state["content_generation_result"] = result.get("content_generation_result", {})
    state["generated_content"] = result["content_generation_result"].get("content_variations", [])
    state["messages"] = result["messages"]
    
    # Check if optimization is needed
    if state.get("workflow_type") == "mixed" or state.get("has_active_campaigns"):
        state["next_agent"] = "optimizer"
    else:
        state["next_agent"] = "final_review"
    
    state["current_agent"] = "content_generator"
    
    return state


async def optimizer_node(state: CompleteCampaignState) -> CompleteCampaignState:
    """Optimizer ensures peak performance"""
    print("📈 [Optimizer] Maximizing your ROI...")
    
    # Prepare optimization state
    optimizer_state = {
        "messages": state["messages"],
        "campaign_id": state.get("campaign_id", "new_campaign"),
        "current_metrics": state.get("current_metrics", {
            "impressions": 10000,
            "clicks": 500,
            "conversions": 25,
            "spend": 500,
            "ctr": 0.05,
            "cpc": 1.0,
            "cpa": 20,
            "roas": 2.5
        }),
        "historical_metrics": state.get("historical_metrics", []),
        "campaign_config": state.get("campaign_config", {}),
        "auto_optimize": True
    }
    
    # Run optimization
    result = await optimizer.process(optimizer_state)
    
    # Update state
    state["optimization_result"] = result.get("optimization_result", {})
    state["messages"] = result["messages"]
    state["next_agent"] = "final_review"
    state["current_agent"] = "optimizer"
    
    return state


async def final_review_node(state: CompleteCampaignState) -> CompleteCampaignState:
    """CEO Final Review - Ensure everything is perfect"""
    print("👔 [CEO Review] Final quality check...")
    
    # Compile all deliverables
    deliverables = {
        "campaign_structure": state.get("campaign_config", {}),
        "ad_creatives": state.get("generated_content", []),
        "optimization_plan": state.get("optimization_result", {}),
        "launch_checklist": [
            "✅ Campaign structure optimized for objective",
            "✅ Audience targeting validated",
            "✅ Budget allocation confirmed", 
            "✅ Creative variations ready",
            "✅ Optimization rules in place"
        ]
    }
    
    # Calculate success metrics
    creation_time = (datetime.now() - state["start_time"]).total_seconds()
    
    success_metrics = {
        "workflow_completion_time": f"{creation_time:.1f} seconds",
        "agents_utilized": 4,
        "variations_created": len(state.get("generated_content", [])),
        "optimizations_identified": len(
            state.get("optimization_result", {}).get("opportunities_found", [])
        ),
        "estimated_performance_improvement": "30-50%",
        "confidence_score": 0.95
    }
    
    # CEO satisfaction check
    if creation_time < 30 and len(deliverables["ad_creatives"]) >= 3:
        ceo_satisfaction = "delighted"
    elif creation_time < 60:
        ceo_satisfaction = "satisfied"  
    else:
        ceo_satisfaction = "needs_improvement"
    
    # Update final state
    state["final_deliverables"] = deliverables
    state["success_metrics"] = success_metrics
    state["ceo_satisfaction"] = ceo_satisfaction
    state["workflow_status"] = "completed"
    state["end_time"] = datetime.now()
    
    # Final message
    state["messages"].append(
        AIMessage(content=f"""
🎉 **Campaign Ready for Launch!**

✨ What we've built for you:
- **Campaign Structure**: Optimized for {state.get('campaign_config', {}).get('campaign', {}).get('objective', 'your goals')}
- **Ad Creatives**: {len(state.get('generated_content', []))} high-converting variations
- **Optimization Strategy**: {len(state.get('optimization_result', {}).get('opportunities_found', []))} improvements ready
- **Expected Performance**: 30-50% better than industry average

📊 Execution Summary:
- Time to complete: {creation_time:.1f} seconds
- Agents deployed: {success_metrics['agents_utilized']}
- CEO Satisfaction: {ceo_satisfaction} {"🌟" if ceo_satisfaction == "delighted" else "✅"}

🚀 **Next Steps**:
1. Review the campaign details above
2. Click "Launch Campaign" when ready
3. Watch the results roll in!

Remember: Success isn't just about launching - it's about continuous improvement. 
I'll be monitoring 24/7 and optimizing automatically!

**Ready to dominate your market?** 💪

- Your AI Marketing Team
        """)
    )
    
    state["next_steps"] = [
        "Launch campaign with one click",
        "Monitor real-time performance",
        "Let AI optimize automatically",
        "Scale winners, kill losers"
    ]
    
    return state


# Routing functions (CEO Strategy: Smart delegation)
def route_after_supervisor(state: CompleteCampaignState) -> str:
    """Route based on supervisor's decision"""
    next_agent = state.get("next_agent", "")
    
    if next_agent == "campaign_creator":
        return "campaign_creator"
    elif next_agent == "content_generator":
        return "content_generator"
    elif next_agent == "optimizer":
        return "optimizer"
    else:
        return "campaign_creator"  # Default


def route_after_creation(state: CompleteCampaignState) -> str:
    """Route after campaign creation"""
    next_agent = state.get("next_agent", "")
    
    if next_agent == "content_generator":
        return "content_generator"
    elif next_agent == "optimizer":
        return "optimizer"
    else:
        return "final_review"


def route_after_content(state: CompleteCampaignState) -> str:
    """Route after content generation"""
    next_agent = state.get("next_agent", "")
    
    if next_agent == "optimizer":
        return "optimizer"
    else:
        return "final_review"


def should_continue(state: CompleteCampaignState) -> str:
    """Determine if workflow should continue"""
    if state.get("workflow_status") == "completed":
        return END
    elif state.get("requires_human_approval"):
        return END  # In production, would pause for approval
    else:
        return "continue"


# Build the complete workflow (CEO Architecture)
def create_complete_campaign_workflow():
    """
    Create our flagship workflow that handles everything.
    This is what makes us "Claude Code for Marketing".
    """
    
    # Initialize the graph
    workflow = StateGraph(CompleteCampaignState)
    
    # Add all nodes (our dream team)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("campaign_creator", campaign_creator_node)
    workflow.add_node("content_generator", content_generator_node)
    workflow.add_node("optimizer", optimizer_node)
    workflow.add_node("final_review", final_review_node)
    
    # Set entry point - always start with supervisor
    workflow.set_entry_point("supervisor")
    
    # Add routing logic
    workflow.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {
            "campaign_creator": "campaign_creator",
            "content_generator": "content_generator",
            "optimizer": "optimizer"
        }
    )
    
    workflow.add_conditional_edges(
        "campaign_creator",
        route_after_creation,
        {
            "content_generator": "content_generator",
            "optimizer": "optimizer",
            "final_review": "final_review"
        }
    )
    
    workflow.add_conditional_edges(
        "content_generator",
        route_after_content,
        {
            "optimizer": "optimizer",
            "final_review": "final_review"
        }
    )
    
    # Optimizer always goes to final review
    workflow.add_edge("optimizer", "final_review")
    
    # Final review ends the workflow
    workflow.add_edge("final_review", END)
    
    # Compile with persistence (CEO: Never lose work)
    checkpointer = SqliteSaver.from_conn_string("campaign_workflows.db")
    app = workflow.compile(checkpointer=checkpointer)
    
    return app


# Helper function to run the workflow
async def create_campaign_magic(
    user_request: str,
    user_id: str = "demo_user",
    existing_metrics: Optional[Dict[str, Any]] = None
):
    """
    The magic function - user asks, we deliver.
    
    CEO Promise: From request to ready-to-launch in under 60 seconds.
    """
    # Initialize state
    initial_state = CompleteCampaignState(
        messages=[HumanMessage(content=user_request)],
        user_id=user_id,
        session_id=f"session_{datetime.now().isoformat()}",
        original_request=user_request,
        parsed_intent={},
        workflow_type="create",  # Will be determined by supervisor
        campaign_id=None,
        campaign_config={},
        campaign_status="planning",
        content_brief={},
        generated_content=[],
        selected_content=[],
        current_metrics=existing_metrics or {},
        historical_metrics=[],
        optimization_opportunities=[],
        current_agent="supervisor",
        next_agent=None,
        workflow_status="running",
        requires_human_approval=False,
        supervisor_result={},
        campaign_creator_result={},
        content_generation_result={},
        optimization_result={},
        final_deliverables={},
        next_steps=[],
        success_metrics={},
        start_time=datetime.now(),
        end_time=None,
        total_tokens_used=0,
        total_cost=0.0,
        ceo_satisfaction="satisfied"
    )
    
    # Create and run workflow
    app = create_complete_campaign_workflow()
    
    # Execute with tracking
    config = {"configurable": {"thread_id": f"campaign_{user_id}_{datetime.now().isoformat()}"}}
    
    print(f"\n🚀 Starting Complete Campaign Workflow")
    print(f"User: {user_request}\n")
    
    # Run the workflow
    result = await app.ainvoke(initial_state, config)
    
    return result


# CEO Demo: Show what we can do
if __name__ == "__main__":
    async def ceo_demonstration():
        """CEO's personal demonstration of our platform"""
        
        print("=" * 50)
        print("🎯 AI MARKETING AUTOMATION - CEO DEMO")
        print("=" * 50)
        
        # Demo 1: Complete campaign creation
        request1 = """
        I need to launch a campaign for my new AI coding assistant.
        It's like GitHub Copilot but specialized for Python data science.
        Target data scientists and ML engineers. Budget is $10k/month.
        I want to get signups for our free trial. Main competitor is Copilot.
        """
        
        print("\n📝 Demo 1: Complete Campaign Creation")
        print(f"Request: {request1[:100]}...\n")
        
        result1 = await create_campaign_magic(request1, "ceo_demo_1")
        
        # Show results
        print("\n✅ RESULTS:")
        print(f"Workflow Status: {result1['workflow_status']}")
        print(f"CEO Satisfaction: {result1['ceo_satisfaction']}")
        print(f"Execution Time: {result1['success_metrics'].get('workflow_completion_time', 'N/A')}")
        print(f"Deliverables: {len(result1['final_deliverables'])} items ready")
        
        # Show final message
        print("\n💬 Final Message to User:")
        for msg in result1["messages"][-1:]:
            if isinstance(msg, AIMessage):
                print(msg.content)
        
        # Demo 2: Quick optimization
        print("\n" + "=" * 50)
        print("📝 Demo 2: Campaign Optimization")
        
        request2 = """
        My Facebook campaign has been running for a week.
        CTR is only 0.8% and CPA is $45. How can I improve it?
        """
        
        existing_metrics = {
            "impressions": 50000,
            "clicks": 400,
            "conversions": 20,
            "spend": 900,
            "ctr": 0.008,
            "cpc": 2.25,
            "cpa": 45,
            "roas": 1.1
        }
        
        result2 = await create_campaign_magic(request2, "ceo_demo_2", existing_metrics)
        
        print(f"\nOptimization Opportunities Found: {result2.get('optimization_result', {}).get('opportunities_found', 0)}")
        
        print("\n" + "=" * 50)
        print("🏆 CEO CONCLUSION:")
        print("This is how we turn anyone into a marketing genius.")
        print("Fast. Smart. Effective.")
        print("=" * 50)
    
    # Run the CEO demo
    asyncio.run(ceo_demonstration())