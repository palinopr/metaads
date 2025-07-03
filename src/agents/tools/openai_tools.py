"""
OpenAI API Tools for Campaign Creation
"""
import os
import json
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def parse_campaign_request(
    user_request: str,
    quick_parse_hints: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Use GPT-4 to parse a natural language campaign request
    """
    system_prompt = """You are an expert marketing campaign parser. Extract structured campaign data from natural language requests.

Return a JSON object with these fields:
- campaign_objective: One of AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, APP_PROMOTION, SALES, CONVERSIONS
- budget: Numeric budget amount (no currency symbols)
- budget_type: "daily" or "lifetime" (default: daily)
- duration_days: Campaign duration in days (default: 30)
- campaign_name: A catchy, relevant campaign name
- target_audience: Object with:
  - age_min: Minimum age (default: 18)
  - age_max: Maximum age (default: 65)
  - genders: Array of "male", "female", or ["all"]
  - geo_locations: Object with countries, regions, or cities arrays
  - interests: Array of relevant interests
  - behaviors: Array of relevant behaviors
- confidence: Your confidence in the parsing (0-1)
- warnings: Array of any assumptions or missing data

Be intelligent about inferring details. For example:
- "millennials" means age 25-40
- "young adults" means age 18-34
- "seniors" means age 55+
- Infer interests from the product/service mentioned
- If location isn't specified, assume US
- If gender isn't specified, assume all genders
"""

    user_prompt = f"""Parse this campaign request: "{user_request}"

Hints from initial parsing: {json.dumps(quick_parse_hints or {})}

Return only valid JSON."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        # Fallback to basic parsing if API fails
        return {
            "campaign_objective": quick_parse_hints.get("campaign_objective", "TRAFFIC"),
            "budget": quick_parse_hints.get("budget", 100),
            "budget_type": "daily",
            "duration_days": 30,
            "campaign_name": "New Campaign",
            "target_audience": {
                "age_min": 18,
                "age_max": 65,
                "genders": ["all"],
                "geo_locations": {"countries": ["US"]}
            },
            "confidence": 0.3,
            "warnings": [f"AI parsing failed: {str(e)}. Using defaults."]
        }


async def generate_ad_creative(
    campaign_objective: str,
    target_audience: Dict[str, Any],
    product_info: str,
    tone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate ad creative using GPT-4
    """
    system_prompt = """You are an expert copywriter for social media ads. Create compelling ad copy that converts.

Consider:
- The campaign objective and what action we want users to take
- The target audience demographics and interests
- Platform best practices (Facebook/Instagram)
- Character limits: Headline (40 chars), Primary text (125 chars), Description (30 chars)

Return JSON with:
- headline: Attention-grabbing headline
- primary_text: Main ad copy
- description: Supporting description
- cta: Call-to-action button text (e.g., LEARN_MORE, SHOP_NOW, SIGN_UP, DOWNLOAD)
- creative_rationale: Brief explanation of your creative choices
"""

    # Build audience context
    audience_desc = f"Age {target_audience.get('age_min', 18)}-{target_audience.get('age_max', 65)}"
    if interests := target_audience.get("interests"):
        audience_desc += f", interested in {', '.join(interests[:3])}"
    
    user_prompt = f"""Create ad copy for:
Product/Service: {product_info}
Campaign Objective: {campaign_objective}
Target Audience: {audience_desc}
Tone: {tone or 'Professional but friendly'}

Return only valid JSON."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        # Fallback creative
        return {
            "headline": "Discover Something Amazing",
            "primary_text": "Transform your life with our innovative solution. Join thousands of satisfied customers today!",
            "description": "Limited time offer",
            "cta": "LEARN_MORE",
            "creative_rationale": "Generic fallback due to API error"
        }


async def optimize_campaign_parameters(
    objective: str,
    budget: float,
    duration_days: int,
    target_audience: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Get AI recommendations for campaign optimization
    """
    prompt = f"""As a marketing expert, provide optimization recommendations for:
- Objective: {objective}
- Budget: ${budget}/day for {duration_days} days
- Audience: {json.dumps(target_audience)}

Suggest:
1. Optimal budget allocation
2. Best times to run ads
3. Recommended bid strategy
4. Expected results (reach, clicks, conversions)

Return as JSON with: recommendations, expected_results, warnings"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception:
        # Fallback recommendations
        return {
            "recommendations": {
                "budget_allocation": "70% on best performing ads, 30% on testing",
                "schedule": "Peak hours: 6-9 PM on weekdays",
                "bid_strategy": "Lowest cost for maximum results"
            },
            "expected_results": {
                "reach": int(budget * duration_days * 100),
                "clicks": int(budget * duration_days * 5),
                "conversions": int(budget * duration_days * 0.5)
            },
            "warnings": []
        }