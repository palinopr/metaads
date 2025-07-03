"""
Campaign Parser Agent - Extracts structured data from natural language
"""
import json
import re
from typing import Dict, Any, Optional

from .base import BaseMarketingAgent
from .state import CampaignState
from .tools.openai_tools import parse_campaign_request


class CampaignParserAgent(BaseMarketingAgent):
    """
    Parses natural language requests into structured campaign data
    """
    
    def __init__(self):
        super().__init__(
            name="parser",
            description="Extracts campaign parameters from natural language"
        )
        
        # Common patterns for budget extraction
        self.budget_patterns = [
            r'\$?([\d,]+(?:\.\d{2})?)\s*(?:dollars?|usd)?',
            r'budget\s*(?:of|is)?\s*\$?([\d,]+)',
            r'spend\s*\$?([\d,]+)',
        ]
        
        # Campaign objective keywords
        self.objective_keywords = {
            "AWARENESS": ["awareness", "brand", "reach", "exposure"],
            "TRAFFIC": ["traffic", "visits", "website", "clicks"],
            "ENGAGEMENT": ["engagement", "likes", "comments", "shares"],
            "LEADS": ["leads", "lead", "contacts", "email", "signup"],
            "APP_PROMOTION": ["app", "download", "install", "mobile"],
            "SALES": ["sales", "purchase", "buy", "shop", "ecommerce"],
            "CONVERSIONS": ["conversions", "convert", "action", "sign up"]
        }
    
    async def process(self, state: CampaignState) -> CampaignState:
        """
        Parse the user request and extract campaign parameters
        """
        user_request = state.get("user_request", "")
        
        if not user_request:
            state["errors"].append("No user request provided")
            return state
        
        self.logger.info("parsing_request", request_length=len(user_request))
        
        # Update status
        state["processing_status"] = "parsing"
        
        # First try to extract obvious parameters
        quick_parse = self._quick_parse(user_request)
        
        # Then use GPT-4 for comprehensive parsing
        try:
            parsed_data = await self.call_api_with_retry(
                parse_campaign_request,
                user_request,
                quick_parse
            )
            
            # Merge results into state
            state = self._merge_parsed_data(state, parsed_data)
            
            # Validate parsed data
            if self._validate_parsed_data(state):
                state["confidence_score"] = parsed_data.get("confidence", 0.8)
                self.add_message(
                    state,
                    "assistant",
                    f"I understand! You want to run a {state['campaign_objective']} campaign "
                    f"with a ${state['budget']:,.0f} budget. Let me create the perfect campaign for you."
                )
            else:
                state["warnings"].append("Some campaign details may need clarification")
                
        except Exception as e:
            self.logger.error("parsing_failed", error=str(e))
            state["errors"].append(f"Failed to parse request: {str(e)}")
        
        # Always return to supervisor
        state["next_agent"] = "supervisor"
        return state
    
    def _quick_parse(self, text: str) -> Dict[str, Any]:
        """
        Quick extraction of obvious parameters using regex
        """
        result = {}
        
        # Extract budget
        for pattern in self.budget_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                budget_str = match.group(1).replace(',', '')
                try:
                    result["budget"] = float(budget_str)
                    break
                except ValueError:
                    pass
        
        # Detect objective
        text_lower = text.lower()
        for objective, keywords in self.objective_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                result["campaign_objective"] = objective
                break
        
        # Extract location mentions
        locations = []
        location_patterns = [
            r'in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'target(?:ing)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        ]
        for pattern in location_patterns:
            matches = re.findall(pattern, text)
            locations.extend(matches)
        
        if locations:
            result["locations"] = list(set(locations))
        
        return result
    
    def _merge_parsed_data(
        self, 
        state: CampaignState, 
        parsed_data: Dict[str, Any]
    ) -> CampaignState:
        """
        Merge parsed data into state
        """
        # Direct mappings
        direct_fields = [
            "campaign_objective", "budget", "budget_type",
            "duration_days", "start_date", "campaign_name"
        ]
        
        for field in direct_fields:
            if field in parsed_data and parsed_data[field] is not None:
                state[field] = parsed_data[field]
        
        # Handle target audience
        if "target_audience" in parsed_data:
            state["target_audience"] = parsed_data["target_audience"]
        
        # Add any warnings from parsing
        if "warnings" in parsed_data:
            state["warnings"].extend(parsed_data["warnings"])
        
        return state
    
    def _validate_parsed_data(self, state: CampaignState) -> bool:
        """
        Validate that we have minimum required data
        """
        # Must have objective and budget
        if not state.get("campaign_objective"):
            state["warnings"].append("Could not determine campaign objective")
            # Set a default
            state["campaign_objective"] = "TRAFFIC"
        
        if state.get("budget") is None:
            state["errors"].append("Budget is required but was not specified")
            return False
        
        # Validate budget is reasonable
        budget = state.get("budget", 0)
        if budget < 5:
            state["errors"].append(f"Budget ${budget} is too low. Minimum is $5/day")
            return False
        elif budget > 1000000:
            state["warnings"].append(f"Budget ${budget} is very high. Please confirm this is correct")
        
        # Ensure we have some audience data
        if not state.get("target_audience"):
            # Set defaults
            state["target_audience"] = {
                "age_min": 18,
                "age_max": 65,
                "genders": ["all"],
                "geo_locations": {"countries": ["US"]}
            }
            state["warnings"].append("Using default audience targeting")
        
        return True