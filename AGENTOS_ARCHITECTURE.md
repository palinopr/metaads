# AgentOS Technical Architecture

## System Overview

AgentOS is a multi-tenant AI agent platform that combines Next.js frontend with LangGraph agent orchestration backend, enabling businesses to build, deploy, and manage intelligent automation agents.

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js UI]
        SDK[AgentOS SDK]
    end
    
    subgraph "API Gateway"
        APIG[Next.js API Routes]
        Auth[Auth Service]
        RateLimit[Rate Limiter]
    end
    
    subgraph "Core Services"
        AS[Agent Service]
        WS[Workflow Service]
        ES[Execution Service]
        MS[Marketplace Service]
    end
    
    subgraph "LangGraph Runtime"
        LG[LangGraph Engine]
        SM[State Manager]
        TM[Tool Manager]
        CH[Checkpointer]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        Redis[(Redis)]
        S3[S3 Storage]
    end
    
    subgraph "Monitoring"
        LS[LangSmith]
        Logs[Logging]
        Metrics[Metrics]
    end
    
    UI --> APIG
    SDK --> APIG
    APIG --> Auth
    APIG --> RateLimit
    APIG --> AS
    APIG --> WS
    APIG --> ES
    APIG --> MS
    
    AS --> LG
    WS --> LG
    ES --> LG
    
    LG --> SM
    LG --> TM
    LG --> CH
    
    SM --> PG
    SM --> Redis
    CH --> PG
    AS --> S3
    
    LG --> LS
    AS --> Logs
    ES --> Metrics
```

## Core Components

### 1. Next.js Frontend & API Gateway

```typescript
// app/api/agents/execute/route.ts
import { createExecutionStream } from '@/lib/langgraph/client'

export async function POST(req: Request) {
  const session = await auth()
  const { agentId, input, config } = await req.json()
  
  // Validate access
  const agent = await validateAgentAccess(agentId, session.user.id)
  
  // Create execution stream
  const stream = await createExecutionStream({
    agentId,
    input,
    config,
    userId: session.user.id,
    organizationId: session.user.organizationId
  })
  
  // Return SSE stream
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### 2. LangGraph Service Architecture

```python
# services/langgraph_service/main.py
from fastapi import FastAPI, HTTPException
from langgraph.graph import StateGraph
from langchain_core.runnables import ConfigurableField
import uvicorn

app = FastAPI()

class AgentRegistry:
    """Manages all registered agents"""
    
    def __init__(self):
        self.agents = {}
        self.load_agents()
    
    def load_agents(self):
        """Load agent definitions from database"""
        # Load and compile agent graphs
        pass
    
    def get_agent(self, agent_id: str, tenant_id: str):
        """Get agent instance for tenant"""
        # Ensure tenant isolation
        return self.agents[agent_id].with_config(
            configurable={"tenant_id": tenant_id}
        )

registry = AgentRegistry()

@app.post("/execute")
async def execute_agent(
    agent_id: str,
    input: dict,
    config: dict,
    tenant_id: str
):
    """Execute an agent with streaming response"""
    
    # Get agent instance
    agent = registry.get_agent(agent_id, tenant_id)
    
    # Stream execution
    async for chunk in agent.astream(input, config):
        yield f"data: {json.dumps(chunk)}\n\n"

@app.post("/agents/deploy")
async def deploy_agent(
    agent_definition: dict,
    tenant_id: str
):
    """Deploy a new agent definition"""
    
    # Validate agent code
    validator = AgentValidator()
    validation_result = validator.validate(agent_definition)
    
    if not validation_result.is_valid:
        raise HTTPException(400, validation_result.errors)
    
    # Compile and register
    compiled_agent = compile_agent(agent_definition)
    registry.register(compiled_agent, tenant_id)
    
    return {"status": "deployed", "agent_id": compiled_agent.id}
```

### 3. Multi-Tenant State Management

```python
# services/langgraph_service/state_manager.py
from langgraph.checkpoint.postgres import PostgresSaver
from contextlib import contextmanager

class MultiTenantCheckpointer:
    """Manages state isolation per tenant"""
    
    def __init__(self, connection_string: str):
        self.base_connection = connection_string
        self.tenant_checkpointers = {}
    
    def get_checkpointer(self, tenant_id: str):
        """Get or create tenant-specific checkpointer"""
        if tenant_id not in self.tenant_checkpointers:
            # Create tenant-specific schema
            schema_name = f"tenant_{tenant_id.replace('-', '_')}"
            checkpointer = PostgresSaver.from_conn_string(
                self.base_connection,
                schema=schema_name
            )
            self.tenant_checkpointers[tenant_id] = checkpointer
        
        return self.tenant_checkpointers[tenant_id]
    
    @contextmanager
    def tenant_context(self, tenant_id: str):
        """Context manager for tenant operations"""
        checkpointer = self.get_checkpointer(tenant_id)
        yield checkpointer
```

### 4. Agent Builder Service

```typescript
// lib/agent-builder/types.ts
export interface AgentNode {
  id: string
  type: 'llm' | 'tool' | 'condition' | 'human'
  position: { x: number; y: number }
  data: {
    label: string
    config: Record<string, any>
  }
}

export interface AgentEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface AgentGraph {
  nodes: AgentNode[]
  edges: AgentEdge[]
  metadata: {
    name: string
    description: string
    version: string
  }
}

// lib/agent-builder/compiler.ts
export class AgentCompiler {
  /**
   * Compiles visual graph to LangGraph Python code
   */
  compile(graph: AgentGraph): string {
    const imports = this.generateImports()
    const stateClass = this.generateStateClass(graph)
    const nodeFunctions = this.generateNodeFunctions(graph)
    const workflowDef = this.generateWorkflow(graph)
    
    return `${imports}\n\n${stateClass}\n\n${nodeFunctions}\n\n${workflowDef}`
  }
  
  private generateWorkflow(graph: AgentGraph): string {
    const lines = ['workflow = StateGraph(AgentState)']
    
    // Add nodes
    graph.nodes.forEach(node => {
      lines.push(`workflow.add_node("${node.id}", ${node.id}_handler)`)
    })
    
    // Add edges
    graph.edges.forEach(edge => {
      if (edge.condition) {
        lines.push(`workflow.add_conditional_edges("${edge.source}", ${edge.condition})`)
      } else {
        lines.push(`workflow.add_edge("${edge.source}", "${edge.target}")`)
      }
    })
    
    lines.push('app = workflow.compile()')
    return lines.join('\n')
  }
}
```

### 5. Marketplace Architecture

```typescript
// Database schema for marketplace
interface MarketplaceAgent {
  id: string
  slug: string // Unique URL-friendly name
  name: string
  description: string
  category: Category
  tags: string[]
  
  // Versioning
  versions: Version[]
  latestVersion: string
  
  // Author
  authorId: string
  authorName: string
  verified: boolean
  
  // Metrics
  downloads: number
  rating: number
  reviews: Review[]
  
  // Pricing
  pricing: {
    model: 'free' | 'paid' | 'freemium'
    price?: number
    trialDays?: number
  }
  
  // Technical
  requiredPermissions: string[]
  supportedIntegrations: string[]
}

// Marketplace service
export class MarketplaceService {
  async publishAgent(
    agentDefinition: AgentDefinition,
    authorId: string
  ): Promise<MarketplaceAgent> {
    // 1. Validate agent
    await this.validateAgent(agentDefinition)
    
    // 2. Security scan
    await this.securityScan(agentDefinition.code)
    
    // 3. Performance test
    await this.performanceTest(agentDefinition)
    
    // 4. Create listing
    const listing = await this.createListing(agentDefinition, authorId)
    
    // 5. Deploy to CDN
    await this.deploytoCDN(listing)
    
    return listing
  }
  
  async installAgent(
    agentId: string,
    organizationId: string
  ): Promise<AgentInstance> {
    // 1. Check access and payment
    await this.verifyAccess(agentId, organizationId)
    
    // 2. Create instance
    const instance = await this.createInstance(agentId, organizationId)
    
    // 3. Deploy to runtime
    await this.deployToRuntime(instance)
    
    // 4. Configure permissions
    await this.configurePermissions(instance)
    
    return instance
  }
}
```

## Deployment Architecture

### Container Structure

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Next.js Frontend
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LANGGRAPH_SERVICE_URL=http://langgraph:8000
    depends_on:
      - postgres
      - redis
  
  # LangGraph Python Service
  langgraph:
    build: ./services/langgraph
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/agentos
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./agents:/app/agents
  
  # Agent Builder Service
  agent-builder:
    build: ./services/agent-builder
    ports:
      - "8001:8001"
    depends_on:
      - langgraph
  
  # PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agentos
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  # Redis for caching and queues
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  # LangSmith Proxy (optional)
  langsmith-proxy:
    image: langchain/langsmith-proxy
    environment:
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
    ports:
      - "8002:8002"

volumes:
  postgres_data:
```

### Kubernetes Production Setup

```yaml
# k8s/agentos-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentos-langgraph
spec:
  replicas: 10  # Scale based on load
  selector:
    matchLabels:
      app: langgraph
  template:
    metadata:
      labels:
        app: langgraph
    spec:
      containers:
      - name: langgraph
        image: agentos/langgraph:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        env:
        - name: WORKER_CONCURRENCY
          value: "4"
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: langgraph-service
spec:
  selector:
    app: langgraph
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: langgraph-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentos-langgraph
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Security Architecture

### 1. Agent Sandboxing
```python
# Restricted execution environment
class AgentSandbox:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.allowed_tools = self.load_allowed_tools()
        
    def execute(self, agent_code: str, input_data: dict):
        # Create restricted globals
        restricted_globals = {
            '__builtins__': self.safe_builtins,
            'tools': self.allowed_tools,
            'state': self.create_tenant_state()
        }
        
        # Execute in sandbox
        exec(agent_code, restricted_globals)
```

### 2. API Security
```typescript
// Rate limiting per tenant
export const rateLimiter = new RateLimiter({
  points: 100, // requests
  duration: 60, // per minute
  keyPrefix: 'agent_exec',
  execEvenly: true
})

// API key management
export async function validateAPIKey(
  key: string,
  requiredScopes: string[]
): Promise<APIKeyInfo> {
  const keyInfo = await getAPIKeyInfo(key)
  
  if (!keyInfo || !keyInfo.active) {
    throw new UnauthorizedError('Invalid API key')
  }
  
  const hasScopes = requiredScopes.every(
    scope => keyInfo.scopes.includes(scope)
  )
  
  if (!hasScopes) {
    throw new ForbiddenError('Insufficient permissions')
  }
  
  return keyInfo
}
```

## Performance Optimization

### 1. Caching Strategy
```typescript
// Multi-level caching
export class AgentCache {
  constructor(
    private redis: Redis,
    private localCache: LRUCache
  ) {}
  
  async get(key: string): Promise<any> {
    // L1: Local memory
    const local = this.localCache.get(key)
    if (local) return local
    
    // L2: Redis
    const cached = await this.redis.get(key)
    if (cached) {
      this.localCache.set(key, cached)
      return cached
    }
    
    return null
  }
}
```

### 2. Connection Pooling
```python
# PostgreSQL connection pool for checkpointing
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

## Monitoring & Observability

### 1. LangSmith Integration
```python
# Automatic tracing for all agents
from langsmith import traceable

@traceable(run_type="agent")
async def execute_agent(agent_id: str, input: dict):
    # All LangGraph operations automatically traced
    pass
```

### 2. Custom Metrics
```typescript
// Prometheus metrics
export const metrics = {
  agentExecutions: new Counter({
    name: 'agentos_agent_executions_total',
    help: 'Total agent executions',
    labelNames: ['agent_id', 'status', 'tenant_id']
  }),
  
  executionDuration: new Histogram({
    name: 'agentos_execution_duration_seconds',
    help: 'Agent execution duration',
    labelNames: ['agent_id'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  })
}
```

## Data Flow Example

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Next.js UI
    participant API as API Gateway
    participant LG as LangGraph Service
    participant DB as PostgreSQL
    participant LS as LangSmith
    
    U->>UI: Create workflow
    UI->>API: POST /api/workflows
    API->>API: Validate & compile
    API->>LG: Deploy workflow
    LG->>DB: Store definition
    LG->>LS: Register workflow
    
    U->>UI: Execute workflow
    UI->>API: POST /api/execute
    API->>LG: Stream execution
    LG->>LS: Trace execution
    loop For each step
        LG->>DB: Checkpoint state
        LG->>API: Stream results
        API->>UI: SSE update
        UI->>U: Show progress
    end
    
    LG->>DB: Final state
    LG->>LS: Complete trace
    API->>UI: Completion
    UI->>U: Show results
```

---

This architecture provides:
- **Scalability**: Horizontal scaling of all components
- **Reliability**: State persistence and error recovery
- **Security**: Multi-tenant isolation and sandboxing
- **Observability**: Complete tracing and monitoring
- **Extensibility**: Plugin architecture for new agents