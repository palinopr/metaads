"""
Creative Generator Agent - Creates compelling ad content
"""
from typing import Dict, Any

from .base import BaseMarketingAgent
from .state import CampaignState
from .tools.openai_tools import generate_ad_creative


class CreativeGeneratorAgent(BaseMarketingAgent):
    """
    Generates ad creative content based on campaign parameters
    """
    
    def __init__(self):
        super().__init__(
            name="creative",
            description="Generates compelling ad copy and creative elements"
        )
        
        # CTA mapping by objective
        self.objective_ctas = {
            "AWARENESS": ["LEARN_MORE", "SEE_MORE"],
            "TRAFFIC": ["LEARN_MORE", "VISIT_WEBSITE", "SEE_MORE"],
            "ENGAGEMENT": ["LIKE_PAGE", "SEE_MORE", "COMMENT"],
            "LEADS": ["SIGN_UP", "SUBSCRIBE", "GET_QUOTE"],
            "APP_PROMOTION": ["DOWNLOAD", "INSTALL_NOW", "USE_APP"],
            "SALES": ["SHOP_NOW", "BUY_NOW", "GET_OFFER"],
            "CONVERSIONS": ["SIGN_UP", "GET_STARTED", "APPLY_NOW"]
        }
    
    async def process(self, state: CampaignState) -> CampaignState:
        """
        Generate creative content for the campaign
        """
        # Validate required fields
        if not self.validate_required_fields(
            state, 
            ["campaign_objective", "target_audience", "user_request"]
        ):
            state["next_agent"] = "supervisor"
            return state
        
        self.logger.info(
            "generating_creative",
            objective=state.get("campaign_objective"),
            audience_age_range=f"{state['target_audience'].get('age_min')}-{state['target_audience'].get('age_max')}"
        )
        
        # Update status
        state["processing_status"] = "creating"
        
        try:
            # Extract product/service info from user request
            product_info = self._extract_product_info(state)
            
            # Generate creative
            creative = await self.call_api_with_retry(
                generate_ad_creative,
                campaign_objective=state["campaign_objective"],
                target_audience=state["target_audience"],
                product_info=product_info,
                tone=self._determine_tone(state)
            )
            
            # Enhance creative with platform-specific optimizations
            creative = self._optimize_creative(creative, state)
            
            # Add to state
            state["ad_creative"] = creative
            
            # Create variations if budget allows
            if state.get("budget", 0) > 50:
                state["ad_variations"] = await self._create_variations(
                    creative, 
                    state
                )
            
            self.add_message(
                state,
                "assistant",
                f"I've created compelling ad copy for your campaign:\n\n"
                f"**Headline:** {creative['headline']}\n"
                f"**Text:** {creative['primary_text']}\n\n"
                f"This copy is optimized for {state['campaign_objective']} campaigns."
            )
            
        except Exception as e:
            self.logger.error("creative_generation_failed", error=str(e))
            state["errors"].append(f"Failed to generate creative: {str(e)}")
            
            # Use fallback creative
            state["ad_creative"] = self._get_fallback_creative(state)
        
        # Return to supervisor
        state["next_agent"] = "supervisor"
        return state
    
    def _extract_product_info(self, state: CampaignState) -> str:
        """
        Extract product/service information from user request
        """
        user_request = state.get("user_request", "")
        
        # Look for common patterns
        product_keywords = [
            "app", "product", "service", "tool", "platform",
            "brand", "company", "business", "store", "shop"
        ]
        
        # Find product mentions
        words = user_request.lower().split()
        product_info = []
        
        for i, word in enumerate(words):
            if any(keyword in word for keyword in product_keywords):
                # Get surrounding context
                start = max(0, i - 3)
                end = min(len(words), i + 4)
                context = " ".join(words[start:end])
                product_info.append(context)
        
        if product_info:
            return " ".join(product_info)
        else:
            return user_request  # Use full request as fallback
    
    def _determine_tone(self, state: CampaignState) -> str:
        """
        Determine appropriate tone based on audience and objective
        """
        audience = state.get("target_audience", {})
        age_min = audience.get("age_min", 25)
        age_max = audience.get("age_max", 45)
        objective = state.get("campaign_objective", "TRAFFIC")
        
        # Young audience
        if age_max < 30:
            return "Casual, energetic, and trendy"
        # Professional audience
        elif age_min > 30 and objective in ["LEADS", "CONVERSIONS"]:
            return "Professional, trustworthy, and clear"
        # Broad audience
        else:
            return "Friendly, approachable, and inspiring"
    
    def _optimize_creative(
        self, 
        creative: Dict[str, Any], 
        state: CampaignState
    ) -> Dict[str, Any]:
        """
        Optimize creative for platform and objective
        """
        objective = state.get("campaign_objective", "TRAFFIC")
        
        # Ensure appropriate CTA
        if "cta" not in creative or creative["cta"] not in self.objective_ctas.get(objective, []):
            creative["cta"] = self.objective_ctas[objective][0]
        
        # Add emoji if targeting young audience
        audience = state.get("target_audience", {})
        if audience.get("age_max", 65) < 35:
            if "🚀" not in creative["headline"] and "✨" not in creative["headline"]:
                creative["use_emoji"] = True
        
        # Add urgency for sales objectives
        if objective in ["SALES", "CONVERSIONS"] and "now" not in creative["primary_text"].lower():
            creative["add_urgency"] = True
        
        # Platform-specific recommendations
        creative["platform_optimizations"] = {
            "facebook": {
                "image_ratio": "1.91:1",
                "text_overlay": "Keep under 20%"
            },
            "instagram": {
                "image_ratio": "1:1 or 4:5",
                "hashtags": 3
            }
        }
        
        return creative
    
    async def _create_variations(
        self, 
        base_creative: Dict[str, Any], 
        state: CampaignState
    ) -> list:
        """
        Create A/B test variations of the creative
        """
        variations = [base_creative]  # Original is variation A
        
        # Variation B: Different headline angle
        variation_b = base_creative.copy()
        if "?" not in base_creative["headline"]:
            # Make it a question
            variation_b["headline"] = f"{base_creative['headline'].rstrip('.')}?"
        else:
            # Make it a statement
            variation_b["headline"] = base_creative["headline"].replace("?", "!")
        
        variation_b["variation_type"] = "headline_test"
        variations.append(variation_b)
        
        # Variation C: Different CTA
        objective = state.get("campaign_objective", "TRAFFIC")
        available_ctas = self.objective_ctas.get(objective, ["LEARN_MORE"])
        
        if len(available_ctas) > 1:
            variation_c = base_creative.copy()
            current_cta = base_creative.get("cta", available_ctas[0])
            for cta in available_ctas:
                if cta != current_cta:
                    variation_c["cta"] = cta
                    break
            variation_c["variation_type"] = "cta_test"
            variations.append(variation_c)
        
        return variations
    
    def _get_fallback_creative(self, state: CampaignState) -> Dict[str, Any]:
        """
        Generic creative fallback
        """
        objective = state.get("campaign_objective", "TRAFFIC")
        
        templates = {
            "AWARENESS": {
                "headline": "Discover Something New",
                "primary_text": "Join thousands who are already experiencing the difference. Learn more about what makes us unique.",
                "description": "Learn more today"
            },
            "TRAFFIC": {
                "headline": "You're Invited",
                "primary_text": "Visit us today and see why customers love what we do. Special offers available.",
                "description": "Visit now"
            },
            "SALES": {
                "headline": "Limited Time Offer",
                "primary_text": "Don't miss out on our exclusive deals. Shop now and save!",
                "description": "Shop the sale"
            }
        }
        
        template = templates.get(objective, templates["TRAFFIC"])
        template["cta"] = self.objective_ctas[objective][0]
        
        return template