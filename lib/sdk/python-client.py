"""
Meta Ads Dashboard API Client for Python

A comprehensive Python client for the Meta Ads Dashboard API
providing easy access to all endpoints with built-in error handling,
rate limiting, and retry logic.

Usage:
    from metaads import MetaAdsClient
    
    client = MetaAdsClient(
        base_url='https://api.metaads.com',
        meta_token='your_meta_token',
        claude_api_key='your_claude_key'
    )
    
    # Get campaigns
    campaigns = client.get_campaigns('act_123456789')
    
    # Get AI insights
    insights = client.get_optimization_recommendations(campaigns)
"""

import json
import time
import requests
from typing import Dict, List, Optional, Any, Union, Literal
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

# Set up logging
logger = logging.getLogger(__name__)

DatePreset = Literal[
    'today', 'yesterday', 'this_month', 'last_month', 'this_quarter', 
    'last_quarter', 'this_year', 'last_year', 'last_3d', 'last_7d', 
    'last_14d', 'last_28d', 'last_30d', 'last_90d'
]

AIAction = Literal[
    'predictions', 'anomalies', 'recommendations', 'trends', 'competitor',
    'sentiment', 'ab-test', 'performance-prediction', 'insights'
]

LogLevel = Literal['debug', 'info', 'warning', 'error']

@dataclass
class Campaign:
    id: str
    name: str
    status: str
    objective: str
    start_time: str
    created_time: str
    updated_time: str
    account_id: str
    budget_remaining: Optional[float] = None
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    stop_time: Optional[str] = None
    insights: Optional[Dict] = None
    adsets: Optional[List] = None

@dataclass
class CampaignInsights:
    impressions: int
    clicks: int
    spend: float
    reach: int
    frequency: float
    ctr: float
    cpc: float
    cpm: float
    cpp: float
    conversions: Optional[int] = None
    conversion_rate: Optional[float] = None
    revenue: Optional[float] = None
    roas: Optional[float] = None
    actions: Optional[List] = None
    date_start: Optional[str] = None
    date_stop: Optional[str] = None

@dataclass
class AdSet:
    id: str
    name: str
    campaign_id: str
    status: str
    start_time: str
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    end_time: Optional[str] = None
    targeting: Optional[Dict] = None
    insights: Optional[Dict] = None
    ads: Optional[List] = None

@dataclass
class DemographicsData:
    age: List[Dict]
    gender: List[Dict]
    region: List[Dict]
    device: List[Dict]

@dataclass
class LogEntry:
    id: str
    timestamp: str
    level: LogLevel
    message: str
    category: str
    tags: List[str]
    details: Optional[Any] = None
    source: Optional[str] = None

class MetaAdsAPIError(Exception):
    """Exception raised for API errors."""
    
    def __init__(
        self, 
        message: str, 
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
        details: Optional[Any] = None
    ):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.details = details

class MetaAdsClient:
    """
    Meta Ads Dashboard API Client
    
    Provides access to all Meta Ads Dashboard API endpoints with
    built-in error handling, retries, and rate limiting.
    """
    
    def __init__(
        self,
        base_url: str = 'https://api.metaads.com',
        meta_token: Optional[str] = None,
        claude_api_key: Optional[str] = None,
        timeout: int = 30,
        retry_attempts: int = 3,
        retry_delay: int = 1,
        debug: bool = False
    ):
        """
        Initialize the Meta Ads API client.
        
        Args:
            base_url: Base URL for the API
            meta_token: Meta API access token
            claude_api_key: Claude API key for AI features
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts
            retry_delay: Base delay between retries in seconds
            debug: Enable debug logging
        """
        self.base_url = base_url.rstrip('/')
        self.meta_token = meta_token
        self.claude_api_key = claude_api_key
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        self.debug = debug
        
        if debug:
            logging.basicConfig(level=logging.DEBUG)
        
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'MetaAdsClient-Python/1.0.0'
        })
    
    def _log(self, message: str, data: Any = None):
        """Log debug messages if debug is enabled."""
        if self.debug:
            logger.debug(f"[MetaAdsClient] {message}")
            if data:
                logger.debug(f"Data: {data}")
    
    def _request(
        self,
        endpoint: str,
        method: str = 'GET',
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        requires_auth: bool = True
    ) -> Dict:
        """
        Make an HTTP request with retry logic.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            data: Request body data
            params: Query parameters
            requires_auth: Whether authentication is required
            
        Returns:
            Response data as dictionary
            
        Raises:
            MetaAdsAPIError: If the request fails
        """
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if requires_auth and self.meta_token:
            headers['Authorization'] = f"Bearer {self.meta_token}"
        
        if self.claude_api_key and 'ai-insights' in endpoint:
            headers['X-Claude-API-Key'] = self.claude_api_key
        
        self._log(f"{method} {endpoint}", data)
        
        for attempt in range(1, self.retry_attempts + 1):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=headers,
                    timeout=self.timeout
                )
                
                response_data = response.json()
                
                if not response.ok:
                    raise MetaAdsAPIError(
                        response_data.get('error', response_data.get('message', f'HTTP {response.status_code}')),
                        response.status_code,
                        response_data.get('code'),
                        response_data.get('details')
                    )
                
                self._log(f"Response ({response.status_code})", response_data)
                return response_data
                
            except requests.exceptions.RequestException as e:
                if attempt == self.retry_attempts:
                    raise MetaAdsAPIError(f"Network error: {str(e)}", 0, 'NETWORK_ERROR', e)
                
                # Exponential backoff
                delay = self.retry_delay * (2 ** (attempt - 1))
                self._log(f"Retry {attempt} in {delay}s")
                time.sleep(delay)
        
        raise MetaAdsAPIError("Max retries exceeded")
    
    def health_check(self) -> Dict:
        """
        Check API health status.
        
        Returns:
            Health status information
        """
        return self._request('/api/health', requires_auth=False)
    
    def test_connection(self, ad_account_id: str, access_token: Optional[str] = None) -> Dict:
        """
        Test Meta API connection.
        
        Args:
            ad_account_id: Meta ad account ID
            access_token: Meta access token (uses client token if not provided)
            
        Returns:
            Connection test results
        """
        token = access_token or self.meta_token
        if not token:
            raise MetaAdsAPIError("Meta access token is required")
        
        return self._request(
            '/api/meta',
            'POST',
            {
                'type': 'test_connection',
                'adAccountId': ad_account_id,
                'accessToken': token
            },
            requires_auth=False
        )
    
    def get_campaigns(
        self,
        ad_account_id: str,
        date_preset: DatePreset = 'last_30d',
        access_token: Optional[str] = None
    ) -> List[Campaign]:
        """
        Get campaigns overview.
        
        Args:
            ad_account_id: Meta ad account ID
            date_preset: Date range for insights
            access_token: Meta access token
            
        Returns:
            List of campaigns
        """
        token = access_token or self.meta_token
        if not token:
            raise MetaAdsAPIError("Meta access token is required")
        
        response = self._request(
            '/api/meta',
            'POST',
            {
                'type': 'overview',
                'adAccountId': ad_account_id,
                'accessToken': token,
                'datePreset': date_preset
            },
            requires_auth=False
        )
        
        campaigns = []
        for campaign_data in response.get('campaigns', []):
            campaigns.append(Campaign(**campaign_data))
        
        return campaigns
    
    def get_campaign_details(
        self,
        campaign_id: str,
        ad_account_id: str,
        date_preset: DatePreset = 'last_30d',
        access_token: Optional[str] = None
    ) -> Dict:
        """
        Get detailed campaign data.
        
        Args:
            campaign_id: Meta campaign ID
            ad_account_id: Meta ad account ID
            date_preset: Date range for insights
            access_token: Meta access token
            
        Returns:
            Campaign details with historical and hourly data
        """
        token = access_token or self.meta_token
        if not token:
            raise MetaAdsAPIError("Meta access token is required")
        
        return self._request(
            '/api/meta',
            'POST',
            {
                'type': 'campaign_details',
                'campaignId': campaign_id,
                'adAccountId': ad_account_id,
                'accessToken': token,
                'datePreset': date_preset
            },
            requires_auth=False
        )
    
    def get_demographics(
        self,
        campaign_id: str,
        date_preset: DatePreset = 'last_30d',
        access_token: Optional[str] = None
    ) -> DemographicsData:
        """
        Get demographic analytics for a campaign.
        
        Args:
            campaign_id: Meta campaign ID
            date_preset: Date range for insights
            access_token: Meta access token
            
        Returns:
            Demographic breakdown data
        """
        token = access_token or self.meta_token
        if not token:
            raise MetaAdsAPIError("Meta access token is required")
        
        response = self._request(
            '/api/meta/demographics',
            'POST',
            {
                'campaignId': campaign_id,
                'accessToken': token,
                'datePreset': date_preset
            },
            requires_auth=False
        )
        
        return DemographicsData(**response)
    
    def get_ai_insights(
        self,
        campaigns: List[Campaign],
        action: AIAction,
        params: Optional[Dict] = None,
        claude_api_key: Optional[str] = None
    ) -> Dict:
        """
        Get AI-powered insights.
        
        Args:
            campaigns: List of campaigns
            action: Type of AI analysis
            params: Action-specific parameters
            claude_api_key: Claude API key
            
        Returns:
            AI insights response
        """
        key = claude_api_key or self.claude_api_key
        if not key:
            raise MetaAdsAPIError("Claude API key is required for AI insights")
        
        # Convert campaigns to dictionaries
        campaigns_data = [asdict(campaign) for campaign in campaigns]
        
        return self._request(
            '/api/ai-insights',
            'POST',
            {
                'campaigns': campaigns_data,
                'action': action,
                'params': params or {},
                'claudeApiKey': key
            },
            requires_auth=False
        )
    
    def get_realtime_status(self, demo: bool = False) -> Dict:
        """
        Get real-time system status.
        
        Args:
            demo: Generate demo data
            
        Returns:
            Real-time system status
        """
        params = {'demo': 'true'} if demo else None
        return self._request('/api/realtime', params=params, requires_auth=False)
    
    def submit_realtime_data(self, action: str, data: Dict) -> Dict:
        """
        Submit real-time data.
        
        Args:
            action: Action type
            data: Data payload
            
        Returns:
            Submission result
        """
        return self._request(
            '/api/realtime',
            'POST',
            {'action': action, 'data': data},
            requires_auth=False
        )
    
    def get_error_metrics(self, period: str = '24h', category: Optional[str] = None) -> Dict:
        """
        Get error metrics.
        
        Args:
            period: Time period
            category: Error category filter
            
        Returns:
            Error metrics data
        """
        params = {'period': period}
        if category:
            params['category'] = category
        
        return self._request('/api/error-metrics', params=params, requires_auth=False)
    
    def submit_error_metrics(
        self,
        metrics: Dict,
        session_id: str
    ) -> Dict:
        """
        Submit error metrics.
        
        Args:
            metrics: Error metrics data
            session_id: Session identifier
            
        Returns:
            Submission result
        """
        return self._request(
            '/api/error-metrics',
            'POST',
            {
                'metrics': metrics,
                'timestamp': datetime.now().isoformat(),
                'sessionId': session_id
            },
            requires_auth=False
        )
    
    def submit_log(
        self,
        level: LogLevel,
        message: str,
        details: Optional[Any] = None,
        source: Optional[str] = None
    ) -> Dict:
        """
        Submit a log entry.
        
        Args:
            level: Log level
            message: Log message
            details: Additional details
            source: Log source
            
        Returns:
            Submission result
        """
        return self._request(
            '/api/logs/stream',
            'POST',
            {
                'level': level,
                'message': message,
                'details': details,
                'source': source
            },
            requires_auth=False
        )
    
    # Convenience methods for AI insights
    
    def get_predictions(
        self,
        campaign: Campaign,
        timeframe: str = '30d',
        scenario: str = 'moderate'
    ) -> Dict:
        """Get performance predictions for a campaign."""
        return self.get_ai_insights(
            [],
            'predictions',
            {
                'campaign': asdict(campaign),
                'timeframe': timeframe,
                'scenario': scenario
            }
        )
    
    def get_optimization_recommendations(self, campaigns: List[Campaign]) -> Dict:
        """Get optimization recommendations for campaigns."""
        return self.get_ai_insights(campaigns, 'recommendations')
    
    def detect_anomalies(self, campaigns: List[Campaign], lookback_days: int = 30) -> Dict:
        """Detect performance anomalies in campaigns."""
        return self.get_ai_insights(campaigns, 'anomalies', {'lookbackDays': lookback_days})
    
    def analyze_trends(self, campaigns: List[Campaign], metrics: Optional[List[str]] = None) -> Dict:
        """Analyze performance trends in campaigns."""
        return self.get_ai_insights(campaigns, 'trends', {'metrics': metrics})
    
    def analyze_competitors(self, campaigns: List[Campaign], industry: str = 'ecommerce') -> Dict:
        """Analyze competitor performance."""
        return self.get_ai_insights(campaigns, 'competitor', {'industry': industry})
    
    def analyze_sentiment(self, ad_copy: str) -> Dict:
        """Analyze sentiment of ad copy."""
        return self.get_ai_insights([], 'sentiment', {'adCopy': ad_copy})
    
    def analyze_ab_test(
        self,
        variant_a: Dict,
        variant_b: Dict,
        confidence_level: float = 0.95
    ) -> Dict:
        """Analyze A/B test results."""
        return self.get_ai_insights(
            [],
            'ab-test',
            {
                'variantA': variant_a,
                'variantB': variant_b,
                'confidenceLevel': confidence_level
            }
        )

# Example usage
if __name__ == "__main__":
    # Initialize client
    client = MetaAdsClient(
        base_url='http://localhost:3000/api',
        meta_token='your_meta_token',
        claude_api_key='your_claude_key',
        debug=True
    )
    
    try:
        # Health check
        health = client.health_check()
        print(f"API Status: {health['status']}")
        
        # Test connection
        connection = client.test_connection('act_123456789')
        print(f"Connection: {connection['success']}")
        
        # Get campaigns
        campaigns = client.get_campaigns('act_123456789')
        print(f"Found {len(campaigns)} campaigns")
        
        # Get AI recommendations
        if campaigns:
            recommendations = client.get_optimization_recommendations(campaigns)
            print("Recommendations:", recommendations)
            
    except MetaAdsAPIError as e:
        print(f"API Error: {e}")
        print(f"Status Code: {e.status_code}")
        print(f"Error Code: {e.error_code}")