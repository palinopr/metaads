"""
Campaign State Definition for LangGraph
"""
from typing import TypedDict, List, Dict, Any, Optional, Literal
from datetime import datetime


class CampaignState(TypedDict):
    """State object that flows through all agents"""
    
    # User Input
    user_request: str
    user_id: Optional[str]
    session_id: str
    timestamp: datetime
    
    # Parsed Campaign Information
    campaign_objective: Optional[Literal[
        "AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", 
        "APP_PROMOTION", "SALES", "CONVERSIONS"
    ]]
    budget: Optional[float]
    budget_type: Optional[Literal["daily", "lifetime"]]
    duration_days: Optional[int]
    start_date: Optional[str]
    
    # Target Audience
    target_audience: Optional[Dict[str, Any]]
    # Example structure:
    # {
    #     "age_min": 25,
    #     "age_max": 40, 
    #     "genders": ["male", "female"],
    #     "geo_locations": {"countries": ["US"]},
    #     "interests": ["fitness", "health"],
    #     "behaviors": ["mobile_app_users"]
    # }
    
    # Generated Content
    campaign_name: Optional[str]
    ad_sets: Optional[List[Dict[str, Any]]]
    ad_creative: Optional[Dict[str, Any]]
    # Example structure:
    # {
    #     "headline": "Transform Your Fitness Journey",
    #     "primary_text": "Join thousands...",
    #     "description": "Download now and get...",
    #     "cta": "DOWNLOAD",
    #     "image_url": "https://..."
    # }
    
    # Workflow Control
    current_agent: str
    next_agent: Optional[str]
    processing_status: Literal[
        "initializing", "parsing", "creating", "building", 
        "reviewing", "complete", "error"
    ]
    confidence_score: Optional[float]  # 0-1 confidence in parsed data
    
    # Results
    campaign_plan: Optional[Dict[str, Any]]
    estimated_reach: Optional[int]
    estimated_impressions: Optional[int]
    estimated_clicks: Optional[int]
    estimated_conversions: Optional[int]
    estimated_cost_per_result: Optional[float]
    
    # Meta Ads Specific
    meta_account_id: Optional[str]
    meta_campaign_id: Optional[str]
    meta_adset_ids: Optional[List[str]]
    meta_ad_ids: Optional[List[str]]
    
    # Conversation History
    messages: List[Dict[str, str]]  # {"role": "user/assistant", "content": "..."}
    
    # Error Handling
    errors: List[str]
    warnings: List[str]
    
    # Metadata
    processing_time_ms: Optional[int]
    tokens_used: Optional[int]
    api_calls_made: Optional[int]