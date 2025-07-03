"""
Campaign Creation Workflow Example

This workflow demonstrates how to orchestrate multiple agents to create
a marketing campaign from natural language input.

Flow:
1. Supervisor receives user request
2. Campaign Parser extracts parameters
3. Campaign Creator builds structure
4. Content Generator creates ad copy
5. Compliance checks everything
6. Returns complete campaign for approval
"""

from typing import TypedDict, Annotated, Dict, Any, List, Literal
from datetime import datetime
import operator
import json

from langgraph.graph import StateGraph, END
from langgraph.checkpoint import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage


# State definition for the workflow
class CampaignCreationState(TypedDict):
    # Message history
    messages: Annotated[List[BaseMessage], operator.add]
    
    # User input
    user_request: str
    user_id: str
    session_id: str
    
    # Campaign parameters extracted from request
    campaign_params: Dict[str, Any]
    
    # Campaign structure
    campaign_structure: Dict[str, Any]
    
    # Generated content
    ad_content: Dict[str, Any]
    
    # Workflow control
    current_agent: str
    workflow_status: Literal["processing", "needs_clarification", "ready_for_review", "approved", "failed"]
    
    # Validation results
    compliance_status: Dict[str, Any]
    
    # Errors and warnings
    errors: List[str]
    warnings: List[str]
    
    # Human interaction
    needs_human_input: bool
    human_input_request: Dict[str, Any]
    
    # Final result
    final_campaign: Dict[str, Any]


# Mock agent implementations for demonstration
async def supervisor_agent(state: CampaignCreationState) -> CampaignCreationState:
    """
    Supervisor agent that orchestrates the workflow.
    Analyzes the request and determines next steps.
    """
    print(f"[Supervisor] Processing request: {state['user_request']}")
    
    # Add initial message
    state["messages"].append(
        AIMessage(content="I'll help you create a campaign. Let me analyze your requirements...")
    )
    
    # Simple routing logic (in production, use LLM for analysis)
    if "budget" not in state["user_request"].lower():
        state["workflow_status"] = "needs_clarification"
        state["needs_human_input"] = True
        state["human_input_request"] = {
            "question": "What's your budget for this campaign?",
            "field": "budget"
        }
    else:
        state["workflow_status"] = "processing"
        state["current_agent"] = "parser"
    
    return state


async def campaign_parser_agent(state: CampaignCreationState) -> CampaignCreationState:
    """
    Parses natural language request to extract campaign parameters.
    """
    print(f"[Parser] Extracting parameters from: {state['user_request']}")
    
    # Mock parameter extraction (in production, use NLP/LLM)
    state["campaign_params"] = {
        "objective": "conversions",
        "budget": {
            "amount": 500,
            "currency": "USD",
            "schedule": "weekly"
        },
        "targeting": {
            "age_min": 25,
            "age_max": 40,
            "genders": ["female"],
            "interests": ["yoga", "wellness", "fitness"],
            "locations": [{"country": "US", "cities": ["New York"]}]
        },
        "platforms": ["facebook", "instagram"],
        "duration": {
            "start": "2024-01-15",
            "end": "2024-02-15"
        }
    }
    
    state["messages"].append(
        AIMessage(content="I've extracted the following parameters from your request...")
    )
    
    state["current_agent"] = "creator"
    return state


async def campaign_creator_agent(state: CampaignCreationState) -> CampaignCreationState:
    """
    Creates the campaign structure based on parsed parameters.
    """
    print("[Creator] Building campaign structure...")
    
    params = state["campaign_params"]
    
    # Build campaign hierarchy
    state["campaign_structure"] = {
        "campaign": {
            "name": "Fitness App Promotion - Women 25-40 NYC",
            "objective": params["objective"],
            "status": "draft",
            "budget_optimization": True,
            "ad_sets": [
                {
                    "name": "Women 25-40 Yoga Enthusiasts",
                    "targeting": params["targeting"],
                    "budget": params["budget"],
                    "scheduling": {
                        "start_time": params["duration"]["start"],
                        "end_time": params["duration"]["end"]
                    },
                    "optimization_goal": "app_installs",
                    "billing_event": "impressions",
                    "bid_strategy": "lowest_cost"
                }
            ]
        }
    }
    
    state["messages"].append(
        AIMessage(content="I've created a campaign structure optimized for app installs...")
    )
    
    state["current_agent"] = "content_generator"
    return state


async def content_generator_agent(state: CampaignCreationState) -> CampaignCreationState:
    """
    Generates ad creative content based on campaign parameters.
    """
    print("[Content Generator] Creating ad content...")
    
    # Generate multiple ad variations
    state["ad_content"] = {
        "ads": [
            {
                "name": "Yoga App - Transform Your Practice",
                "format": "single_image",
                "creative": {
                    "headline": "Transform Your Yoga Practice",
                    "description": "Join thousands finding balance with our app",
                    "primary_text": "Discover personalized yoga flows designed for your goals. "
                                   "From beginner to advanced, find your perfect practice.",
                    "call_to_action": "INSTALL_NOW"
                },
                "placement_specific": {
                    "instagram_feed": {
                        "headline": "Your Personal Yoga Studio 🧘‍♀️"
                    },
                    "facebook_feed": {
                        "link_description": "Start your free trial today"
                    }
                }
            },
            {
                "name": "Yoga App - Wellness Journey",
                "format": "carousel",
                "creative": {
                    "cards": [
                        {
                            "headline": "Personalized Flows",
                            "description": "AI-powered recommendations"
                        },
                        {
                            "headline": "Track Progress",
                            "description": "See your wellness journey"
                        },
                        {
                            "headline": "Expert Instructors",
                            "description": "Learn from the best"
                        }
                    ],
                    "primary_text": "Start your wellness journey with guided yoga practices.",
                    "call_to_action": "LEARN_MORE"
                }
            }
        ],
        "recommendations": [
            "Use lifestyle images showing yoga practice",
            "Include app screenshots showing key features",
            "Test video content for higher engagement"
        ]
    }
    
    state["messages"].append(
        AIMessage(content="I've created 2 ad variations optimized for your target audience...")
    )
    
    state["current_agent"] = "compliance"
    return state


async def compliance_agent(state: CampaignCreationState) -> CampaignCreationState:
    """
    Checks campaign for policy compliance and best practices.
    """
    print("[Compliance] Checking campaign compliance...")
    
    # Mock compliance checks
    compliance_checks = {
        "policy_compliance": {
            "status": "passed",
            "checks": {
                "prohibited_content": "passed",
                "targeting_restrictions": "passed",
                "creative_guidelines": "passed"
            }
        },
        "best_practices": {
            "audience_size": "optimal",
            "budget_sufficiency": "adequate",
            "creative_diversity": "good"
        },
        "warnings": [
            "Consider adding male audience for broader reach",
            "Video content typically performs 2x better for app installs"
        ]
    }
    
    state["compliance_status"] = compliance_checks
    state["warnings"] = compliance_checks["warnings"]
    
    # Compile final campaign
    state["final_campaign"] = {
        "structure": state["campaign_structure"],
        "creative": state["ad_content"],
        "compliance": state["compliance_status"],
        "ready_to_launch": True,
        "estimated_reach": "50,000-75,000 people",
        "estimated_installs": "500-750 per week"
    }
    
    state["workflow_status"] = "ready_for_review"
    state["messages"].append(
        AIMessage(
            content="✅ Campaign is ready! It's compliant with all policies and optimized for success. "
                   "Would you like to review the details or make any adjustments?"
        )
    )
    
    return state


# Routing functions
def route_supervisor(state: CampaignCreationState) -> str:
    """Determine next step from supervisor"""
    if state["workflow_status"] == "needs_clarification":
        return "human_input"
    elif state["workflow_status"] == "processing":
        return "parser"
    else:
        return END


def route_after_human_input(state: CampaignCreationState) -> str:
    """Route after receiving human input"""
    if state.get("human_input_received"):
        return "supervisor"
    else:
        return END


def should_continue(state: CampaignCreationState) -> str:
    """Determine if workflow should continue or end"""
    if state["workflow_status"] == "ready_for_review":
        return END
    elif state["workflow_status"] == "failed":
        return END
    else:
        return "continue"


# Build the workflow
def create_campaign_workflow():
    """Create and compile the campaign creation workflow"""
    
    # Initialize the graph
    workflow = StateGraph(CampaignCreationState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor_agent)
    workflow.add_node("parser", campaign_parser_agent)
    workflow.add_node("creator", campaign_creator_agent)
    workflow.add_node("content_generator", content_generator_agent)
    workflow.add_node("compliance", compliance_agent)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add edges
    workflow.add_conditional_edges(
        "supervisor",
        route_supervisor,
        {
            "parser": "parser",
            "human_input": END,  # In production, handle human input
            END: END
        }
    )
    
    workflow.add_edge("parser", "creator")
    workflow.add_edge("creator", "content_generator")
    workflow.add_edge("content_generator", "compliance")
    workflow.add_edge("compliance", END)
    
    # Compile with memory
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory)
    
    return app


# Helper function to run the workflow
async def create_campaign_from_request(user_request: str, user_id: str = "demo_user"):
    """
    Create a campaign from a natural language request.
    
    Args:
        user_request: Natural language description of desired campaign
        user_id: ID of the user making the request
        
    Returns:
        Final campaign structure or error
    """
    # Initialize state
    initial_state = CampaignCreationState(
        messages=[HumanMessage(content=user_request)],
        user_request=user_request,
        user_id=user_id,
        session_id=f"session_{datetime.now().isoformat()}",
        campaign_params={},
        campaign_structure={},
        ad_content={},
        current_agent="supervisor",
        workflow_status="processing",
        compliance_status={},
        errors=[],
        warnings=[],
        needs_human_input=False,
        human_input_request={},
        final_campaign={}
    )
    
    # Create and run workflow
    app = create_campaign_workflow()
    
    # Execute workflow
    config = {"configurable": {"thread_id": f"campaign_creation_{user_id}"}}
    result = await app.ainvoke(initial_state, config)
    
    return result


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def demo():
        # Example user request
        request = """
        I want to promote my new fitness app to women aged 25-40 who are 
        interested in yoga and wellness. I'm targeting New York City with 
        a budget of $500 per week. Focus on Instagram and Facebook.
        """
        
        print("=== Campaign Creation Workflow Demo ===\n")
        print(f"User Request: {request}\n")
        print("Processing...\n")
        
        # Run the workflow
        result = await create_campaign_from_request(request)
        
        # Display results
        print("\n=== Workflow Results ===\n")
        print(f"Status: {result['workflow_status']}")
        print(f"Warnings: {result['warnings']}")
        
        if result["final_campaign"]:
            print("\n=== Final Campaign ===")
            print(json.dumps(result["final_campaign"], indent=2))
        
        print("\n=== Conversation History ===")
        for msg in result["messages"]:
            role = "Human" if isinstance(msg, HumanMessage) else "Assistant"
            print(f"\n{role}: {msg.content}")
    
    # Run the demo
    asyncio.run(demo())