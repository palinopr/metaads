"""
Base Agent Class for AI Marketing Automation
"""
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from .state import CampaignState


class BaseMarketingAgent(ABC):
    """Base class for all marketing agents"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.logger = structlog.get_logger(name=name)
        self.metrics = {
            "invocations": 0,
            "errors": 0,
            "avg_processing_time": 0
        }
    
    @abstractmethod
    async def process(self, state: CampaignState) -> CampaignState:
        """
        Process the state and return updated state.
        Must be implemented by each agent.
        """
        pass
    
    async def __call__(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Main entry point for LangGraph"""
        start_time = datetime.now()
        self.metrics["invocations"] += 1
        
        try:
            # Log entry
            self.logger.info(
                "agent_started",
                user_request=state.get("user_request", "")[:100],
                current_status=state.get("processing_status")
            )
            
            # Update current agent
            state["current_agent"] = self.name
            
            # Process
            result = await self.process(state)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            result["processing_time_ms"] = int(processing_time)
            
            # Update metrics
            self._update_metrics(processing_time)
            
            # Log success
            self.logger.info(
                "agent_completed",
                processing_time_ms=processing_time,
                next_agent=result.get("next_agent")
            )
            
            return result
            
        except Exception as e:
            self.metrics["errors"] += 1
            self.logger.error(
                "agent_error",
                error=str(e),
                error_type=type(e).__name__
            )
            
            # Add error to state
            if "errors" not in state:
                state["errors"] = []
            state["errors"].append(f"{self.name}: {str(e)}")
            state["processing_status"] = "error"
            
            return state
    
    def _update_metrics(self, processing_time: float):
        """Update agent metrics"""
        current_avg = self.metrics["avg_processing_time"]
        count = self.metrics["invocations"]
        self.metrics["avg_processing_time"] = (
            (current_avg * (count - 1) + processing_time) / count
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def call_api_with_retry(self, api_func, *args, **kwargs):
        """Generic API call with retry logic"""
        try:
            return await api_func(*args, **kwargs)
        except Exception as e:
            self.logger.warning(
                "api_call_failed",
                error=str(e),
                attempt=self.call_api_with_retry.retry.statistics["attempt_number"]
            )
            raise
    
    def add_message(self, state: CampaignState, role: str, content: str):
        """Add a message to the conversation history"""
        if "messages" not in state:
            state["messages"] = []
        
        state["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "agent": self.name
        })
    
    def validate_required_fields(
        self, 
        state: CampaignState, 
        required_fields: List[str]
    ) -> bool:
        """Validate that required fields are present in state"""
        missing_fields = []
        
        for field in required_fields:
            if field not in state or state[field] is None:
                missing_fields.append(field)
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            if "errors" not in state:
                state["errors"] = []
            state["errors"].append(error_msg)
            self.logger.warning("missing_required_fields", fields=missing_fields)
            return False
        
        return True