# Product Requirements Prompt (PRP) - AgentOS Platform Transformation

## 1. Goal / Why / What

### Goal
Transform MetaAds into AgentOS - a universal AI agent platform that enables businesses to create, deploy, and manage intelligent automation agents for any business process.

### Why
- **Market Opportunity**: $50B+ business automation market with no dominant platform
- **Technical Readiness**: LangGraph provides production-ready infrastructure
- **Competitive Advantage**: First comprehensive agent platform vs point solutions
- **Revenue Expansion**: Platform model with marketplace enables 100x growth

### What
- Multi-agent orchestration platform built on LangGraph
- No-code agent builder for business users
- Agent marketplace with developer ecosystem
- Enterprise-grade monitoring and governance
- Migration of existing MetaAds features as flagship agents

## 2. All Needed Context

### Documentation to Read
- [ ] LangGraph Documentation: https://langchain-ai.github.io/langgraph/
- [ ] LangSmith Monitoring: https://docs.smith.langchain.com/
- [ ] Context Engineering from langgraph-context-engineering/
- [ ] Existing MetaAds architecture in AI_INTELLIGENCE_ARCHITECTURE.md
- [ ] Multi-tenant SaaS patterns

### Examples to Reference
- [ ] LangGraph supervisor pattern: `langgraph-context-engineering/examples/workflows/supervisor_pattern.py`
- [ ] State management: `langgraph-context-engineering/examples/state-management/checkpointing_example.py`
- [ ] Existing MetaAds agents: `src/agents/`
- [ ] Current API patterns: `examples/api-route-pattern.ts`

### Known Constraints & Gotchas
- LangGraph requires Python runtime alongside Next.js
- State persistence needs PostgreSQL with JSON support
- Agent execution costs scale with usage
- Multi-tenancy requires careful state isolation
- Real-time features need WebSocket support

## 3. Implementation Blueprint

### Core Architecture

```typescript
// Platform State Schema
interface AgentOSState {
  // User Context
  tenantId: string
  userId: string
  organizationId: string
  
  // Agent Context
  activeAgents: AgentInstance[]
  agentMemory: Record<string, any>
  
  // Workflow Context
  workflowId: string
  workflowState: Record<string, any>
  messages: Message[]
  
  // Execution Context
  currentNode: string
  executionHistory: ExecutionStep[]
  pendingApprovals: ApprovalRequest[]
  
  // Business Context
  connectedServices: ServiceConnection[]
  businessData: Record<string, any>
}

// Agent Registry
interface AgentDefinition {
  id: string
  name: string
  category: string
  description: string
  version: string
  author: string
  
  // LangGraph Configuration
  graphDefinition: string  // Python code
  requiredTools: string[]
  stateSchema: Record<string, any>
  
  // Platform Integration
  pricing: PricingModel
  permissions: string[]
  icon: string
  documentation: string
}
```

### Database Schema Changes

```sql
-- Agent Registry
CREATE TABLE agent_definitions (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  version VARCHAR(50),
  author_id UUID REFERENCES users(id),
  graph_definition TEXT, -- Python LangGraph code
  state_schema JSONB,
  required_tools TEXT[],
  pricing JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMP,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Agent Instances
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  agent_definition_id UUID REFERENCES agent_definitions(id),
  name VARCHAR(255),
  config JSONB,
  state JSONB, -- LangGraph state
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Definitions
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255),
  description TEXT,
  graph_config JSONB, -- Multi-agent workflow
  trigger_config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Marketplace
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY,
  agent_definition_id UUID REFERENCES agent_definitions(id),
  price_model VARCHAR(50), -- 'free', 'paid', 'freemium'
  price_amount DECIMAL(10,2),
  trial_days INTEGER,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Execution Logs
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY,
  agent_instance_id UUID REFERENCES agent_instances(id),
  workflow_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(50),
  input_data JSONB,
  output_data JSONB,
  token_usage JSONB,
  error_details TEXT
);
```

### Task List

#### Phase 1: Foundation (Weeks 1-4)

1. [ ] **LangGraph Integration**
   - [ ] Set up Python backend service alongside Next.js
   - [ ] Create TypeScript-Python bridge via API
   - [ ] Implement state persistence with PostgreSQL
   - [ ] Set up LangSmith for monitoring

2. [ ] **Core Platform Features**
   - [ ] Multi-tenant organization system
   - [ ] Agent registry and storage
   - [ ] Execution runtime with sandboxing
   - [ ] Basic monitoring dashboard

3. [ ] **Agent Development SDK**
   - [ ] TypeScript SDK for agent metadata
   - [ ] Python SDK for LangGraph agents
   - [ ] Local development environment
   - [ ] Testing framework

#### Phase 2: Agent Builder (Weeks 5-8)

4. [ ] **Visual Workflow Designer**
   - [ ] React Flow-based UI
   - [ ] Drag-and-drop agent nodes
   - [ ] Configuration panels
   - [ ] Preview and testing

5. [ ] **No-Code Agent Creation**
   - [ ] Template library
   - [ ] Natural language to workflow
   - [ ] Built-in tool library
   - [ ] Version control

6. [ ] **Agent Marketplace MVP**
   - [ ] Publishing workflow
   - [ ] Search and discovery
   - [ ] Installation process
   - [ ] Basic monetization

#### Phase 3: Enterprise Features (Weeks 9-12)

7. [ ] **Security & Governance**
   - [ ] Role-based access control
   - [ ] Audit logging
   - [ ] Compliance frameworks
   - [ ] Data isolation

8. [ ] **Advanced Orchestration**
   - [ ] Multi-agent workflows
   - [ ] Human-in-the-loop approvals
   - [ ] Scheduled executions
   - [ ] Event-driven triggers

9. [ ] **Integration Hub**
   - [ ] 50+ pre-built connectors
   - [ ] OAuth management
   - [ ] Webhook system
   - [ ] API gateway

### Key Implementation Details

#### 1. Python-TypeScript Bridge
```typescript
// API endpoint for agent execution
export async function POST(req: Request) {
  const { agentId, input, config } = await req.json()
  
  // Call Python LangGraph service
  const response = await fetch('http://langgraph-service:8000/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      input: input,
      config: config,
      tenant_id: session.user.organizationId
    })
  })
  
  // Stream response back to client
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

#### 2. Agent Definition Example
```python
# Sales Outreach Agent
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
from typing import TypedDict, Annotated, List
import operator

class SalesOutreachState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    prospects: List[dict]
    email_drafts: List[dict]
    campaign_metrics: dict
    next_action: str

@traceable
async def analyze_prospects(state: SalesOutreachState) -> SalesOutreachState:
    """Analyze prospect list and segment by fit score"""
    # Implementation
    return state

@traceable  
async def generate_personalized_email(state: SalesOutreachState) -> SalesOutreachState:
    """Generate personalized outreach emails"""
    # Implementation
    return state

# Build workflow
workflow = StateGraph(SalesOutreachState)
workflow.add_node("analyze", analyze_prospects)
workflow.add_node("generate", generate_personalized_email)
workflow.add_edge("analyze", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()
```

#### 3. Marketplace Integration
```typescript
// Install agent from marketplace
export async function installAgent(
  agentDefinitionId: string,
  organizationId: string
) {
  // 1. Check permissions and payment
  const hasAccess = await checkMarketplaceAccess(agentDefinitionId, organizationId)
  
  // 2. Create agent instance
  const instance = await db.insert(agentInstances).values({
    organizationId,
    agentDefinitionId,
    name: `${agentDef.name} Instance`,
    config: agentDef.defaultConfig,
    status: 'active'
  })
  
  // 3. Deploy to Python runtime
  await deployAgentToRuntime(instance.id, agentDef.graphDefinition)
  
  // 4. Track installation
  await incrementDownloadCount(agentDefinitionId)
  
  return instance
}
```

## 4. Migration Strategy

### Phase 1: Dual Operation
- Keep MetaAds running as-is
- Build AgentOS in parallel
- Share authentication and user base

### Phase 2: Feature Parity
- Recreate Meta Ads agents in LangGraph
- Migrate AI Lab to new architecture
- Test with pilot customers

### Phase 3: Sunset MetaAds
- Migrate all users to AgentOS
- Maintain backwards compatibility
- Deprecate old codebase

## 5. Success Criteria

### Technical Metrics
- [ ] 99.9% uptime for agent execution
- [ ] < 2s agent startup time
- [ ] < 500ms API response time
- [ ] Support 10,000 concurrent agents

### Business Metrics
- [ ] 100 agents in marketplace (Month 3)
- [ ] 1,000 active organizations (Month 6)
- [ ] $1M ARR (Month 9)
- [ ] 50% of revenue from marketplace (Month 12)

### Quality Metrics
- [ ] 90% agent success rate
- [ ] < 5% execution errors
- [ ] 4.5+ marketplace rating
- [ ] 80% developer satisfaction

## 6. Rollout Plan

### Week 1-2: Foundation
- Set up LangGraph infrastructure
- Create development environment
- Build core execution engine

### Week 3-4: First Agents
- Migrate Meta Ads functionality
- Create 5 showcase agents
- Internal testing

### Month 2: Closed Beta
- 10 pilot customers
- 20 agents available
- Gather feedback

### Month 3: Public Launch
- Open marketplace
- Developer program
- Marketing campaign

## 7. Risk Mitigation

### Technical Risks
- **Python/Node complexity** → Clear service boundaries
- **Scaling issues** → Kubernetes from day 1
- **State management** → PostgreSQL with partitioning
- **Security concerns** → Sandboxed execution

### Business Risks
- **Market education** → Strong content marketing
- **Developer adoption** → Generous revenue sharing
- **Enterprise trust** → SOC2 certification
- **Competition** → Fast execution, network effects

---

**Next Steps**: 
1. Review and approve transformation plan
2. Hire Python/LangGraph engineers
3. Set up infrastructure
4. Begin Phase 1 implementation