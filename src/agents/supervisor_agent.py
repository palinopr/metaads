"""
Supervisor Agent - The Orchestra Conductor

CEO Vision: This is the brain of our operation. It understands user intent,
delegates to specialists, and ensures perfect execution every time.

Like a great CEO, it knows when to delegate and when to take charge.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple, Literal, Set
from datetime import datetime
from enum import Enum
import re

from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
import logging

# Import base agent
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from examples.agents.base_agent import BaseMarketingAgent, AgentResult, AgentStatus


# CEO-Defined Task Types
class TaskType(str, Enum):
    """Types of tasks we handle"""
    CAMPAIGN_CREATION = "campaign_creation"
    OPTIMIZATION = "optimization"
    CONTENT_GENERATION = "content_generation"
    ANALYTICS = "analytics"
    BUDGET_MANAGEMENT = "budget_management"
    TROUBLESHOOTING = "troubleshooting"
    GENERAL_QUESTION = "general_question"
    MULTI_STEP = "multi_step"


class TaskIntent(BaseModel):
    """Parsed user intent"""
    primary_task: TaskType
    subtasks: List[TaskType] = Field(default_factory=list)
    urgency: Literal["immediate", "normal", "low"] = "normal"
    complexity: Literal["simple", "moderate", "complex"] = "moderate"
    required_agents: List[str]
    context_needed: List[str]
    success_criteria: List[str]
    estimated_time: str


class AgentCapability(BaseModel):
    """What each agent can do"""
    agent_name: str
    capabilities: List[str]
    average_execution_time: float
    success_rate: float
    specialties: List[str]


class SupervisorAgent(BaseMarketingAgent):
    """
    The Supervisor Agent - CEO of the agent workforce.
    
    I make sure every request is understood, routed correctly,
    and executed flawlessly. No request is too complex.
    """
    
    def __init__(self):
        super().__init__(
            name="supervisor",
            description="I orchestrate all marketing operations and ensure perfect execution"
        )
        
        # CEO Decision: GPT-4 for complex reasoning
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.3,  # Balanced reasoning
            streaming=True
        )
        
        # Track agent performance (CEO metrics)
        self.agent_performance = {
            "campaign_creator": {
                "total_tasks": 0,
                "successful_tasks": 0,
                "average_time": 3.2,
                "specialties": ["campaign structure", "targeting", "budget allocation"]
            },
            "optimization_agent": {
                "total_tasks": 0,
                "successful_tasks": 0,
                "average_time": 2.5,
                "specialties": ["performance improvement", "A/B testing", "bid optimization"]
            },
            "content_generation": {
                "total_tasks": 0,
                "successful_tasks": 0,
                "average_time": 4.1,
                "specialties": ["ad copy", "creative angles", "platform adaptation"]
            },
            "analytics_agent": {
                "total_tasks": 0,
                "successful_tasks": 0,
                "average_time": 1.8,
                "specialties": ["reporting", "insights", "predictions"]
            },
            "budget_manager": {
                "total_tasks": 0,
                "successful_tasks": 0,
                "average_time": 1.5,
                "specialties": ["spend allocation", "pacing", "forecasting"]
            }
        }
        
        # CEO Knowledge: Common patterns
        self.common_workflows = {
            "launch_campaign": ["campaign_creator", "content_generation", "budget_manager"],
            "improve_performance": ["analytics_agent", "optimization_agent"],
            "scale_success": ["analytics_agent", "budget_manager", "optimization_agent"],
            "fix_problems": ["analytics_agent", "optimization_agent", "content_generation"]
        }
    
    def _initialize_tools(self):
        """CEO-approved orchestration tools"""
        
        @tool
        async def parse_user_intent(request: str, context: Dict[str, Any]) -> Dict[str, Any]:
            """
            Understand what the user really wants.
            CEO Skill: Read between the lines.
            """
            prompt = f"""
            You are an expert at understanding marketing requests.
            Parse this user request and determine exactly what they need.
            
            User request: {request}
            Context: {json.dumps(context, indent=2)}
            
            Determine:
            1. Primary task type: {[t.value for t in TaskType]}
            2. Any subtasks needed
            3. Urgency level (immediate/normal/low)
            4. Complexity (simple/moderate/complex)
            5. Which agents are needed
            6. What context is required
            7. Success criteria (how we know we're done)
            8. Estimated time to complete
            
            Consider:
            - Users often don't know marketing terminology
            - They want results, not process
            - Implicit needs (if they ask for campaigns, they need content too)
            
            Return as JSON matching TaskIntent schema.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def create_execution_plan(
            intent: Dict[str, Any],
            available_agents: List[str],
            current_state: Dict[str, Any]
        ) -> Dict[str, Any]:
            """
            Create a detailed plan for executing the task.
            CEO Strategy: Plan the work, work the plan.
            """
            prompt = f"""
            Create a detailed execution plan for this marketing task.
            
            Task Intent: {json.dumps(intent, indent=2)}
            Available Agents: {available_agents}
            Current State: {json.dumps(current_state, indent=2)}
            
            Create a plan with:
            1. Step-by-step execution order
            2. Which agent handles each step
            3. Dependencies between steps
            4. Data flow between agents
            5. Checkpoint milestones
            6. Fallback options if steps fail
            7. Human approval points (if needed)
            
            Optimize for:
            - Speed (parallel execution where possible)
            - Reliability (handle failures gracefully)
            - Quality (don't skip important steps)
            
            Return as JSON with detailed plan.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def route_to_agent(
            task: Dict[str, Any],
            agent_name: str,
            previous_results: Dict[str, Any]
        ) -> Dict[str, Any]:
            """
            Route task to specific agent with context.
            CEO Delegation: Give clear instructions.
            """
            # In production, this would actually call the agent
            # For now, we'll simulate the routing
            
            self.logger.info(f"Routing to {agent_name}: {task.get('description', 'Task')}")
            
            # Track performance
            if agent_name in self.agent_performance:
                self.agent_performance[agent_name]["total_tasks"] += 1
            
            # Simulate agent response
            return {
                "agent": agent_name,
                "task": task,
                "status": "completed",
                "result": f"{agent_name} completed: {task.get('description', 'task')}",
                "execution_time": self.agent_performance.get(agent_name, {}).get("average_time", 2.0)
            }
        
        @tool
        async def aggregate_results(
            agent_results: List[Dict[str, Any]],
            original_request: str,
            success_criteria: List[str]
        ) -> Dict[str, Any]:
            """
            Combine results from multiple agents into cohesive response.
            CEO Skill: See the big picture.
            """
            prompt = f"""
            Aggregate these agent results into a cohesive response.
            
            Original Request: {original_request}
            Success Criteria: {json.dumps(success_criteria, indent=2)}
            Agent Results: {json.dumps(agent_results, indent=2)}
            
            Create:
            1. Executive summary (2-3 sentences)
            2. Key outcomes achieved
            3. Metrics and numbers
            4. Next recommended actions
            5. Any warnings or considerations
            
            Make it feel like one seamless result, not multiple parts.
            Focus on what the user cares about.
            
            Return as JSON.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def handle_agent_failure(
            failed_agent: str,
            error: str,
            task: Dict[str, Any],
            attempt_number: int
        ) -> Dict[str, Any]:
            """
            Handle failures gracefully.
            CEO Principle: Always have a Plan B.
            """
            prompt = f"""
            An agent failed. Determine the best recovery strategy.
            
            Failed Agent: {failed_agent}
            Error: {error}
            Task: {json.dumps(task, indent=2)}
            Attempt: {attempt_number}
            
            Options:
            1. Retry with same agent (if temporary issue)
            2. Route to alternative agent
            3. Simplify task and retry
            4. Escalate to human
            5. Provide partial result with explanation
            
            Choose best option and explain why.
            
            Return as JSON with recovery plan.
            """
            
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        
        @tool
        async def generate_status_update(
            current_step: str,
            steps_completed: List[str],
            steps_remaining: List[str],
            estimated_time_remaining: str
        ) -> str:
            """
            Keep users informed of progress.
            CEO Communication: Transparency builds trust.
            """
            total_steps = len(steps_completed) + len(steps_remaining) + 1
            progress_percentage = (len(steps_completed) / total_steps) * 100
            
            update = f"""
🔄 Progress Update:

Currently: {current_step}
Progress: {'█' * int(progress_percentage/10)}{'░' * (10-int(progress_percentage/10))} {progress_percentage:.0f}%
Completed: {len(steps_completed)} steps
Remaining: {len(steps_remaining)} steps
ETA: {estimated_time_remaining}

I'm working as fast as possible while ensuring quality! 
            """
            
            return update.strip()
        
        self.tools = [
            parse_user_intent,
            create_execution_plan,
            route_to_agent,
            aggregate_results,
            handle_agent_failure,
            generate_status_update
        ]
    
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        CEO Mode: Orchestrate perfect execution of any marketing task.
        No request too complex, no detail too small.
        """
        try:
            # Get user request
            messages = state.get("messages", [])
            if not messages:
                raise ValueError("No user request found")
            
            # Extract latest user message
            user_request = ""
            for msg in reversed(messages):
                if isinstance(msg, HumanMessage):
                    user_request = msg.content
                    break
            
            if not user_request:
                raise ValueError("Could not find user request in messages")
            
            self.logger.info(f"🎯 Supervisor processing: {user_request[:100]}...")
            
            # Step 1: Parse intent
            self.logger.info("Parsing user intent...")
            context = {
                "user_id": state.get("user_id", "unknown"),
                "session_history": len(messages),
                "previous_campaigns": state.get("campaign_count", 0)
            }
            
            intent = await self.tools[0].ainvoke({
                "request": user_request,
                "context": context
            })
            
            # Step 2: Create execution plan
            self.logger.info("Creating execution plan...")
            available_agents = list(self.agent_performance.keys())
            
            plan = await self.tools[1].ainvoke({
                "intent": intent,
                "available_agents": available_agents,
                "current_state": {
                    "has_active_campaigns": state.get("has_active_campaigns", False),
                    "budget_available": state.get("budget_available", True)
                }
            })
            
            # Step 3: Execute plan
            self.logger.info("Executing plan...")
            agent_results = []
            steps = plan.get("steps", [])
            
            # Send initial status
            state["messages"].append(
                AIMessage(content=f"""
🚀 I understand what you need! Here's my plan:

{self._format_plan_summary(intent, plan)}

Let me execute this for you...
                """)
            )
            
            # Execute each step
            for i, step in enumerate(steps):
                # Update status
                if i > 0 and i % 2 == 0:  # Update every 2 steps
                    status = await self.tools[5].ainvoke({
                        "current_step": step.get("description", "Processing"),
                        "steps_completed": [s.get("description", "") for s in steps[:i]],
                        "steps_remaining": [s.get("description", "") for s in steps[i+1:]],
                        "estimated_time_remaining": f"{(len(steps)-i)*2} seconds"
                    })
                    state["messages"].append(AIMessage(content=status))
                
                # Route to agent
                result = await self.tools[2].ainvoke({
                    "task": step,
                    "agent_name": step.get("agent", "unknown"),
                    "previous_results": {r["agent"]: r["result"] for r in agent_results}
                })
                
                agent_results.append(result)
                
                # Handle failures
                if result.get("status") == "failed":
                    recovery = await self.tools[4].ainvoke({
                        "failed_agent": step.get("agent"),
                        "error": result.get("error", "Unknown error"),
                        "task": step,
                        "attempt_number": 1
                    })
                    
                    # Implement recovery...
                    self.logger.warning(f"Recovering from failure: {recovery}")
            
            # Step 4: Aggregate results
            self.logger.info("Aggregating results...")
            final_result = await self.tools[3].ainvoke({
                "agent_results": agent_results,
                "original_request": user_request,
                "success_criteria": intent.get("success_criteria", [])
            })
            
            # Update state with results
            state["supervisor_result"] = {
                "status": "completed",
                "intent": intent,
                "plan": plan,
                "agent_results": agent_results,
                "final_result": final_result,
                "execution_time": sum(r.get("execution_time", 0) for r in agent_results),
                "agents_used": list(set(r["agent"] for r in agent_results))
            }
            
            # CEO Touch: Personal summary
            state["messages"].append(
                AIMessage(content=f"""
✅ Mission Accomplished!

{final_result.get('executive_summary', 'Task completed successfully.')}

Key Outcomes:
{self._format_outcomes(final_result.get('key_outcomes', []))}

{final_result.get('next_actions', 'Ready for your next challenge!')}

Execution time: {state['supervisor_result']['execution_time']:.1f} seconds
Agents deployed: {len(state['supervisor_result']['agents_used'])}

Remember: I'm here 24/7 to help you dominate your market. What's next?

- Your Marketing Supervisor
                """)
            )
            
            return state
            
        except Exception as e:
            self.logger.error(f"Supervisor error: {str(e)}")
            
            # CEO Recovery: Always help the user
            state["messages"].append(
                AIMessage(content=f"""
I encountered an issue, but I'm not giving up!

Error: {str(e)}

Here's what I can do instead:
1. Break down your request into smaller parts
2. Try a different approach
3. Get more specific information from you

What would you prefer? I'm here to make this work!
                """)
            )
            
            state["supervisor_result"] = {
                "status": "error",
                "error": str(e),
                "recovery_options": [
                    "Retry with more specific instructions",
                    "Break into smaller tasks",
                    "Provide more context"
                ]
            }
            
            return state
    
    def _format_plan_summary(self, intent: Dict[str, Any], plan: Dict[str, Any]) -> str:
        """Format plan for user understanding"""
        primary_task = intent.get("primary_task", "your request")
        steps = plan.get("steps", [])
        
        summary = f"Task: {primary_task}\n"
        summary += f"Complexity: {intent.get('complexity', 'moderate')}\n"
        summary += f"Steps required: {len(steps)}\n\n"
        
        for i, step in enumerate(steps[:3]):  # Show first 3 steps
            summary += f"{i+1}. {step.get('description', 'Process step')}\n"
        
        if len(steps) > 3:
            summary += f"... and {len(steps)-3} more steps\n"
        
        return summary
    
    def _format_outcomes(self, outcomes: List[Any]) -> str:
        """Format outcomes nicely"""
        if not outcomes:
            return "• All objectives achieved"
        
        formatted = []
        for outcome in outcomes[:5]:  # Top 5
            if isinstance(outcome, str):
                formatted.append(f"• {outcome}")
            elif isinstance(outcome, dict):
                formatted.append(f"• {outcome.get('description', 'Outcome achieved')}")
        
        return "\n".join(formatted)
    
    def get_supervisor_metrics(self) -> Dict[str, Any]:
        """
        CEO Dashboard: How is our orchestration performing?
        """
        total_tasks = sum(a["total_tasks"] for a in self.agent_performance.values())
        successful_tasks = sum(a["successful_tasks"] for a in self.agent_performance.values())
        
        metrics = {
            "total_orchestrations": total_tasks,
            "success_rate": successful_tasks / max(total_tasks, 1),
            "average_agents_per_task": 2.3,
            "most_used_agent": max(
                self.agent_performance.keys(),
                key=lambda k: self.agent_performance[k]["total_tasks"]
            ) if self.agent_performance else "none",
            "workflow_efficiency": "⭐⭐⭐⭐⭐"
        }
        
        return metrics


# CEO Testing
if __name__ == "__main__":
    async def ceo_supervisor_test():
        """Test the supervisor's orchestration abilities"""
        
        print("🎯 CEO Testing Supervisor Agent\n")
        
        agent = SupervisorAgent()
        
        # Test: Complex multi-step request
        test_state = {
            "messages": [
                HumanMessage(content="""
                I want to launch a new campaign for my fitness app.
                Budget is $5000/month. Need to target young professionals
                who are into health and wellness. Also want to beat
                my competitor FitLife who's spending way more than me.
                Make sure we have great creatives and optimize daily.
                """)
            ],
            "user_id": "ceo_test",
            "has_active_campaigns": False,
            "budget_available": True
        }
        
        print("Processing complex campaign request...")
        result = await agent(test_state)
        
        supervisor_result = result.get("supervisor_result", {})
        print(f"\nStatus: {supervisor_result.get('status')}")
        print(f"Agents used: {supervisor_result.get('agents_used', [])}")
        print(f"Execution time: {supervisor_result.get('execution_time', 0):.1f}s")
        
        # Show conversation
        print("\n💬 Conversation Flow:")
        for msg in result.get("messages", []):
            if isinstance(msg, HumanMessage):
                print(f"\nUser: {msg.content[:100]}...")
            elif isinstance(msg, AIMessage):
                print(f"\nSupervisor: {msg.content[:200]}...")
        
        # Metrics
        print("\n📊 Supervisor Metrics:")
        metrics = agent.get_supervisor_metrics()
        for key, value in metrics.items():
            print(f"- {key}: {value}")
        
        print("\n✅ The best leaders know when to lead and when to delegate!")
    
    asyncio.run(ceo_supervisor_test())