# AI Marketing Automation - Global AI Assistant Rules

## Project Overview

This is an AI-powered marketing automation platform that makes creating and managing marketing campaigns as easy as having a conversation. Built with LangGraph for multi-agent orchestration and Context Engineering for reliability.

**Vision**: "Claude Code for Marketing" - where non-technical users can create, manage, and optimize campaigns using natural language.

## Pre-Development Checklist

Before implementing any features:
1. **Environment Setup**: Ensure Python 3.9+ and Node.js 18+ are installed
2. **Dependencies**: Run `pip install -r requirements.txt` and `npm install`
3. **LangGraph**: Verify LangGraph and LangChain are properly installed
4. **API Keys**: Check `.env` has required keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
5. **Database**: Ensure PostgreSQL/SQLite is running for development

## Critical Rules

### 1. Context Engineering First
- **ALWAYS** create an INITIAL.md before building features
- Generate PRPs using the systematic approach
- Validate each implementation step
- Document patterns for reuse

### 2. Agent Development Standards
- Each agent lives in `src/agents/` as a Python file
- Follow the base agent template in `examples/agents/base_agent.py`
- All agents must support async execution
- Implement comprehensive error handling
- Use Pydantic for input/output validation

### 3. LangGraph Patterns
- Define clear state schemas for each workflow
- Use TypedDict for state definitions
- Implement checkpointing for all workflows
- Add interrupt points for human approval
- Enable LangSmith tracing in production

### 4. Technology Stack
- **Orchestration**: LangGraph for agent workflows
- **LLMs**: OpenAI GPT-4 (complex), GPT-3.5 (simple), Claude (analysis)
- **Frontend**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Monitoring**: LangSmith for observability

### 5. Code Organization
```
src/
├── agents/           # Python agent implementations
├── workflows/        # LangGraph workflow definitions
├── app/             # Next.js frontend
├── components/      # React components
├── lib/            # Utilities and integrations
├── db/             # Database schemas
└── types/          # TypeScript/Python type definitions
```

### 6. Agent Communication Protocol
- Agents communicate through shared state only
- No direct agent-to-agent calls
- Supervisor agent manages complex workflows
- State updates must be atomic
- Include correlation IDs for tracking

### 7. Performance Requirements
- Agent response time < 3 seconds
- Workflow completion < 10 seconds
- Stream responses for long operations
- Cache API responses appropriately
- Implement circuit breakers

### 8. Testing Standards
- Unit tests for each agent tool
- Integration tests for workflows
- Mock external API calls
- Test error scenarios
- Minimum 80% code coverage

### 9. Security Guidelines
- Never log sensitive data (API keys, tokens)
- Validate all user inputs
- Implement rate limiting
- Use environment variables for secrets
- Sanitize LLM outputs

### 10. Error Handling
- Always provide user-friendly error messages
- Log errors with full context
- Implement retry logic with backoff
- Graceful degradation for failures
- Never expose internal errors to users

## Common Patterns

### Agent Implementation Pattern
```python
from typing import Dict, Any, List
from langchain.tools import tool
from pydantic import BaseModel, Field
import logging

class AgentInput(BaseModel):
    """Input schema for agent"""
    task: str = Field(description="Task description")
    context: Dict[str, Any] = Field(default_factory=dict)

class MarketingAgent:
    """Base agent implementation"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(name)
        self.tools = self._setup_tools()
    
    @tool
    async def process_task(self, input: AgentInput) -> Dict[str, Any]:
        """Main agent entry point"""
        try:
            # Implementation
            return {"status": "success", "result": result}
        except Exception as e:
            self.logger.error(f"Error in {self.name}: {e}")
            return {"status": "error", "message": str(e)}
    
    def _setup_tools(self) -> List:
        """Define agent-specific tools"""
        return []
```

### Workflow Pattern
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class WorkflowState(TypedDict):
    messages: Annotated[list, operator.add]
    current_agent: str
    task_status: str
    results: dict

# Build workflow
workflow = StateGraph(WorkflowState)

# Add nodes
workflow.add_node("supervisor", supervisor_agent)
workflow.add_node("specialist", specialist_agent)

# Add edges
workflow.set_entry_point("supervisor")
workflow.add_conditional_edges(
    "supervisor",
    route_decision,
    {
        "continue": "specialist",
        "complete": END
    }
)

# Compile
app = workflow.compile(checkpointer=checkpointer)
```

### State Management Pattern
```python
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    # Message history
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # Workflow control
    current_agent: str
    next_agent: str
    
    # Task tracking
    task_id: str
    task_status: Literal["pending", "in_progress", "completed", "failed"]
    
    # Results
    results: Dict[str, Any]
    errors: List[str]
    
    # Metadata
    user_id: str
    session_id: str
    timestamp: datetime
```

## Known Gotchas

### LangGraph Specific
1. **State Updates**: Must use reducers for list fields
2. **Checkpointing**: Requires serializable state
3. **Async Execution**: All node functions must be async
4. **Graph Compilation**: Happens once, plan accordingly
5. **Human-in-the-Loop**: Requires interrupt_before configuration

### Agent Development
6. **Token Limits**: Monitor usage, implement streaming
7. **API Rate Limits**: Use exponential backoff
8. **Memory Management**: Clear agent memory periodically
9. **Tool Timeouts**: Set appropriate timeouts for external calls
10. **Error Propagation**: Catch errors at agent boundaries

### Integration Issues
11. **LangSmith**: Requires specific environment variables
12. **Streaming**: Use Server-Sent Events for real-time updates
13. **CORS**: Configure properly for API endpoints
14. **Authentication**: Integrate with Supabase carefully
15. **Database Connections**: Use connection pooling

## Validation Commands
```bash
# Python environment
python -m pytest tests/
python -m mypy src/

# Frontend
npm run lint
npm run typecheck
npm run build

# Integration tests
python tests/integration/test_workflows.py

# LangSmith validation
python scripts/validate_langsmith.py
```

## Development Workflow

### Feature Development
1. Create INITIAL.md with requirements
2. Generate PRP using context engineering
3. Implement agents following patterns
4. Create workflow connecting agents
5. Add frontend integration
6. Write comprehensive tests
7. Deploy with monitoring

### Debugging Workflow
1. Enable LangSmith tracing
2. Add debug logging to agents
3. Use LangGraph visualizer
4. Check state at each step
5. Validate tool inputs/outputs

## Resources
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangSmith Guide](https://docs.smith.langchain.com/)
- [Context Engineering Best Practices](https://github.com/coleam00/context-engineering-intro)
- Internal: `examples/` directory for patterns

## Performance Optimization

### Caching Strategy
```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def get_cached_response(query_hash: str):
    """Cache frequently requested data"""
    pass

def hash_query(query: dict) -> str:
    """Create cache key from query"""
    return hashlib.md5(json.dumps(query, sort_keys=True).encode()).hexdigest()
```

### Streaming Responses
```python
async def stream_agent_response(agent, input_data):
    """Stream responses for better UX"""
    async for chunk in agent.astream(input_data):
        yield f"data: {json.dumps(chunk)}\n\n"
```

## Monitoring and Alerts

### Key Metrics to Track
- Agent execution time
- Workflow completion rate
- Error rates by agent
- Token usage per request
- API call volumes
- User satisfaction scores

### Alert Thresholds
- Error rate > 5%: Warning
- Response time > 5s: Warning
- Token usage > 80% limit: Critical
- API failures > 10/min: Critical

Remember: We're building the future of marketing automation. Every line of code should make marketing easier for our users.