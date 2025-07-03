"""
Base Agent Template for Marketing Automation Platform

This template provides the foundation for all marketing agents in the system.
Each specialized agent should inherit from this base class and implement
the required methods.
"""

from typing import Dict, Any, List, Optional, TypedDict
from abc import ABC, abstractmethod
from datetime import datetime
import logging
import asyncio
from enum import Enum

from langchain.tools import tool
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field
import json


class AgentStatus(str, Enum):
    """Agent execution status"""
    IDLE = "idle"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING_FOR_HUMAN = "waiting_for_human"


class AgentResult(BaseModel):
    """Standard result format for all agents"""
    status: AgentStatus
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    next_action: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseMarketingAgent(ABC):
    """
    Base class for all marketing automation agents.
    
    This class provides common functionality including:
    - Logging setup
    - Error handling
    - State management
    - Tool registration
    - Performance tracking
    """
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.logger = self._setup_logging()
        self.tools = []
        self.execution_history = []
        self._initialize_tools()
    
    def _setup_logging(self) -> logging.Logger:
        """Configure agent-specific logging"""
        logger = logging.getLogger(f"agent.{self.name}")
        logger.setLevel(logging.INFO)
        
        # Add handler if not already present
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'[%(asctime)s] [{self.name}] %(levelname)s: %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    @abstractmethod
    def _initialize_tools(self):
        """
        Initialize agent-specific tools.
        Override this method to register tools for the agent.
        """
        pass
    
    @abstractmethod
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method for the agent.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated state dictionary
        """
        pass
    
    async def __call__(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent with comprehensive error handling and logging.
        """
        start_time = datetime.now()
        execution_id = f"{self.name}_{start_time.isoformat()}"
        
        self.logger.info(f"Starting execution: {execution_id}")
        
        try:
            # Update agent status
            state = self._update_status(state, AgentStatus.PROCESSING)
            
            # Process the request
            result = await self.process(state)
            
            # Record execution
            self._record_execution(execution_id, True, start_time)
            
            # Update status to completed
            result = self._update_status(result, AgentStatus.COMPLETED)
            
            self.logger.info(f"Completed execution: {execution_id}")
            return result
            
        except Exception as e:
            self.logger.error(f"Error in execution {execution_id}: {str(e)}")
            
            # Record failed execution
            self._record_execution(execution_id, False, start_time, str(e))
            
            # Update state with error
            state = self._update_status(state, AgentStatus.FAILED)
            state["error"] = str(e)
            state["error_agent"] = self.name
            
            return state
    
    def _update_status(self, state: Dict[str, Any], status: AgentStatus) -> Dict[str, Any]:
        """Update agent status in state"""
        if "agent_status" not in state:
            state["agent_status"] = {}
        
        state["agent_status"][self.name] = {
            "status": status.value,
            "timestamp": datetime.now().isoformat()
        }
        
        return state
    
    def _record_execution(self, execution_id: str, success: bool, 
                         start_time: datetime, error: Optional[str] = None):
        """Record execution history for monitoring"""
        duration = (datetime.now() - start_time).total_seconds()
        
        record = {
            "execution_id": execution_id,
            "success": success,
            "duration_seconds": duration,
            "timestamp": start_time.isoformat(),
            "error": error
        }
        
        self.execution_history.append(record)
        
        # Keep only last 100 executions
        if len(self.execution_history) > 100:
            self.execution_history = self.execution_history[-100:]
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Calculate agent performance metrics"""
        if not self.execution_history:
            return {
                "total_executions": 0,
                "success_rate": 0.0,
                "average_duration": 0.0
            }
        
        total = len(self.execution_history)
        successful = sum(1 for e in self.execution_history if e["success"])
        avg_duration = sum(e["duration_seconds"] for e in self.execution_history) / total
        
        return {
            "total_executions": total,
            "success_rate": successful / total,
            "average_duration": avg_duration,
            "recent_errors": [e for e in self.execution_history[-10:] if not e["success"]]
        }
    
    @tool
    async def get_agent_info(self) -> Dict[str, Any]:
        """Get information about this agent"""
        return {
            "name": self.name,
            "description": self.description,
            "tools": [t.name for t in self.tools],
            "performance": self.get_performance_metrics()
        }
    
    def validate_state(self, state: Dict[str, Any], required_fields: List[str]) -> bool:
        """
        Validate that required fields exist in state.
        
        Args:
            state: Current state dictionary
            required_fields: List of required field names
            
        Returns:
            True if all required fields present, False otherwise
        """
        missing_fields = [field for field in required_fields if field not in state]
        
        if missing_fields:
            self.logger.error(f"Missing required fields: {missing_fields}")
            return False
            
        return True
    
    def extract_messages(self, state: Dict[str, Any]) -> List[BaseMessage]:
        """Extract message history from state"""
        messages = state.get("messages", [])
        
        # Convert dict messages to BaseMessage objects if needed
        processed_messages = []
        for msg in messages:
            if isinstance(msg, dict):
                if msg.get("type") == "human":
                    processed_messages.append(HumanMessage(content=msg["content"]))
                elif msg.get("type") == "ai":
                    processed_messages.append(AIMessage(content=msg["content"]))
            else:
                processed_messages.append(msg)
        
        return processed_messages
    
    async def request_human_input(self, state: Dict[str, Any], 
                                 question: str, options: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Request input from human operator.
        
        Args:
            state: Current state
            question: Question to ask the human
            options: Optional list of valid options
            
        Returns:
            Updated state with human input request
        """
        state = self._update_status(state, AgentStatus.WAITING_FOR_HUMAN)
        
        state["human_input_request"] = {
            "agent": self.name,
            "question": question,
            "options": options,
            "timestamp": datetime.now().isoformat()
        }
        
        return state


# Example concrete implementation
class ExampleMarketingAgent(BaseMarketingAgent):
    """
    Example implementation of a marketing agent.
    
    This shows how to extend the base class for specific functionality.
    """
    
    def __init__(self):
        super().__init__(
            name="example_agent",
            description="Example agent showing base class usage"
        )
    
    def _initialize_tools(self):
        """Register agent-specific tools"""
        
        @tool
        async def example_tool(input_text: str) -> str:
            """Example tool that processes text"""
            return f"Processed: {input_text}"
        
        self.tools.append(example_tool)
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the example task.
        
        This method should:
        1. Validate inputs
        2. Perform the agent's main function
        3. Update state with results
        """
        # Validate required fields
        if not self.validate_state(state, ["task", "user_id"]):
            raise ValueError("Missing required fields in state")
        
        # Extract task details
        task = state.get("task", "")
        user_id = state.get("user_id", "")
        
        self.logger.info(f"Processing task for user {user_id}: {task}")
        
        # Simulate processing
        await asyncio.sleep(1)  # Simulate work
        
        # Update state with results
        state["example_result"] = {
            "processed_at": datetime.now().isoformat(),
            "task": task,
            "status": "completed"
        }
        
        return state


if __name__ == "__main__":
    # Example usage
    async def test_agent():
        agent = ExampleMarketingAgent()
        
        test_state = {
            "task": "Create a test campaign",
            "user_id": "test_user_123",
            "messages": []
        }
        
        result = await agent(test_state)
        print(json.dumps(result, indent=2))
        
        # Get performance metrics
        metrics = agent.get_performance_metrics()
        print(f"\nPerformance metrics: {json.dumps(metrics, indent=2)}")
    
    # Run the test
    asyncio.run(test_agent())