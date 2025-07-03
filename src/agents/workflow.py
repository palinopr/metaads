"""
LangGraph Workflow for Campaign Creation
"""
from typing import Dict, Any, Literal
from datetime import datetime
from langgraph.graph import StateGraph, END
import uuid

from .state import CampaignState
from .supervisor import SupervisorAgent
from .parser import CampaignParserAgent
from .creative import CreativeGeneratorAgent
from .builder import CampaignBuilderAgent


# Initialize agents
supervisor = SupervisorAgent()
parser = CampaignParserAgent()
creative = CreativeGeneratorAgent()
builder = CampaignBuilderAgent()


def route_supervisor(state: Dict[str, Any]) -> Literal["parser", "creative", "builder", "END"]:
    """
    Router function for supervisor decisions
    """
    next_agent = state.get("next_agent")
    
    if next_agent == "END" or next_agent is None:
        return "END"
    
    return next_agent


async def initialize_state(user_request: str, user_id: str = None) -> CampaignState:
    """
    Initialize the state for a new campaign request
    """
    return {
        "user_request": user_request,
        "user_id": user_id,
        "session_id": str(uuid.uuid4()),
        "timestamp": datetime.now(),
        "processing_status": "initializing",
        "messages": [],
        "errors": [],
        "warnings": [],
        "current_agent": "supervisor",
        "next_agent": None
    }


def create_campaign_workflow() -> StateGraph:
    """
    Create the LangGraph workflow for campaign creation
    """
    # Define the graph
    workflow = StateGraph(CampaignState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor)
    workflow.add_node("parser", parser)
    workflow.add_node("creative", creative)
    workflow.add_node("builder", builder)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add edges
    # From supervisor, route based on decision
    workflow.add_conditional_edges(
        "supervisor",
        route_supervisor,
        {
            "parser": "parser",
            "creative": "creative", 
            "builder": "builder",
            "END": END
        }
    )
    
    # All other agents return to supervisor
    workflow.add_edge("parser", "supervisor")
    workflow.add_edge("creative", "supervisor")
    workflow.add_edge("builder", "supervisor")
    
    return workflow


# Create and compile the workflow
campaign_workflow = create_campaign_workflow()
app = campaign_workflow.compile()


async def process_campaign_request(
    user_request: str,
    user_id: str = None,
    stream_callback = None
) -> Dict[str, Any]:
    """
    Process a campaign request through the workflow
    
    Args:
        user_request: Natural language campaign request
        user_id: Optional user identifier
        stream_callback: Optional async callback for streaming updates
    
    Returns:
        Final state with campaign plan
    """
    # Initialize state
    initial_state = await initialize_state(user_request, user_id)
    
    # Process through workflow
    final_state = initial_state
    async for output in app.astream(initial_state):
        # Get the agent that just ran
        agent_name = list(output.keys())[0] if output else "unknown"
        agent_state = list(output.values())[0] if output else {}
        
        # Update final state
        final_state = agent_state
        
        # Stream update if callback provided
        if stream_callback and agent_name != "supervisor":
            await stream_callback({
                "agent": agent_name,
                "status": agent_state.get("processing_status"),
                "message": agent_state.get("messages", [])[-1] if agent_state.get("messages") else None,
                "progress": _calculate_progress(agent_state)
            })
    
    return final_state


def _calculate_progress(state: Dict[str, Any]) -> float:
    """
    Calculate progress percentage based on what's completed
    """
    steps = {
        "parsed": 25,
        "creative": 50,
        "plan": 75,
        "complete": 100
    }
    
    progress = 0
    if state.get("campaign_objective"):
        progress = max(progress, steps["parsed"])
    if state.get("ad_creative"):
        progress = max(progress, steps["creative"])
    if state.get("campaign_plan"):
        progress = max(progress, steps["plan"])
    if state.get("processing_status") == "complete":
        progress = steps["complete"]
    
    return progress


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def test_workflow():
        request = "I want to promote my fitness app to millennials in California with a $5000 budget"
        
        # Process request
        result = await process_campaign_request(request)
        
        # Print results
        print(f"Status: {result.get('processing_status')}")
        print(f"Campaign Name: {result.get('campaign_name')}")
        print(f"Budget: ${result.get('budget')}")
        print(f"Errors: {result.get('errors')}")
        print(f"Messages: {len(result.get('messages', []))}")
    
    asyncio.run(test_workflow())