"""
Campaign State Management Examples

This module demonstrates how to define and manage state for campaign-related
workflows in LangGraph. It includes state schemas, reducers, and utilities
for handling complex campaign data.
"""

from typing import TypedDict, Annotated, Dict, Any, List, Optional, Literal, Union
from datetime import datetime
from decimal import Decimal
import operator
from enum import Enum

from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field, validator


# Enums for campaign types
class CampaignObjective(str, Enum):
    """Supported campaign objectives"""
    AWARENESS = "awareness"
    TRAFFIC = "traffic"
    ENGAGEMENT = "engagement"
    LEADS = "leads"
    APP_PROMOTION = "app_promotion"
    SALES = "sales"
    CONVERSIONS = "conversions"


class CampaignStatus(str, Enum):
    """Campaign lifecycle status"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Platform(str, Enum):
    """Supported advertising platforms"""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    GOOGLE = "google"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"


# Pydantic models for validation
class Budget(BaseModel):
    """Budget configuration"""
    amount: Decimal = Field(gt=0, description="Budget amount")
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    schedule: Literal["daily", "weekly", "monthly", "lifetime"]
    
    @validator("amount")
    def validate_amount(cls, v):
        # Ensure budget meets minimum requirements
        if v < 1:
            raise ValueError("Budget must be at least $1")
        return v


class Targeting(BaseModel):
    """Audience targeting parameters"""
    age_min: int = Field(ge=13, le=65)
    age_max: int = Field(ge=13, le=65)
    genders: List[Literal["male", "female", "all"]] = ["all"]
    locations: List[Dict[str, Any]]
    interests: List[str] = []
    behaviors: List[str] = []
    custom_audiences: List[str] = []
    excluded_audiences: List[str] = []
    languages: List[str] = []
    
    @validator("age_max")
    def validate_age_range(cls, v, values):
        if "age_min" in values and v < values["age_min"]:
            raise ValueError("age_max must be greater than age_min")
        return v


class Creative(BaseModel):
    """Ad creative content"""
    format: Literal["single_image", "carousel", "video", "collection"]
    headline: str = Field(max_length=255)
    primary_text: str = Field(max_length=2000)
    description: Optional[str] = Field(max_length=255)
    call_to_action: str
    media_urls: List[str] = []
    link_url: Optional[str] = None


# State definitions for LangGraph
class CampaignState(TypedDict):
    """
    Complete state for campaign management workflows.
    
    This state is designed to handle the entire lifecycle of a campaign,
    from creation through optimization and reporting.
    """
    # Conversation and context
    messages: Annotated[List[BaseMessage], operator.add]
    user_id: str
    session_id: str
    
    # Campaign identification
    campaign_id: Optional[str]
    campaign_name: str
    
    # Campaign configuration
    objective: CampaignObjective
    status: CampaignStatus
    platforms: List[Platform]
    
    # Scheduling
    start_date: datetime
    end_date: Optional[datetime]
    
    # Budget and bidding
    budget: Budget
    bid_strategy: Literal["lowest_cost", "cost_cap", "bid_cap", "target_cost"]
    bid_amount: Optional[Decimal]
    
    # Targeting
    targeting: Targeting
    estimated_reach: Dict[str, int]  # {"min": 10000, "max": 50000}
    
    # Creative assets
    creatives: List[Creative]
    selected_creative_ids: List[str]
    
    # Performance metrics (for active campaigns)
    metrics: Dict[str, Any]
    
    # Optimization history
    optimizations: Annotated[List[Dict[str, Any]], operator.add]
    
    # Workflow control
    current_step: str
    validation_errors: List[str]
    warnings: List[str]
    requires_approval: bool
    approved_by: Optional[str]
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    notes: str


class OptimizationState(TypedDict):
    """
    State for campaign optimization workflows.
    
    This state is used when optimizing existing campaigns based on
    performance data.
    """
    # Campaign reference
    campaign_id: str
    optimization_id: str
    
    # Performance data
    current_metrics: Dict[str, Any]
    historical_metrics: List[Dict[str, Any]]
    
    # Analysis results
    performance_score: float  # 0-100
    issues_identified: List[Dict[str, Any]]
    opportunities: List[Dict[str, Any]]
    
    # Optimization recommendations
    recommendations: Annotated[List[Dict[str, Any]], operator.add]
    
    # Applied changes
    changes_to_apply: List[Dict[str, Any]]
    changes_applied: List[Dict[str, Any]]
    
    # Results tracking
    expected_improvement: Dict[str, float]
    actual_improvement: Optional[Dict[str, float]]
    
    # Control flags
    auto_apply: bool
    requires_approval: bool
    optimization_status: Literal["analyzing", "pending_approval", "applying", "completed", "failed"]


class MultiCampaignState(TypedDict):
    """
    State for managing multiple campaigns simultaneously.
    
    Used for bulk operations, cross-campaign optimization, and
    portfolio management.
    """
    # Portfolio identification
    portfolio_id: str
    portfolio_name: str
    
    # Campaigns in portfolio
    campaign_ids: List[str]
    campaigns: Dict[str, CampaignState]
    
    # Aggregate metrics
    total_spend: Decimal
    total_conversions: int
    average_cpa: Decimal
    portfolio_roas: float
    
    # Budget allocation
    total_budget: Budget
    budget_allocation: Dict[str, Decimal]  # campaign_id -> amount
    
    # Cross-campaign insights
    top_performers: List[str]
    underperformers: List[str]
    reallocation_suggestions: List[Dict[str, Any]]
    
    # Bulk operations
    bulk_action: Optional[str]
    affected_campaigns: List[str]
    bulk_status: Literal["idle", "processing", "completed", "failed"]


# Reducer functions for complex state updates
def merge_metrics(existing: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    """
    Custom reducer for merging performance metrics.
    
    Handles numeric aggregation and maintains history.
    """
    merged = existing.copy()
    
    for key, value in new.items():
        if key in merged and isinstance(value, (int, float)):
            # For numeric values, keep both current and previous
            if not key.endswith("_history"):
                if f"{key}_history" not in merged:
                    merged[f"{key}_history"] = []
                merged[f"{key}_history"].append({
                    "value": merged[key],
                    "timestamp": datetime.now().isoformat()
                })
            merged[key] = value
        else:
            merged[key] = value
    
    return merged


def append_unique(existing: List[Any], new: List[Any]) -> List[Any]:
    """
    Reducer that appends only unique items to a list.
    """
    seen = set(existing)
    result = existing.copy()
    
    for item in new:
        if item not in seen:
            result.append(item)
            seen.add(item)
    
    return result


# State with custom reducers
class AdvancedCampaignState(TypedDict):
    """
    Campaign state with custom reducer functions for complex updates.
    """
    # Standard fields
    campaign_id: str
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Fields with custom reducers
    metrics: Annotated[Dict[str, Any], merge_metrics]
    tags: Annotated[List[str], append_unique]
    
    # Nested state for A/B tests
    ab_tests: Dict[str, Dict[str, Any]]


# Utility functions for state management
def initialize_campaign_state(
    user_id: str,
    campaign_name: str,
    objective: CampaignObjective,
    platforms: List[Platform]
) -> CampaignState:
    """
    Initialize a new campaign state with defaults.
    """
    now = datetime.now()
    
    return CampaignState(
        messages=[],
        user_id=user_id,
        session_id=f"session_{now.isoformat()}",
        campaign_id=None,
        campaign_name=campaign_name,
        objective=objective,
        status=CampaignStatus.DRAFT,
        platforms=platforms,
        start_date=now,
        end_date=None,
        budget=Budget(amount=Decimal("100"), currency="USD", schedule="daily"),
        bid_strategy="lowest_cost",
        bid_amount=None,
        targeting=Targeting(
            age_min=18,
            age_max=65,
            genders=["all"],
            locations=[],
            interests=[],
            behaviors=[],
            custom_audiences=[],
            excluded_audiences=[],
            languages=[]
        ),
        estimated_reach={"min": 0, "max": 0},
        creatives=[],
        selected_creative_ids=[],
        metrics={},
        optimizations=[],
        current_step="initialization",
        validation_errors=[],
        warnings=[],
        requires_approval=False,
        approved_by=None,
        created_at=now,
        updated_at=now,
        tags=[],
        notes=""
    )


def validate_campaign_state(state: CampaignState) -> List[str]:
    """
    Validate campaign state for completeness and correctness.
    
    Returns list of validation errors.
    """
    errors = []
    
    # Check required fields
    if not state.get("campaign_name"):
        errors.append("Campaign name is required")
    
    if not state.get("platforms"):
        errors.append("At least one platform must be selected")
    
    # Validate budget
    if state.get("budget"):
        try:
            budget = Budget(**state["budget"])
        except Exception as e:
            errors.append(f"Invalid budget: {str(e)}")
    else:
        errors.append("Budget configuration is required")
    
    # Validate targeting
    if state.get("targeting"):
        try:
            targeting = Targeting(**state["targeting"])
            if not targeting.locations:
                errors.append("At least one location must be targeted")
        except Exception as e:
            errors.append(f"Invalid targeting: {str(e)}")
    else:
        errors.append("Targeting configuration is required")
    
    # Check creatives
    if not state.get("creatives"):
        errors.append("At least one creative is required")
    
    return errors


def calculate_state_completeness(state: CampaignState) -> float:
    """
    Calculate how complete a campaign state is (0-100%).
    
    Used to show progress indicators in UI.
    """
    required_fields = [
        "campaign_name", "objective", "platforms", "budget",
        "targeting", "creatives", "start_date"
    ]
    
    optional_fields = [
        "end_date", "bid_amount", "tags", "notes"
    ]
    
    # Calculate required fields completion
    required_complete = sum(
        1 for field in required_fields
        if state.get(field) and state[field] != {} and state[field] != []
    )
    required_score = (required_complete / len(required_fields)) * 80
    
    # Calculate optional fields completion
    optional_complete = sum(
        1 for field in optional_fields
        if state.get(field) and state[field] != {} and state[field] != []
    )
    optional_score = (optional_complete / len(optional_fields)) * 20
    
    return round(required_score + optional_score, 2)


# Example usage
if __name__ == "__main__":
    # Create a new campaign state
    state = initialize_campaign_state(
        user_id="user_123",
        campaign_name="Summer Sale 2024",
        objective=CampaignObjective.CONVERSIONS,
        platforms=[Platform.FACEBOOK, Platform.INSTAGRAM]
    )
    
    # Validate the state
    errors = validate_campaign_state(state)
    print(f"Validation errors: {errors}")
    
    # Check completeness
    completeness = calculate_state_completeness(state)
    print(f"Campaign completeness: {completeness}%")
    
    # Example of state update with custom reducer
    advanced_state = AdvancedCampaignState(
        campaign_id="camp_123",
        messages=[],
        metrics={"impressions": 1000, "clicks": 50},
        tags=["summer", "sale"],
        ab_tests={}
    )
    
    # Simulate metric update
    new_metrics = {"impressions": 2000, "clicks": 100, "conversions": 5}
    advanced_state["metrics"] = merge_metrics(advanced_state["metrics"], new_metrics)
    print(f"Updated metrics: {advanced_state['metrics']}")