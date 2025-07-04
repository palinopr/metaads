"""
Supervisor Agent - Orchestrates the campaign creation workflow
"""
from typing import Dict, Any, Literal

from .base import BaseMarketingAgent
from .state import CampaignState


class SupervisorAgent(BaseMarketingAgent):
    """
    Supervisor agent that routes work to specialist agents based on state
    """
    
    def __init__(self):
        super().__init__(
            name="supervisor",
            description="Orchestrates the campaign creation workflow"
        )
    
    async def process(self, state: CampaignState) -> CampaignState:
        """
        Analyze state and determine next agent to invoke
        """
        self.logger.info(
            "supervisor_analyzing",
            status=state.get("processing_status"),
            has_objective=bool(state.get("campaign_objective")),
            has_budget=bool(state.get("budget")),
            has_creative=bool(state.get("ad_creative"))
        )
        
        # Initialize if needed
        if not state.get("processing_status"):
            state["processing_status"] = "initializing"
            state["messages"] = []
            state["errors"] = []
            state["warnings"] = []
        
        # Determine next step based on current state
        next_agent = self._determine_next_agent(state)
        
        self.logger.info("supervisor_decision", next_agent=next_agent)
        
        if next_agent == "END":
            state["processing_status"] = "complete"
            state["next_agent"] = None
            self.add_message(
                state, 
                "assistant", 
                "Your campaign plan is ready! I've analyzed your requirements and created a comprehensive marketing strategy."
            )
        else:
            state["next_agent"] = next_agent
        
        return state
    
    def _determine_next_agent(self, state: CampaignState) -> str:
        """
        Determine which agent should process next based on current state
        """
        # If we have errors, we're done
        if state.get("errors") and len(state["errors"]) > 2:
            self.logger.error("too_many_errors", error_count=len(state["errors"]))
            return "END"
        
        # If status is complete, we're done
        if state.get("processing_status") == "complete":
            return "END"
        
        # Check what we're missing
        has_parsed_data = all([
            state.get("campaign_objective"),
            state.get("budget") is not None,
            state.get("target_audience")
        ])
        
        has_creative = bool(state.get("ad_creative"))
        has_campaign_plan = bool(state.get("campaign_plan"))
        
        # Routing logic
        if not has_parsed_data:
            # Need to parse the user request
            return "parser"
        
        elif not has_creative:
            # Need to generate creative content
            return "creative"
        
        elif not has_campaign_plan:
            # Need to build the campaign structure
            return "builder"
        
        else:
            # Everything is ready
            return "END"
    
    def _validate_completeness(self, state: CampaignState) -> bool:
        """
        Validate that we have everything needed for a complete campaign
        """
        required_fields = [
            "campaign_objective",
            "budget",
            "target_audience",
            "ad_creative",
            "campaign_plan"
        ]
        
        for field in required_fields:
            if field not in state or state[field] is None:
                self.logger.warning(
                    "incomplete_campaign",
                    missing_field=field
                )
                return False
        
        return True