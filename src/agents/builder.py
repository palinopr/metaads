"""
Campaign Builder Agent - Structures campaign for Meta Ads API
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta

from .base import BaseMarketingAgent
from .state import CampaignState
from .tools.openai_tools import optimize_campaign_parameters


class CampaignBuilderAgent(BaseMarketingAgent):
    """
    Builds the final campaign structure ready for Meta Ads API
    """
    
    def __init__(self):
        super().__init__(
            name="builder",
            description="Structures campaign data for Meta Ads API"
        )
        
        # Meta Ads campaign structure
        self.optimization_goals = {
            "AWARENESS": "REACH",
            "TRAFFIC": "LINK_CLICKS", 
            "ENGAGEMENT": "POST_ENGAGEMENT",
            "LEADS": "LEAD_GENERATION",
            "APP_PROMOTION": "APP_INSTALLS",
            "SALES": "PURCHASE",
            "CONVERSIONS": "CONVERSIONS"
        }
        
        self.billing_events = {
            "REACH": "IMPRESSIONS",
            "LINK_CLICKS": "LINK_CLICKS",
            "POST_ENGAGEMENT": "POST_ENGAGEMENT",
            "LEAD_GENERATION": "IMPRESSIONS",
            "APP_INSTALLS": "IMPRESSIONS",
            "PURCHASE": "IMPRESSIONS",
            "CONVERSIONS": "IMPRESSIONS"
        }
    
    async def process(self, state: CampaignState) -> CampaignState:
        """
        Build complete campaign structure
        """
        # Validate required fields
        required = [
            "campaign_objective", "budget", "target_audience", "ad_creative"
        ]
        if not self.validate_required_fields(state, required):
            state["next_agent"] = "supervisor"
            return state
        
        self.logger.info(
            "building_campaign",
            objective=state.get("campaign_objective"),
            budget=state.get("budget")
        )
        
        # Update status
        state["processing_status"] = "building"
        
        try:
            # Get optimization recommendations
            optimization = await self.call_api_with_retry(
                optimize_campaign_parameters,
                objective=state["campaign_objective"],
                budget=state["budget"],
                duration_days=state.get("duration_days", 30),
                target_audience=state["target_audience"]
            )
            
            # Build campaign structure
            campaign_plan = self._build_campaign_structure(state, optimization)
            
            # Add to state
            state["campaign_plan"] = campaign_plan
            
            # Extract expected results
            if "expected_results" in optimization:
                for key, value in optimization["expected_results"].items():
                    state[f"estimated_{key}"] = value
            
            # Add final message
            self._add_summary_message(state, campaign_plan)
            
        except Exception as e:
            self.logger.error("campaign_building_failed", error=str(e))
            state["errors"].append(f"Failed to build campaign: {str(e)}")
        
        # Return to supervisor
        state["next_agent"] = "supervisor"
        return state
    
    def _build_campaign_structure(
        self, 
        state: CampaignState,
        optimization: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build the complete campaign structure
        """
        objective = state["campaign_objective"]
        budget = state["budget"]
        duration = state.get("duration_days", 30)
        
        # Calculate dates
        start_date = datetime.now()
        end_date = start_date + timedelta(days=duration)
        
        # Build campaign
        campaign = {
            "name": state.get("campaign_name", f"{objective} Campaign - {start_date.strftime('%B %Y')}"),
            "objective": objective,
            "status": "PAUSED",  # Start paused for review
            "special_ad_categories": [],  # Will be set based on content
            "start_time": start_date.isoformat(),
            "end_time": end_date.isoformat() if duration < 365 else None,
            
            # Budget
            "budget": {
                "amount": budget * 100,  # Convert to cents
                "currency": "USD",
                "type": state.get("budget_type", "daily").upper()
            },
            
            # Ad Sets
            "adsets": [
                self._build_adset(state, optimization, is_primary=True)
            ],
            
            # Optimization recommendations
            "optimization_recommendations": optimization.get("recommendations", {}),
            
            # Tracking
            "tracking_specs": {
                "fb_pixel": None,  # To be configured
                "custom_events": []
            }
        }
        
        # Add test adset if budget allows
        if budget > 50 and state.get("ad_variations"):
            campaign["adsets"].append(
                self._build_adset(state, optimization, is_primary=False)
            )
        
        return campaign
    
    def _build_adset(
        self, 
        state: CampaignState,
        optimization: Dict[str, Any],
        is_primary: bool = True
    ) -> Dict[str, Any]:
        """
        Build an ad set structure
        """
        objective = state["campaign_objective"]
        optimization_goal = self.optimization_goals[objective]
        
        # Budget allocation
        budget = state["budget"]
        if not is_primary and state.get("ad_variations"):
            # Allocate 20% to test variations
            budget = budget * 0.2
        elif state.get("ad_variations"):
            # Primary gets 80%
            budget = budget * 0.8
        
        adset = {
            "name": f"{objective} AdSet {'Primary' if is_primary else 'Test'}",
            "optimization_goal": optimization_goal,
            "billing_event": self.billing_events[optimization_goal],
            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
            "daily_budget": int(budget * 100),  # Convert to cents
            
            # Targeting
            "targeting": self._build_targeting(state["target_audience"]),
            
            # Placements
            "placements": {
                "device_platforms": ["mobile", "desktop"],
                "publisher_platforms": ["facebook", "instagram"],
                "instagram_positions": ["stream", "story", "reels"],
                "facebook_positions": ["feed", "right_hand_column", "instant_article"]
            },
            
            # Schedule
            "schedule": optimization.get("recommendations", {}).get("schedule"),
            
            # Ads
            "ads": [
                self._build_ad(
                    state["ad_creative"] if is_primary 
                    else (state.get("ad_variations", [{}])[1] if len(state.get("ad_variations", [])) > 1 else state["ad_creative"]),
                    state
                )
            ]
        }
        
        return adset
    
    def _build_targeting(self, audience: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build targeting specification
        """
        targeting = {
            "age_min": audience.get("age_min", 18),
            "age_max": audience.get("age_max", 65),
            "genders": self._process_genders(audience.get("genders", ["all"])),
            "geo_locations": audience.get("geo_locations", {"countries": ["US"]}),
            "locales": ["en_US"],  # Default to English
        }
        
        # Add interests if specified
        if interests := audience.get("interests"):
            targeting["interests"] = [
                {"name": interest} for interest in interests[:10]  # Max 10
            ]
        
        # Add behaviors if specified
        if behaviors := audience.get("behaviors"):
            targeting["behaviors"] = [
                {"name": behavior} for behavior in behaviors[:5]
            ]
        
        # Exclude already converted users (if applicable)
        if audience.get("exclude_converters"):
            targeting["exclusions"] = {
                "custom_audiences": ["website_converters_180d"]
            }
        
        return targeting
    
    def _process_genders(self, genders: List[str]) -> List[int]:
        """
        Convert gender strings to Meta API format
        """
        if "all" in genders:
            return [1, 2]  # Male and Female
        
        gender_map = {"male": 1, "female": 2}
        return [gender_map.get(g.lower(), 1) for g in genders]
    
    def _build_ad(self, creative: Dict[str, Any], state: CampaignState) -> Dict[str, Any]:
        """
        Build ad structure
        """
        return {
            "name": creative.get("headline", "Ad")[:40],
            "status": "PAUSED",
            "creative": {
                "title": creative.get("headline"),
                "body": creative.get("primary_text"),
                "description": creative.get("description"),
                "call_to_action": {
                    "type": creative.get("cta", "LEARN_MORE")
                },
                "image": {
                    "url": creative.get("image_url"),  # To be added
                    "alt_text": creative.get("headline")
                },
                "link": state.get("landing_page_url", "https://example.com")
            },
            "tracking": {
                "url_parameters": "utm_source=facebook&utm_medium=cpc&utm_campaign=" + 
                                state.get("campaign_name", "campaign").replace(" ", "_").lower()
            }
        }
    
    def _add_summary_message(self, state: CampaignState, campaign_plan: Dict[str, Any]):
        """
        Add a summary message for the user
        """
        budget = state["budget"]
        duration = state.get("duration_days", 30)
        total_budget = budget * duration if state.get("budget_type") == "daily" else budget
        
        reach = state.get("estimated_reach", total_budget * 100)
        clicks = state.get("estimated_clicks", total_budget * 5)
        
        message = f"""
## Campaign Ready! 🚀

I've created a comprehensive campaign plan for you:

**Campaign Overview:**
- Objective: {state['campaign_objective']}
- Budget: ${budget:,.2f} {state.get('budget_type', 'daily')}
- Duration: {duration} days
- Total Investment: ${total_budget:,.2f}

**Expected Performance:**
- Estimated Reach: {reach:,} people
- Estimated Clicks: {clicks:,}
- Cost per Click: ${(total_budget / clicks if clicks > 0 else 0):.2f}

**Targeting:**
- Age: {state['target_audience'].get('age_min')}-{state['target_audience'].get('age_max')}
- Location: {', '.join(state['target_audience'].get('geo_locations', {}).get('countries', ['US']))}

**Creative:**
"{state['ad_creative']['headline']}"

The campaign is structured and ready to launch! It will start in a paused state so you can review everything before going live.
"""
        
        self.add_message(state, "assistant", message)