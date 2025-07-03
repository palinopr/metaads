# LangGraph Implementation - Pseudo Requirements Prompt (PRP)

## Objective
Implement a working multi-agent system using LangGraph that processes natural language marketing requests and creates structured campaign plans.

## Core Components

### 1. State Definition
```python
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime

class CampaignState(TypedDict):
    # User Input
    user_request: str
    user_id: Optional[str]
    session_id: str
    
    # Parsed Information
    campaign_objective: Optional[str]  # CONVERSIONS, TRAFFIC, AWARENESS
    budget: Optional[float]
    duration_days: Optional[int]
    target_audience: Optional[Dict[str, Any]]
    
    # Generated Content
    campaign_name: Optional[str]
    ad_creative: Optional[Dict[str, Any]]
    
    # Workflow Control
    current_agent: str
    next_agent: Optional[str]
    processing_status: str  # parsing, creating, reviewing, complete, error
    
    # Results
    campaign_plan: Optional[Dict[str, Any]]
    estimated_reach: Optional[int]
    estimated_conversions: Optional[int]
    
    # Error Handling
    errors: List[str]
    warnings: List[str]
```

### 2. Agent Definitions

#### Supervisor Agent
- **Purpose**: Orchestrates the entire workflow
- **Tools**: None (pure logic)
- **Decisions**:
  - If no objective parsed → Campaign Parser Agent
  - If objective but no creative → Creative Generator Agent
  - If all data ready → Campaign Builder Agent
  - If campaign built → Send to frontend

#### Campaign Parser Agent
- **Purpose**: Extract structured data from natural language
- **Tools**: 
  - OpenAI GPT-4 for parsing
  - Validation schemas
- **Input**: Raw user request
- **Output**: Structured campaign parameters

#### Creative Generator Agent
- **Purpose**: Generate ad copy and visuals
- **Tools**:
  - GPT-4 for copywriting
  - DALL-E for image concepts (future)
- **Input**: Campaign objectives and audience
- **Output**: Ad headlines, descriptions, CTAs

#### Campaign Builder Agent
- **Purpose**: Structure everything for Meta Ads API
- **Tools**:
  - Meta Ads format validators
  - Budget optimizer
- **Input**: All campaign data
- **Output**: API-ready campaign object

### 3. Workflow Definition

```python
from langgraph.graph import StateGraph, END

workflow = StateGraph(CampaignState)

# Add nodes
workflow.add_node("supervisor", supervisor_agent)
workflow.add_node("parser", campaign_parser_agent)
workflow.add_node("creative", creative_generator_agent)
workflow.add_node("builder", campaign_builder_agent)

# Set entry point
workflow.set_entry_point("supervisor")

# Add edges
workflow.add_conditional_edges(
    "supervisor",
    route_supervisor,
    {
        "parse": "parser",
        "create": "creative",
        "build": "builder",
        "complete": END
    }
)

workflow.add_edge("parser", "supervisor")
workflow.add_edge("creative", "supervisor")
workflow.add_edge("builder", "supervisor")

# Compile
app = workflow.compile()
```

### 4. Implementation Steps

1. **Set up project structure**
   ```
   src/agents/
   ├── __init__.py
   ├── supervisor.py
   ├── parser.py
   ├── creative.py
   ├── builder.py
   └── tools/
       ├── openai_tools.py
       └── validation.py
   ```

2. **Create base agent class**
   - Async support
   - Error handling
   - Logging
   - State management

3. **Implement each agent**
   - Start with parser (most critical)
   - Test with real examples
   - Add creative generation
   - Finally, campaign building

4. **Connect to API endpoint**
   - Update `/api/campaign/create`
   - Add streaming support
   - Handle errors gracefully

### 5. Example Flow

**User Input**: "I want to promote my new fitness app to millennials in California with a $5000 budget"

**Parser Output**:
```json
{
  "campaign_objective": "APP_INSTALLS",
  "budget": 5000,
  "duration_days": 30,
  "target_audience": {
    "age_min": 25,
    "age_max": 40,
    "genders": ["all"],
    "geo_locations": {
      "regions": [{"key": "3847", "name": "California"}]
    },
    "interests": ["fitness", "health", "mobile apps"]
  }
}
```

**Creative Output**:
```json
{
  "headline": "Transform Your Fitness Journey",
  "description": "Join thousands of millennials already crushing their fitness goals",
  "cta": "Download Now"
}
```

### 6. Testing Strategy

1. **Unit tests for each agent**
2. **Integration tests for workflow**
3. **Real user input tests**
4. **Error scenario tests**

### 7. Performance Requirements

- Parser: < 2 seconds
- Creative: < 3 seconds
- Full workflow: < 10 seconds
- Streaming updates every 500ms

### 8. Error Handling

- Graceful degradation
- User-friendly error messages
- Retry logic for API calls
- Fallback responses

## Next Immediate Actions

1. Install LangGraph and dependencies
2. Create the state schema
3. Implement supervisor agent
4. Build parser agent with GPT-4
5. Test with 10 example inputs
6. Connect to frontend

Remember: Start simple, ship fast, iterate based on real usage.