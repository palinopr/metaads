"""
AI Agent Pattern - MetaAds Standard
This example shows the standard pattern for creating AI agents in MetaAds
"""

import os
from typing import Dict, Any, List, Optional
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain.agents import create_react_agent
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, MessagesState
from langgraph.checkpoint.memory import InMemorySaver

# 1. Environment Configuration
# Always use environment variables for API keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")

# 2. Define Agent Tools
# Tools are the actions your agent can take
@tool
def example_tool(param: str) -> Dict[str, Any]:
    """
    A tool that performs a specific action.
    
    Args:
        param: Description of the parameter
        
    Returns:
        Dictionary containing the result
    """
    # Tool implementation
    return {
        "success": True,
        "result": f"Processed: {param}",
        "timestamp": datetime.now().isoformat()
    }

@tool
def meta_api_tool(endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool for interacting with Meta Ads API
    
    Args:
        endpoint: The API endpoint to call
        params: Parameters for the API call
        
    Returns:
        API response data
    """
    # Mock implementation - replace with actual Meta API call
    return {
        "endpoint": endpoint,
        "status": "success",
        "data": params
    }

# 3. Create the Agent Class
class MetaAdsAgent:
    """Base class for MetaAds AI agents"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.llm = self._init_llm()
        self.tools = self._init_tools()
        self.memory = InMemorySaver()
        
    def _init_llm(self):
        """Initialize the language model based on configuration"""
        if AI_PROVIDER == "anthropic":
            return ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=ANTHROPIC_API_KEY,
                temperature=0.7
            )
        else:
            return ChatOpenAI(
                model="gpt-4",
                api_key=OPENAI_API_KEY,
                temperature=0.7
            )
    
    def _init_tools(self) -> List:
        """Initialize agent tools - override in subclasses"""
        return [example_tool, meta_api_tool]
    
    def create_prompt(self) -> ChatPromptTemplate:
        """Create the agent's system prompt"""
        return ChatPromptTemplate.from_messages([
            ("system", f"""You are {self.name}, a specialized AI agent for MetaAds.
            
            {self.description}
            
            Guidelines:
            - Always validate user inputs before processing
            - Provide clear explanations for your actions
            - Handle errors gracefully and suggest alternatives
            - Use tools efficiently to accomplish tasks
            """),
            ("human", "{input}"),
            ("assistant", "I'll help you with that. Let me process your request.")
        ])
    
    async def process(self, user_input: str, session_id: str) -> Dict[str, Any]:
        """Process user input and return response"""
        try:
            # Create the agent
            agent = create_react_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=self.create_prompt()
            )
            
            # Execute with memory
            response = await agent.ainvoke(
                {"input": user_input},
                config={"configurable": {"session_id": session_id}}
            )
            
            return {
                "success": True,
                "response": response,
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id
            }

# 4. Example Specialized Agent
class CampaignOptimizationAgent(MetaAdsAgent):
    """Agent specialized in campaign optimization"""
    
    def __init__(self):
        super().__init__(
            name="Campaign Optimization Agent",
            description="I help optimize Meta Ads campaigns for better performance"
        )
    
    def _init_tools(self) -> List:
        """Add optimization-specific tools"""
        base_tools = super()._init_tools()
        return base_tools + [
            self.analyze_performance,
            self.suggest_optimizations,
            self.apply_changes
        ]
    
    @tool
    def analyze_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Analyze campaign performance metrics"""
        # Implementation would fetch real metrics
        return {
            "campaign_id": campaign_id,
            "ctr": 2.5,
            "cpc": 0.75,
            "conversions": 150,
            "spend": 1000,
            "recommendations": [
                "Increase budget for high-performing ad sets",
                "Pause underperforming creatives",
                "Test new audiences similar to converters"
            ]
        }
    
    @tool
    def suggest_optimizations(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest optimizations based on metrics"""
        suggestions = []
        
        if metrics.get("ctr", 0) < 1.0:
            suggestions.append({
                "type": "creative",
                "action": "refresh",
                "reason": "Low CTR indicates ad fatigue"
            })
        
        if metrics.get("cpc", 0) > 1.0:
            suggestions.append({
                "type": "bidding",
                "action": "adjust",
                "reason": "High CPC - consider bid cap strategy"
            })
        
        return suggestions
    
    @tool
    def apply_changes(self, campaign_id: str, changes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Apply optimization changes to campaign"""
        # Implementation would apply changes via Meta API
        return {
            "campaign_id": campaign_id,
            "applied_changes": len(changes),
            "status": "success",
            "message": f"Applied {len(changes)} optimizations"
        }

# 5. Usage Pattern
async def main():
    """Example usage of the agent"""
    
    # Initialize agent
    agent = CampaignOptimizationAgent()
    
    # Process user request
    result = await agent.process(
        user_input="Analyze campaign 123 and optimize for lower CPC",
        session_id="user-session-123"
    )
    
    print(result)

# 6. Integration with Next.js API Routes
# See agent-api-integration.ts for how to call this from Next.js

if __name__ == "__main__":
    asyncio.run(main())